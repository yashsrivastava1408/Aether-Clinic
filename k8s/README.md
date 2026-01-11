# Aether Clinic - Kubernetes (K8s) ☸️

This directory contains the Kubernetes manifests used to deploy and scale the Aether Clinic's intelligence layer, specifically the Machine Learning microservices.

---

## 🏗️ Deployment Architecture

The current setup focuses on making the ML inference capabilities resilient and scalable.

### 1. ML Deployment (`ml-deployment.yaml`)
- **Role**: Manages the Flask-based ML microservice.
- **Scaling**: Configured for 2 replicas by default to ensure high availability.
- **Resources**: Assigned specific CPU/Memory limits to ensure stable inference performance.

### 2. ML Service (`ml-service.yaml`)
- **Type**: ClusterIP.
- **Role**: Provides a stable internal DNS name (`ml-service`) that the Node.js backend uses to communicate with the ML models.

### 3. ML Job (`ml-job.yaml`)
- **Role**: Designed for batch processing or one-time intensive model training/updates.
- **Workflow**: Spins up a container, executes the specific `train.py` logic, and terminates upon completion.

---

## 🚀 Deployment Instructions

### 1. Apply Manifests
Ensure you have `kubectl` configured and connected to your cluster, then run:
```bash
kubectl apply -f .
```

### 2. Verify Status
```bash
# Check Pods
kubectl get pods

# Check Services
kubectl get svc
```

---

## 🛠️ Scaling & Performance
- **Horizontal Scaling**: To scale the ML service based on load:
  ```bash
  kubectl scale deployment ml-deployment --replicas=5
  ```
- **Updates**: Use `kubectl rollout restart deployment/ml-deployment` to apply model updates without downtime.
