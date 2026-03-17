# Aether Clinic: AI-Powered Healthcare System

A comprehensive, privacy-first healthcare platform integrating React Native Mobile, Modern Web Clients, Node.js Backend, and Python ML Services.

## Detailed System Workflows

```mermaid
sequenceDiagram
    actor User
    participant App as Mobile/Web Client
    participant Server as Node.js Backend
    participant Security as Express Middleware (Helmet/RateLimit/Sanitize)
    participant IntelHub as Python Intelligence Hub (Agents)
    participant VectorDB as ChromaDB (Medical Knowledge)
    participant LLM as Hybrid LLM (Gemini/Ollama)
    
    Note over User,VectorDB: Chat & Medical Consultation Flow
    User->>App: Send Symptom / Query
    App->>Server: POST /api/chat
    
    rect rgb(240, 240, 240)
        Note left of Server: Security Layer
        Security->>Server: Apply Helmet + Rate Limit + Sanitization
    end

    Server->>IntelHub: POST /api/intelligence/query (semantic search)
    IntelHub->>VectorDB: Query embeddings (Cosine Similarity)
    VectorDB-->>IntelHub: Return relevant chunks + citations
    IntelHub-->>Server: Return Context + Triage Classification
    
    Server->>LLM: Generate Response (Prompt + Context)
    LLM-->>Server: Raw AI Response
    
    Server->>IntelHub: POST /api/intelligence/verify (Safety Check)
    Note right of IntelHub: Safety Oversight Agent
    IntelHub-->>Server: Verified/Amended Response
    
    Server-->>App: Return Response + Citations
    App-->>User: Display Triage Advice + Medical Sources

    Note over User,Server: Report Analysis (OCR + Medical Intelligence)
    User->>App: Upload Medical Report (Image)
    App->>Server: POST /api/report/analyze
    
    Server->>Server: Tesseract.js OCR (images only)
    Server->>LLM: Send OCR Text + Image Base64 (Gemini Vision)
    LLM-->>Server: Return Structured Analysis (JSON)
    Server-->>App: Display Visualized Report Data

    Note over User,IntelHub: ML Disease Prediction (Heart/Diabetes)
    User->>App: Enter Health Metrics (Form)
    App->>Server: POST /api/ml/heart (or /diabetes)
    Server->>IntelHub: Forward to ML Predictor (:5001)
    IntelHub->>IntelHub: Run .pkl Model Inference
    IntelHub-->>Server: Return Probability & Risk Level
    Server-->>App: Return Risk Assessment
```

---

## High-Level Architecture

The system operates on a multi-agent microservices architecture where the Node.js backend acts as the orchestrator between user clients and a specialized Python Intelligence Hub.

```mermaid
graph TD
    subgraph "Frontend Layer"
        M["Mobile App (React Native)"] -->|REST API| G["Gateway (Node.js)"]
        W["Web Dashboard (React)"] -->|REST API| G
    end

    subgraph "Core Backend (Node.js)"
        G -->|Chat Logs| F["chat_logs.json (Encrypted)"]
        G -->|Orchestration| S["Intelligence Service Client"]
        G -->|Security| X["Helmet + RateLimit + Sanitization"]
    end

    subgraph "Intelligence Hub (Python)"
        S -->|Query| TC["Triage Classifier"]
        TC -->|Route| KR["Knowledge Retriever"]
        KR -->|Semantic Search| CDB[("ChromaDB\n(Medical Corpus)")]
        S -->|Post-Process| SO["Safety Oversight"]
        G -->|Risk Analysis| ML["ML Predictor (Scikit-Learn)"]
    end

    subgraph "Foundation Models"
        G -->|Cloud Vision| V["Gemini 2.0 Flash"]
        G -->|Local LLM| L["Ollama (Llama 3.2)"]
    end
```

---

## Intelligence Hub (Multi-Agent RAG)

### Architecture Overview
The Multi-Agent RAG system uses semantic search and specialized agents to provide accurate, cited medical guidance.

**Technologies**: Python, Flask, LangGraph, ChromaDB, Sentence-Transformers

**Agentic Framework**:
- **Triage Classifier**: Categorizes queries and detects emergency urgency levels.
- **Knowledge Retriever**: Performs hybrid semantic search against a Vector DB (ChromaDB) containing 44+ medical knowledge chunks.
- **Safety Oversight**: Post-processes AI responses to detect hallucinations and ensure mandatory safety warnings are present.

### Internal Agent Workflow
The following diagram illustrates the internal decision-making and data retrieval flow within the Intelligence Hub.

