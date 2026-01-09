import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import chatRoutes from "./routes/chat.js";
import reportRoutes from "./routes/report.js";
import mlRoutes from "./routes/mlRoutes.js";




import mongoose from "mongoose";

const app = express();

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai-doctor";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));


// middlewares
app.use(cors());
app.use(express.json());

// health check
app.get("/", (req, res) => {
  res.send("✅ AI Doctor Backend is running!");
});

// existing APIs
app.use("/api/chat", chatRoutes);
app.use("/api/report", reportRoutes);

// ML APIs (NEW)
app.use("/api/ml", mlRoutes);


// server start
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});