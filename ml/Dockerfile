FROM python:3.10-slim

WORKDIR /app

# System dependencies (required by chromadb and sentence-transformers)
RUN apt-get update && apt-get install -y gcc g++ build-essential && rm -rf /var/lib/apt/lists/*

# Copy requirements first (Docker layer caching)
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy ML source code (models, agents, data, scripts)
COPY . .

# Run ingestion at build time to populate ChromaDB
RUN python ingestion_service.py

EXPOSE 5001

CMD ["python", "app.py"]