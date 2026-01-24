import Tesseract from "tesseract.js";
import { analyzeReport } from "../../services/reportAnalyzer.js";
import { encrypt } from "../../utils/encryption.js";
import Report from "../../models/Report.js";

export async function analyzeReportController(req, res) {
  try {
    let imageBase64 = null;
    let text = "";

    // We assume userId comes in body or we use a demo ID if missing (since no auth middleware yet)
    // Ideally request should strictly require userId
    const userId = req.body.userId || "demo-user";

    if (req.file) {
      // ❌ Block PDFs (Tesseract can't read them)
      if (req.file.mimetype === "application/pdf") {
        return res.status(400).json({
          error: "PDF not supported yet. Please upload an image (JPG/PNG)."
        });
      }

      // ✅ OCR for images
      // Read file into buffer first to avoid Tesseract worker path issues
      const fs = await import("fs/promises");
      const imageBuffer = await fs.readFile(req.file.path);

      console.log("Analyzing image buffer size:", imageBuffer.length);
      const result = await Tesseract.recognize(imageBuffer, "eng");
      text = result.data.text;
      console.log("Extracted OCR Text length:", text.length, "Preview:", text.substring(0, 50));

      // ✅ Extract Base64 for Vision analysis (reuse buffer)
      imageBase64 = imageBuffer.toString("base64");

      // Cleanup temp file
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupErr) {
        console.warn("Failed to delete temp upload file:", cleanupErr.message);
      }
    } else if (req.body.text) {
      text = req.body.text;
    }

    console.log("Sending text and image to AI Analyzer...");
    const analysis = await analyzeReport(text, imageBase64);
    // console.log("AI Analysis Result:", JSON.stringify(analysis, null, 2));

    // --- MONGODB SAVE DISABLED (File-based mode) ---
    // const encryptedAnalysis = encrypt(JSON.stringify(analysis));
    // const encryptedSummary = encrypt(analysis.summary || "No summary");
    // const newReport = new Report({
    //   userId,
    //   summary: encryptedSummary,
    //   encryptedAnalysis: encryptedAnalysis
    // });
    // await newReport.save();
    console.log("✅ Report analysis complete (not saved - file mode).");
    // -------------------------------

    res.json(analysis);
  } catch (err) {

    console.error("REPORT CONTROLLER ERROR FULL TRACE:", err);
    res.status(500).json({ error: "Report analysis failed", details: err.message });
  }
}