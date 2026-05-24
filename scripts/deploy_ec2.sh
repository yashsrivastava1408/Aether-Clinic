#!/bin/bash

# Aether Clinic - EC2 Deployment Script
# This script installs Docker and starts the multi-service architecture.

set -e

echo "🚀 Starting Aether Clinic Setup..."

# 1. Update system
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Install Docker
echo "📦 Installing Docker..."
sudo apt-get install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 3. Enable Docker and fix permissions
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# 4. Clone / Prepare Code
# Note: Since the code is on your local machine, you will need to push it to GitHub
# or use SCP to transfer it. If you use GitHub:
# git clone <your-repo-url>
# cd ai-doctor-final

echo "✅ Docker installed successfully!"
echo "⚠️ IMPORTANT: Log out and log back in (or run 'newgrp docker') for permissions to take effect."
echo "Then run: PUBLIC_IP=\$(curl -s ifconfig.me) docker compose up -d"
