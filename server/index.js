import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import chatRoutes from "./routes/chat.js";
import reportRoutes from "./routes/report.js";
import mlRoutes from "./routes/mlRoutes.js";




dotenv.config();

const app = express();

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