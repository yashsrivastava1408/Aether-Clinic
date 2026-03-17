"""
Aether Clinic — Medical Knowledge Ingestion Service
====================================================
Reads medical corpus files (.txt), chunks them intelligently by protocol/title,
generates embeddings using sentence-transformers, and stores them in ChromaDB.

Run this script once (or whenever you add new medical files) to populate the vector database.

Usage:
    python ingestion_service.py
"""

import os
import glob
import hashlib
import re
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

# =============================
# Configuration
# =============================
CORPUS_DIR = os.path.join(os.path.dirname(__file__), "data", "medical_corpus")
CHROMA_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
COLLECTION_NAME = "medical_knowledge"

# Embedding model — lightweight but accurate for medical text
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Chunk settings
MAX_CHUNK_SIZE = 1000   # Characters per chunk
CHUNK_OVERLAP = 150     # Overlap between chunks for context continuity


def extract_metadata(text_block: str) -> dict:
    """
    Extracts structured metadata (TITLE, SOURCE, CATEGORY) from a text block header.
    """
    metadata = {
        "title": "Unknown Protocol",
        "source": "Internal Medical Protocol",
        "category": "General Medicine"
    }

    title_match = re.search(r"TITLE:\s*(.+)", text_block)
    source_match = re.search(r"SOURCE:\s*(.+)", text_block)
    category_match = re.search(r"CATEGORY:\s*(.+)", text_block)

    if title_match:
        metadata["title"] = title_match.group(1).strip()
    if source_match:
        metadata["source"] = source_match.group(1).strip()
    if category_match:
        metadata["category"] = category_match.group(1).strip()

    return metadata


def split_into_protocols(file_content: str) -> list[str]:
    """
    Splits a file into separate protocol blocks using '---' as delimiter.
    Each block starts with TITLE/SOURCE/CATEGORY metadata.
    """
    # Split on lines that are just '---' (markdown horizontal rules)
    blocks = re.split(r"\n---\s*\n", file_content)
    # Filter out empty blocks
    return [block.strip() for block in blocks if block.strip() and len(block.strip()) > 50]


def chunk_text(text: str, max_size: int = MAX_CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """
    Splits text into overlapping chunks. Tries to break on paragraph/newline boundaries.
    """
    if len(text) <= max_size:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        end = start + max_size

        # Try to find a good breakpoint (paragraph or newline)
        if end < len(text):
            # Look for paragraph break first
            para_break = text.rfind("\n\n", start, end)
            if para_break > start + max_size // 2:
                end = para_break
            else:
                # Fall back to line break
                line_break = text.rfind("\n", start, end)
                if line_break > start + max_size // 2:
                    end = line_break

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # Move start with overlap
        start = end - overlap if end < len(text) else len(text)

    return chunks


def generate_chunk_id(filename: str, chunk_index: int, content: str) -> str:
    """
    Generates a deterministic, unique ID for each chunk based on content hash.
    This prevents duplicate entries on re-ingestion.
    """
    content_hash = hashlib.md5(content.encode()).hexdigest()[:8]
    return f"{os.path.basename(filename)}_{chunk_index}_{content_hash}"


def ingest():
    """
    Main ingestion pipeline:
    1. Load all .txt files from medical_corpus/
    2. Split each file into protocol blocks
    3. Chunk each block with overlap
    4. Generate embeddings
    5. Upsert into ChromaDB
    """
    print("=" * 60)
    print("🏥 Aether Clinic — Medical Knowledge Ingestion")
    print("=" * 60)

    # Verify corpus directory exists
    if not os.path.exists(CORPUS_DIR):
        print(f"❌ Corpus directory not found: {CORPUS_DIR}")
        print("   Create it and add .txt medical protocol files.")
        return

    # Load embedding model
    print(f"\n📦 Loading embedding model: {EMBEDDING_MODEL}")
    model = SentenceTransformer(EMBEDDING_MODEL)
    print("✅ Embedding model loaded.")

    # Initialize ChromaDB (persistent local storage)
    print(f"\n💾 Initializing ChromaDB at: {CHROMA_DIR}")
    client = chromadb.PersistentClient(path=CHROMA_DIR)

    # Delete and recreate collection for clean re-ingestion
    try:
        client.delete_collection(COLLECTION_NAME)
        print("🗑️  Previous collection cleared.")
    except Exception:
        pass

    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}  # Cosine similarity for semantic search
    )

    # Process all .txt files in corpus
    txt_files = glob.glob(os.path.join(CORPUS_DIR, "*.txt"))
    if not txt_files:
        print(f"⚠️  No .txt files found in {CORPUS_DIR}")
        return

    print(f"\n📚 Found {len(txt_files)} corpus files:")
    for f in txt_files:
        print(f"   • {os.path.basename(f)}")

    total_chunks = 0
    all_documents = []
    all_metadatas = []
    all_ids = []
    all_embeddings = []

    for filepath in txt_files:
        filename = os.path.basename(filepath)
        print(f"\n{'─' * 40}")
        print(f"📄 Processing: {filename}")

        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # Split into protocol blocks
        protocols = split_into_protocols(content)
        print(f"   Found {len(protocols)} protocol blocks")

        for protocol in protocols:
            # Extract metadata from the block header
            metadata = extract_metadata(protocol)
            metadata["filename"] = filename

            # Chunk the protocol
            chunks = chunk_text(protocol)

            for i, chunk in enumerate(chunks):
                chunk_id = generate_chunk_id(filename, total_chunks + i, chunk)

                # Augment metadata with chunk info
                chunk_metadata = {
                    **metadata,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "char_length": len(chunk)
                }

                all_documents.append(chunk)
                all_metadatas.append(chunk_metadata)
                all_ids.append(chunk_id)

            total_chunks += len(chunks)
            print(f"   ✅ '{metadata['title']}' → {len(chunks)} chunks")

    # Generate embeddings in batch
    print(f"\n🧠 Generating embeddings for {total_chunks} chunks...")
    all_embeddings = model.encode(all_documents, show_progress_bar=True).tolist()

    # Upsert into ChromaDB
    print(f"\n💾 Upserting {total_chunks} chunks into ChromaDB...")

    # ChromaDB has a batch limit, process in batches of 500
    BATCH_SIZE = 500
    for i in range(0, len(all_documents), BATCH_SIZE):
        end = min(i + BATCH_SIZE, len(all_documents))
        collection.add(
            documents=all_documents[i:end],
            metadatas=all_metadatas[i:end],
            ids=all_ids[i:end],
            embeddings=all_embeddings[i:end]
        )

    print(f"\n{'=' * 60}")
    print(f"✅ INGESTION COMPLETE")
    print(f"   Total chunks indexed: {total_chunks}")
    print(f"   Collection: {COLLECTION_NAME}")
    print(f"   Database: {CHROMA_DIR}")
    print(f"{'=' * 60}")

    # Verification: Quick test query
    print("\n🔍 Verification — Test Query: 'chest pain and sweating'")
    test_embedding = model.encode(["chest pain and sweating"]).tolist()
    results = collection.query(
        query_embeddings=test_embedding,
        n_results=3
    )

    for i, doc in enumerate(results["documents"][0]):
        meta = results["metadatas"][0][i]
        dist = results["distances"][0][i]
        print(f"\n   Result {i + 1} (distance: {dist:.4f}):")
        print(f"   📋 {meta['title']} — {meta['source']}")
        print(f"   📝 {doc[:120]}...")

    print("\n✅ Vector database is ready for queries!")


if __name__ == "__main__":
    ingest()