```mermaid
graph TD
    UserQuery["User Query"] --> NodeBackend["Node.js Backend"]
    NodeBackend -->|POST /api/intelligence/query| IntelHub["Python Intelligence Hub"]

    subgraph "Multi-Agent System (Python)"
        IntelHub --> TC["Triage Classifier"]
        TC -->|category + urgency| KR["Knowledge Retriever"]
        KR -->|semantic search| CDB[("ChromaDB\n44 chunks")]
        CDB -->|context + citations| KR
        KR -->|formatted context| IntelHub
    end

    IntelHub -->|context + citations + classification| NodeBackend
    NodeBackend -->|prompt + context| LLM["Ollama / Gemini LLM"]
    LLM -->|AI response| NodeBackend
    
    NodeBackend -->|POST /api/intelligence/verify| SO["Safety Oversight"]
    SO -->|verified / amended response| NodeBackend
    
    NodeBackend -->|Final response + citations| UserQuery
```

### Implementation Details

#### New Files (Python ML Service)
| File | Purpose |
|:-----|:--------|
| ingestion_service.py | Reads corpus, chunks, generates embeddings, and stores in ChromaDB |
| agents/init.py | Package initialization |
| agents/triage_classifier.py | Routes queries by medical category and urgency |
| agents/knowledge_retriever.py | Semantic search and hybrid retrieval |
| agents/safety_oversight.py | Final verification of AI response safety |
| data/medical_corpus/*.txt | Clinical guidelines for Cardiology, Endocrinology, General Medicine, Orthopedics, Pulmonology, and Mental Health |

#### Modified Files (Node.js Backend)
| File | Change |
|:-----|:--------|
| ragService.js | Rewritten as Intelligence Hub client with fallback capability |
| chatController.js | Integrated async intelligence retrieval and safety verification |
| mlRoutes.js | Added intelligence status monitor endpoint |

#### API Endpoints
| Method | Endpoint | Service | Description |
|:-------|:---------|:--------|:------------|
| POST | /api/intelligence/query | Python :5001 | Multi-agent RAG workflow |
| POST | /api/intelligence/verify | Python :5001 | Safety oversight verification |
| GET | /api/intelligence/status | Python :5001 | System health dashboard |
| GET | /api/ml/intelligence/status | Node :5050 | Proxied status check |

### Ingestion Statistics
- **6 Corpus Files**: Covering 9 medical specializations.
- **17 Medical Protocols**: Sourced from WHO, AHA, ADA, GINA, APA, NICE, CDC, and others.
- **44 Indexed Chunks**: High-dimensionality semantic embeddings.
- **Embedding Model**: all-MiniLM-L6-v2 (384 dimensions).

### Workflow: How to Run
```bash
# 1. Ingest medical knowledge (one-time or when adding new protocols)
cd ml && python3 ingestion_service.py

# 2. Start the ML + Intelligence Hub service
cd ml && python3 app.py

# 3. Start the Node.js backend (auto-connects to Intelligence Hub)
cd server && npm run dev
```

> [!NOTE]
> If the Intelligence Hub is unavailable, the system gracefully falls back to the legacy keyword-based retrieval system for maximum reliability.

---

## Key System Components

### Mobile App
- **Technologies**: React Native, Expo, Reanimated
- **Description**: Patient-facing app for health monitoring, AI consultation, and report digitization.

### Web Client
- **Technologies**: React, Vite, TailwindCSS
- **Description**: Clinical dashboard for healthcare providers to review patient analytics and management.

### Backend API (Gateway)
- **Technologies**: Node.js, Express, MongoDB
- **Description**: Orchestration layer for security, OCR processing, and agentic communication.

### ML Predictor
- **Technologies**: Python, Flask, Scikit-Learn
- **Description**: Risk assessment for heart disease and diabetes using pre-trained models.

---

## Security & Privacy Architecture
- **Zero-Knowledge Intelligence**: Local LLM processing (Ollama) for routine consultations.
- **AES-256 Encryption**: Hardware-isolated encryption for all sensitive communication logs.
- **Agentic Safety Guardrails**: Real-time cross-referencing against clinical guidelines to prevent dangerous recommendations.

---

## Repository Structure
- **/mobile**: Patient application (React Native).
- **/client**: Dashboard application (React + Vite).
- **/server**: Backend orchestration and security.
- **/ml/agents**: Triage, Retrieval, and Safety agent source code.
- **/ml/data/medical_corpus**: Source clinical guidelines for RAG.

---
*Building for a safer, smarter future of healthcare.*
