import express from "express";
import axios from "axios";

const router = express.Router();

// Heart prediction
router.post("/heart", async (req, res) => {
  try {
    const response = await axios.post(
      "http://localhost:5001/predict/heart",
      { features: req.body.features }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "ML service unavailable" });
  }
});

// Diabetes prediction
router.post("/diabetes", async (req, res) => {
  try {
    const response = await axios.post(
      "http://localhost:5001/predict/diabetes",
      { features: req.body.features }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "ML service unavailable" });
  }
});

export default router;
