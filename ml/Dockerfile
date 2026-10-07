FROM python:3.10-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y gcc g++ build-essential && rm -rf /var/lib/apt/lists/*

# Copy only requirements first
COPY requirements.txt .

# Upgrade pip (important for faster installs)
RUN pip install --upgrade pip

# Install CPU torch first
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu

# Install rest
RUN pip install --no-cache-dir -r requirements.txt

# Bake the embedding model into the image so startup needs no download
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

# Copy rest of code
COPY . ./ml

WORKDIR /app/ml

EXPOSE 5001

# One worker with threads: event streams hold a connection open, and without
# MongoDB the conversation state lives in this process. Scale with replicas
# (state is then shared through MongoDB), not with more workers.
CMD ["sh", "-c", "gunicorn app:app --bind 0.0.0.0:${PORT:-5001} --worker-class gthread --workers 1 --threads 8 --timeout 180"]
