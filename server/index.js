import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// existing routes
import chatRoutes from "./routes/chat.js";

// report analyzer route (new, added only)
import reportRoutes from "./routes/report.js";

dotenv.config();

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// health check
app.get("/", (req, res) => {
  res.send("✅ AI Doctor Backend is running!");
});

// existing API (UNCHANGED)
app.use("/api/chat", chatRoutes);

// new API (ADDED ONLY)
app.use("/api/report", reportRoutes);

// server start
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});