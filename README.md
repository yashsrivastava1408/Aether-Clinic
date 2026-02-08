# Aether Clinic: AI-Powered Healthcare System

A comprehensive, privacy-first healthcare platform integrating React Native Mobile, Modern Web Clients, Node.js Backend, and Python ML Services.

## Detailed System Workflows

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
    
    Note over User,DB: Chat & AI Consultation (Zero-Knowledge Privacy)
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

    Note over User,DB: Report Analysis (OCR + Medical Intelligence)
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

    Note over User,DB: ML Disease Prediction (Heart/Diabetes)
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

## High-Level Architecture

The system operates on a microservices-inspired architecture where the backend orchestrates communication between the user interfaces (Mobile/Web) and the specialized Intelligence Layer (Machine Learning & LLMs).

```mermaid
graph TD
    subgraph "Frontend Layer"
        M["Mobile App (React Native)"] -->|REST API| G["Gateway (Server)"]
        W["Web Dashboard (React)"] -->|REST API| G
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

## Key System Components

### Mobile App
- **Technologies**: React Native, Expo, Reanimated
- **Description**: Patient-facing app providing a secure interface for health monitoring, AI-driven consultation, and medical report digitization.

### Web Client
- **Technologies**: React, Vite, TailwindCSS
- **Description**: Clinical dashboard for healthcare providers to review patient analytics, manage clinic data, and oversee health trends.

### Backend API
- **Technologies**: Node.js, Express, MongoDB
- **Description**: Central orchestration layer managing authentication, data security, and communication between AI services and frontend clients.

### ML Engine
- **Technologies**: Python, Flask, Scikit-Learn
- **Description**: High-fidelity predictive engine for specialized health risk assessment, specifically for heart disease and diabetes.

### LLM Service
- **Technologies**: Google Gemini, Ollama
- **Description**: Hybrid intelligence model utilizing cloud-based Vision for complex diagnostic analysis and local LLMs for private, secure consultations.

### Infrastructure
- **Technologies**: Kubernetes, Docker
- **Description**: Scalable, containerized infrastructure designed for high availability and resilient data management.

---

## Security & Privacy Architecture

Aether Clinic prioritizes user data privacy through a "Local-First" intelligence approach and rigorous encryption standards.

- **Zero-Knowledge Architecture**: Routine consultations are handled by local LLMs to ensure that sensitive health data never leaves the secure server infrastructure.
- **Data Encryption**: All medical reports and analytical results are encrypted using AES-256 before being stored in the database.
- **Ephemeral Image Processing**: Images analyzed by vision services are processed in-memory and are not persisted on cloud storage.

---

## Repository Structure

- **/mobile**: Patient application source code.
- **/client**: Clinical dashboard source code.
- **/server**: Node.js backend and API infrastructure.
- **/ml**: Python-based machine learning service.
- **/k8s**: Deployment manifests for Kubernetes.

---
*Building for the future of healthcare.*
