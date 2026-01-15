# 🏥 Aether Clinic: AI-Powered Healthcare System

**A comprehensive, privacy-first healthcare platform integrating React Native Mobile, Modern Web Clients, Node.js Backend, and Python ML Services.**

---

## 🏗️ High-Level Architecture

The system operates on a microservices-inspired architecture where the backend orchestrates communication between the user interfaces (Mobile/Web) and the specialized Intelligence Layer (Machine Learning & LLMs).

```mermaid
graph TD
    subgraph "Frontend Layer"
        M["📱 Mobile App (React Native)"] -->|REST API| G["Gateway (Server)"]
        W["💻 Web Dashboard (React)"] -->|REST API| G
    end

    subgraph "Core Backend (Node.js)"
        G -->|Store/Retrieve| DB[("Dictionary: MongoDB")]
        G -->|OCR & Analysis| S["Report Service"]
        G -->|Secure Chat| C["Chat Controller"]
    end

    subgraph "Intelligence Layer"
        S -->|Forward Image| V["Gemini Vision (Cloud)"]
        C -->|Text Prompt| L["Ollama (Local LLM)"]
        G -->|Risk Data| ML["Python ML Service (Flask)"]
    end

    subgraph "ML Service (Python)"
        ML -->|Predict| H["Heart Disease Model"]
        ML -->|Predict| D["Diabetes Model"]
    end
```

---

## 🔄 Detailed System Workflows

```mermaid
sequenceDiagram
    actor User
    participant App as Mobile/Web Client
    participant Server as Node.js Backend
    participant Auth as Auth/Security Layer
    participant MLService as Python ML Service
    participant Gemini as Gemini Vision (Cloud)
    participant Ollama as Ollama (Local LLM)
    participant DB as MongoDB
    
    Note over User,DB: 🔐 Chat & AI Consultation (Zero-Knowledge Privacy)
    User->>App: Send Message / Image
    App->>Server: POST /api/chat (userId, message, image)
    
    rect rgb(240, 240, 240)
        Note left of Server: Rate Limiting & Security
        Server->>Server: Express-Rate-Limit (Check quota)
        Server->>Server: Helmet & Sanitization (Clean Input)
    end

    Server->>DB: Fetch Chat History (userId)
    DB-->>Server: Return encrypted history
    Server->>Server: Decrypt history for Context

    alt Image provided
        Server->>Gemini: Analyze Image + Context
        Gemini-->>Server: Return visual analysis
    else Text only
        Server->>Ollama: Generate Response (Local Privacy)
        Ollama-->>Server: Return medical advice
    end

    Server->>Server: Encrypt Response & User Message
    Server->>DB: Save updated Chat Logic
    Server-->>App: Return AI Response
    App-->>User: Display Reply

    Note over User,DB: 📋 Report Analysis (OCR + Medical Intelligence)
    User->>App: Upload Medical Report (Image)
    App->>Server: POST /api/report/analyze (multipart/form-data)
    
    Server->>Server: Multer (Temp Storage)
    Server->>Server: Tesseract.js (Perform OCR)
    
    Server->>Gemini: Send OCR Text + Image Base64
    Gemini-->>Server: Return Structured Analysis (JSON)
    
    Server->>Server: Encrypt Sensitive Findings
    Server->>DB: Save Report (Encrypted)
    Server-->>App: Return Structured JSON
    App-->>User: Show visualize report data

    Note over User,DB: 💓 ML Disease Prediction (Heart/Diabetes)
    User->>App: Enter Health Metrics (Form)
    App->>Server: POST /api/ml/heart (or /diabetes)
    
    Server->>MLService: POST http://localhost:5001/predict/...
    Note right of MLService: Flask + Scikit-Learn
    MLService->>MLService: Run .pkl Model Inference
    MLService-->>Server: Return Probability & Risk
    
    Server-->>App: Return Risk Score
    App-->>User: Display Risk Assessment
```

---

## 🚀 Key System Components

| Component | Tech Stack | Role & Functionality |
| :--- | :--- | :--- |
| **Mobile App** | React Native, Expo, Reanimated | Patient-facing app. Features "Aether" UI, biometric security, real-time chat, and report scanning. |
| **Web Client** | React, Vite, TailwindCSS | Doctor/Admin dashboard. Visualizes patient trends, displays aggregated risk profiles, and manages clinics. |
| **Backend API** | Node.js, Express, MongoDB | The central nervous system. Handles auth, data persistence, and orchestrates AI requests. |
| **ML Engine** | Python, Flask, Scikit-Learn | Specialized service for numerical health predictions (Heart Disease, Diabetes). |
| **LLM Service** | Google Gemini + Ollama | Hybrid Intelligence. Uses Cloud Gemini for complex vision tasks and Local Ollama for privacy-focused chat. |
| **Infrastructure** | Kubernetes, Docker | Containerized deployment strategies for scalability and resilience. |

---

## 🔐 Security & Privacy Architecture

The system prioritizes user data privacy through a "Local-First" intelligence approach and rigorous encryption standards.

*   **Zero-Knowledge Chat**: Routine conversations are processed via **Local Ollama**, ensuring chats don't leave the server infrastructure.
*   **Encrypted Storage**: Medical reports and analysis results are encrypted before storage in MongoDB.
*   **Ephemeral processing**: Images sent to Cloud Vision are processed in memory and not permanently stored on external servers.

---

## 📂 Repository Structure

*   **/mobile**: The React Native application source code.
*   **/client**: The Web Dashboard source code.
*   **/server**: The Node.js Express backend and API routes.
*   **/ml**: The Python Flask service serving the trained `.pkl` models.
*   **/k8s**: Kubernetes manifests for deployment.

---
*Built with ❤️ for the Future of Healthcare.*
