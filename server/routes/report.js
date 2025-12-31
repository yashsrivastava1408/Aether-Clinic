import express from "express";
import multer from "multer";
import { analyzeReportController } from "./../controllers/report/reportController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/analyze", upload.single("report"), analyzeReportController);

export default router;