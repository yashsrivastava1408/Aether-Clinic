# Aether Clinic - Backend 🧠

The backend of Aether Clinic is a Node.js/Express service that provides AI orchestration, report analysis, and medical intelligence services. It interfaces with **Ollama** for local LLM execution.

---

## 🚀 Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **AI/LLM**: [Ollama](https://ollama.com/) (Llama 3.2 & Llama 3.2 Vision)
- **OCR**: [Tesseract.js](https://tesseract.projectnaptha.com/)
- **Image Processing**: Base64 encoding for Vision analysis.
- **File Handling**: [Multer](https://github.com/expressjs/multer) (for report uploads).

---

## 🏗️ Core Services

### 1. LLM Orchestrator (`services/llmService.js`)
- Interfaces with the local Ollama API (`localhost:11434`).
- **Hybrid Vision-OCR Flow**:
  1. Receives image from frontend.
  2. Runs Tesseract OCR to extract raw text (high precision for numbers).
  3. Sends image to `llama3.2-vision` to understand layout and context.
  4. Combines both outputs for a final clinical summary.

### 2. Clinical Report Analyzer (`services/reportAnalyzer.js`)
- Constructs complex, multi-stage prompts to ensure the AI follows medical safety protocols.
- **Output Parsing**: Uses regex and structured JSON parsing to extract:
  - `Summary`: 1-sentence executive overview.
  - `Findings`: Detailed list of identified parameters.
  - `Alerts`: High-priority concerns (Crimson level).
  - `Suggestions`: Next steps and specialist recommendations.

### 3. OCR Engine
- Uses Tesseract.js with the `eng.traineddata` language pack.
- Optimized for medical terminology and tabular data found in blood reports.

---

## 🔌 API Endpoints

### 💬 Chat Session
- **POST** `/api/chat`
- **Body**: 
  ```json
  { "message": "I have a headache", "specialization": "Neurology" }
  ```
- **Description**: Returns AI-generated guidance based on the specified medical context.

### 📄 Report Analysis
- **POST** `/api/report/analyze`
- **Body**: `Multipart/form-data` (file) or `{ "text": "..." }`
- **Description**: Triggers the Vision/OCR pipeline. Returns structured JSON analysis of the medical report.

### 💓 Heart Risk (Proxied)
- **POST** `/api/predict/heart`
- **Description**: Proxies request to the Python ML microservice for cardiac risk assessment.

---

## 🛠️ Setup & Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup Ollama**
   - Ensure Ollama is running (`ollama serve`).
   - Pull models:
     ```bash
     ollama pull llama3.2
     ollama pull llama3.2-vision
     ```

3. **Start development server**
   ```bash
   npm run dev
   ```

---

## 🗄️ Project Structure
- `controllers/`: Request handling and response formatting.
- `routes/`: Express router definitions.
- `services/`: Business logic, AI orchestration, and OCR engines.
- `uploads/`: Temporary storage for medical images undergoing analysis.
- `models/`: Mongoose/Schema definitions (if persistent storage is enabled).
