#!/bin/bash

# Aether Clinic - Kubernetes (AWS ECR) Deployment Helper Script
# This script automates building images, pushing to ECR, and deploying to k8s.

set -e

# Setup color outputs
GREEN='\033[0;32m'
NC='\033[0m' # No Color
YELLOW='\033[0;33m'
RED='\033[0;31m'

echo -e "${GREEN}🚀 Starting Kubernetes Deployment Pipeline for Aether Clinic...${NC}"

# Read inputs (or environment variables)
read -p "Enter AWS Account ID (12 digits): " AWS_ACCOUNT_ID
read -p "Enter AWS Region (e.g., us-east-1): " AWS_REGION
read -p "Enter your Gemini API Key: " GEMINI_KEY

# Basic validations
if [[ ! "$AWS_ACCOUNT_ID" =~ ^[0-9]{12}$ ]]; then
    echo -e "${RED}❌ Error: AWS Account ID must be exactly 12 digits.${NC}"
    exit 1
fi

if [ -z "$AWS_REGION" ]; then
    AWS_REGION="us-east-1"
fi

if [ -z "$GEMINI_KEY" ]; then
    echo -e "${RED}❌ Error: Gemini API key is required.${NC}"
    exit 1
fi

# Generate random 64-character hex key for encryption if not set
ENCRYPTION_KEY=$(openssl rand -hex 32)

REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo -e "${GREEN}🔑 Logging in to AWS ECR at ${REGISTRY}...${NC}"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$REGISTRY"

# Create ECR repos if they don't exist
echo -e "${GREEN}📦 Checking / Creating ECR Repositories...${NC}"
for repo in "aether-ml-service" "aether-backend" "aether-frontend"; do
    aws ecr describe-repositories --repository-names "$repo" --region "$AWS_REGION" >/dev/null 2>&1 || \
    aws ecr create-repository --repository-name "$repo" --region "$AWS_REGION" >/dev/null 2>&1 || \
    echo -e "${YELLOW}⚠️  Warning: Could not describe or create ECR repository '$repo'. If it already exists and you have push permissions, deployment will continue...${NC}"
done

# Build and Push
echo -e "${GREEN}🏗️  Building and pushing ML Service...${NC}"
docker build -t "${REGISTRY}/aether-ml-service:latest" ./ml
docker push "${REGISTRY}/aether-ml-service:latest"

echo -e "${GREEN}🏗️  Building and pushing Backend Service...${NC}"
docker build -t "${REGISTRY}/aether-backend:latest" ./server
docker push "${REGISTRY}/aether-backend:latest"

echo -e "${GREEN}🏗️  Building and pushing Frontend Client...${NC}"
PUBLIC_IP=$(curl -s ifconfig.me)
docker build --build-arg VITE_API_URL="http://${PUBLIC_IP}" -t "${REGISTRY}/aether-frontend:latest" ./client
docker push "${REGISTRY}/aether-frontend:latest"

# Prepare Manifests with actual account details
echo -e "${GREEN}📝 Configuring Kubernetes Manifest Placeholders...${NC}"
mkdir -p k8s/deploy_output

for manifest in k8s/*.yaml; do
    if [ -f "$manifest" ]; then
        filename=$(basename "$manifest")
        sed -e "s/YOUR_AWS_ACCOUNT_ID/${AWS_ACCOUNT_ID}/g" \
            -e "s/YOUR_REGION/${AWS_REGION}/g" \
            "$manifest" > "k8s/deploy_output/${filename}"
    fi
done

# Create secrets
echo -e "${GREEN}🛡️  Configuring Kubernetes Secrets...${NC}"
kubectl delete secret aether-secrets --ignore-not-found
kubectl create secret generic aether-secrets \
  --from-literal=gemini-api-key="$GEMINI_KEY" \
  --from-literal=encryption-key="$ENCRYPTION_KEY"

# MongoDB credentials
MONGO_USER="aether_admin"
MONGO_PASS=$(openssl rand -hex 24)
echo -e "${YELLOW}📋 MongoDB credentials (save these):${NC}"
echo -e "   Username: ${MONGO_USER}"
echo -e "   Password: ${MONGO_PASS}"

kubectl delete secret mongo-credentials --ignore-not-found
kubectl create secret generic mongo-credentials \
  --from-literal=username="$MONGO_USER" \
  --from-literal=password="$MONGO_PASS"

kubectl delete secret ecr-registry-secret --ignore-not-found
kubectl create secret docker-registry ecr-registry-secret \
  --docker-server="$REGISTRY" \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region "$AWS_REGION")

# Apply manifests
echo -e "${GREEN}⛵ Applying deployments to Kubernetes Cluster...${NC}"
kubectl apply -f k8s/deploy_output/

echo -e "${GREEN}🎉 Rollout complete! Check status using:${NC}"
echo -e "   ${YELLOW}kubectl get pods -w${NC}"
echo -e "   ${YELLOW}kubectl get ingress${NC}"
