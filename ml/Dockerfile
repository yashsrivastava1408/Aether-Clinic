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

# Copy rest of code
COPY . ./ml

WORKDIR /app/ml

EXPOSE 5001

CMD ["python", "app.py"]