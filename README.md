# Aether Clinic 🛰️

**Aether Clinic** is a next-generation, AI-powered healthcare intelligence system designed to provide accessible, high-tech, and private medical guidance. It combines advanced Machine Learning with a futuristic, holographic user experience.

---

## 🌌 Project Overview

Aether Clinic bridges the gap between individuals and reliable medical guidance. In regions with limited healthcare access, language barriers, or high costs, Aether Clinic provides instant, trustworthy, and easy-to-understand medical insights.

It acts as a **digital immune system**, helping users understand symptoms, identify risks, and interpret medical reports using state-of-the-art AI.

---

## ⚡ Key Features

- **Holographic Dashboard**: A high-tech HUD with mouse-tracking "Flashlight" reveal and Nano-bot swarm interactions.
- **3D Specialist Carousel**: Navigate medical specialists in a futuristic 3D carousel.
- **AI Chatbot 2.0 ("The Session")**: A holographic command center for medical consultation powered by Llama 3.2.
- **Vision Report Scanner**: A "Holographic Laser Scanner" that uses **Llama 3.2 Vision** and OCR to analyze medical reports (blood tests, etc.) from images.
- **Cinematic About Page**: A "Dossier Access" experience with cinematic motion and HUD overlays.
- **Disease Risk Assessment**: ML models for specific health risk predictions (Heart, Diabetes).

---

## 🛠️ Technology Stack

### Application Layer
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Axios.
- **Backend**: Node.js, Express.
- **AI/LLM**: **Ollama** (Llama 3.2 & Llama 3.2 Vision).
- **OCR**: Tesseract.js.
- **Styling**: Vanilla CSS + Tailwind for a "Professional but Crazy" science-fiction aesthetic.

### DevOps & Infrastructure
- **Containerization**: Docker (Multi-service setup with Docker Compose).
- **Orchestration**: Kubernetes (Workload Jobs for batch ML inference).
- **Environment**: Local LLM execution for absolute data privacy.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/) & Docker Compose
- [Ollama](https://ollama.com/) (Running locally or in container)

### Quick Start (Local)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yashsrivastava1408/Aether-Clinic.git
   cd ai-doctor-final
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

3. **Install AI Models** (If not already present in Ollama container)
   ```bash
   docker exec -it ai-doctor-final-ollama-1 ollama pull llama3.2
   docker exec -it ai-doctor-final-ollama-1 ollama pull llama3.2-vision
   ```

4. **Access the App**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5050`

---

## 🧪 Documentation

Detailed documentation for each layer can be found here:
- [Client (Frontend) Documentation](./client/README.md)
- [Server (Backend) Documentation](./server/README.md)

---

## ⚖️ Disclaimer

**Aether Clinic does not provide medical diagnoses or replace licensed healthcare professionals.** 
It is a technology demonstration project intended for educational and health-awareness purposes only. Always consult a doctor for medical concerns.

---

Developed with 💚 by **Yash Srivastava**
