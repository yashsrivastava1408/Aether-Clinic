import express from "express";
import axios from "axios";

const router = express.Router();

const ML_BASE_URL = process.env.ML_BASE_URL || "http://localhost:5001";

// Heart risk
router.post("/heart", async (req, res) => {
  try {
    const response = await axios.post(
      `${ML_BASE_URL}/predict/heart`,
      { features: req.body.features }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "ML service unavailable" });
  }
});

// Diabetes risk
router.post("/diabetes", async (req, res) => {
  try {
    const response = await axios.post(
      `${ML_BASE_URL}/predict/diabetes`,
      { features: req.body.features }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "ML service unavailable" });
  }
});

export default router;