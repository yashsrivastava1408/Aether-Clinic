# Aether Clinic - Backend 🧠

The backend of Aether Clinic is a Node.js/Express service that provides AI orchestration, report analysis, and medical intelligence services. It interfaces with **Ollama** for local LLM execution.

---

## 🚀 Teck Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **AI/LLM**: [Ollama](https://ollama.com/) (Llama 3.2 & Llama 3.2 Vision)
- **OCR**: [Tesseract.js](https://tesseract.projectnaptha.com/)
- **Image Processing**: Base64 encoding for Vision analysis.
- **File Handling**: [Multer](https://github.com/expressjs/multer) (for report uploads).

---

## 🏗️ Core Services

### 1. LLM Service (`services/llmService.js`)
- Interfaces with the local Ollama API.
- Supports **Hybrid Vision-OCR** analysis.
- Dynamically switches models based on input:
  - `llama3.2` for text-based chat.
  - `llama3.2-vision` for medical report image analysis.

### 2. Report Analyzer (`services/reportAnalyzer.js`)
- Processes raw text and images from medical reports.
- Constructs complex clinical prompts for the AI.
- Parses AI output into structured JSON: `summary`, `findings`, `alerts`, `suggestions`.

### 3. OCR Engine
- Uses Tesseract.js (with pre-loaded `eng.traineddata`) to extract text from JPG/PNG reports.

---

## 🔌 API Endpoints

### Chat
- **POST** `/api/chat`
  - Body: `{ message, specialization }`
  - Returns AI-generated medical guidance.

### Report Analysis
- **POST** `/api/report/analyze`
  - Body: `Multipart/form-data` (file) or `{ text }`
  - Returns structured diagnostic analysis.

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

## 🗄️ Structure
- `controllers/`: Request handling logic.
- `routes/`: API endpoint definitions.
- `services/`: Business logic, AI orchestration, and OCR.
- `uploads/`: Temporary storage for analyzed reports.
