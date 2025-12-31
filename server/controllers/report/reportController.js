import Tesseract from "tesseract.js";
import { analyzeReport } from "../../services/reportAnalyzer.js";

export async function analyzeReportController(req, res) {
  try {
    let text = "";

    if (req.file) {
      // ❌ Block PDFs (Tesseract can't read them)
      if (req.file.mimetype === "application/pdf") {
        return res.status(400).json({
          error: "PDF not supported yet. Please upload an image (JPG/PNG)."
        });
      }

      // ✅ OCR for images
      const result = await Tesseract.recognize(req.file.path, "eng");
      text = result.data.text;
    } else if (req.body.text) {
      text = req.body.text;
    }

    const analysis = analyzeReport(text);
    res.json(analysis);
  } catch (err) {
    console.error("REPORT ERROR:", err);
    res.status(500).json({ error: "Report analysis failed" });
  }
}