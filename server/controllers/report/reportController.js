import Tesseract from "tesseract.js";
import { analyzeReport } from "../../services/reportAnalyzer.js";

export async function analyzeReportController(req, res) {
  try {
    let imageBase64 = null;
    let text = "";

    if (req.file) {
      // ❌ Block PDFs (Tesseract can't read them)
      if (req.file.mimetype === "application/pdf") {
        return res.status(400).json({
          error: "PDF not supported yet. Please upload an image (JPG/PNG)."
        });
      }

      // ✅ OCR for images
      console.log("Analyzing file path:", req.file ? req.file.path : "NO FILE");
      const result = await Tesseract.recognize(req.file.path, "eng");
      text = result.data.text;
      console.log("Extracted OCR Text length:", text.length, "Preview:", text.substring(0, 50));

      // ✅ Extract Base64 for Vision analysis
      const fs = await import("fs/promises");
      const imageBuffer = await fs.readFile(req.file.path);
      imageBase64 = imageBuffer.toString("base64");
    } else if (req.body.text) {
      text = req.body.text;
    }

    console.log("Sending text and image to AI Analyzer...");
    const analysis = await analyzeReport(text, imageBase64);
    console.log("AI Analysis Result:", JSON.stringify(analysis, null, 2));

    res.json(analysis);
  } catch (err) {
    console.error("REPORT CONTROLLER ERROR FULL TRACE:", err);
    res.status(500).json({ error: "Report analysis failed", details: err.message });
  }
}