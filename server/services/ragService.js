import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_PATH = path.join(__dirname, '../data/medical_knowledge.json');

let knowledgeBase = [];

// Load knowledge base on startup
try {
    if (fs.existsSync(KNOWLEDGE_PATH)) {
        const data = fs.readFileSync(KNOWLEDGE_PATH, 'utf8');
        knowledgeBase = JSON.parse(data);
        console.log(`📚 RAG System: Loaded ${knowledgeBase.length} knowledge entries.`);
    } else {
        console.warn("⚠️ RAG System: Knowledge file not found. Running in fallback mode.");
    }
} catch (err) {
    console.error("❌ RAG System Error:", err.message);
}

// Smart keyword-based retrieval with phrase matching
export const retrieveContext = (query) => {
    if (!query || knowledgeBase.length === 0) return null;

    const queryLower = query.toLowerCase();

    // First, try to find exact multi-word phrase matches (higher priority)
    for (const entry of knowledgeBase) {
        for (const keyword of entry.keywords) {
            // If keyword has multiple words (e.g., "chest pain"), require exact phrase match
            if (keyword.includes(' ') && queryLower.includes(keyword)) {
                console.log(`🔎 RAG Hit: Found exact phrase match for "${keyword}"`);
                return entry.content;
            }
        }
    }

    // Second, try to match entries where AT LEAST 2 keywords match (prevents false positives)
    for (const entry of knowledgeBase) {
        const matchCount = entry.keywords.filter(keyword =>
            queryLower.includes(keyword)
        ).length;

        if (matchCount >= 2) {
            console.log(`🔎 RAG Hit: Found context for keywords [${entry.keywords.join(', ')}] (${matchCount} matches)`);
            return entry.content;
        }
    }

    // Fallback: single keyword match ONLY for very specific non-ambiguous terms
    // Exclude common broad words like "pain", "fever" alone
    const broadWords = ['pain', 'fever', 'ache'];
    const match = knowledgeBase.find(entry =>
        entry.keywords.some(keyword =>
            queryLower.includes(keyword) &&
            !broadWords.includes(keyword) &&
            keyword.length > 4  // Require keywords to be reasonably specific
        )
    );

    if (match) {
        console.log(`🔎 RAG Hit: Found context for specific keyword match`);
        return match.content;
    }

    return null;
};
