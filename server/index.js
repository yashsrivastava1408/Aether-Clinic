import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import chatRoutes from "./routes/chat.js";
import reportRoutes from "./routes/report.js";
import mlRoutes from "./routes/mlRoutes.js";




import mongoose from "mongoose";

import rateLimit from "express-rate-limit";
import helmet from "helmet";

const app = express();

// Security Headers
app.use(helmet());

// Data Sanitization (Prevent NoSQL Injection)
// Custom Data Sanitization (Prevent NoSQL Injection)
const sanitize = (obj) => {
  if (obj instanceof Object) {
    for (const key in obj) {
      if (/^\$/.test(key) || /\./.test(key)) {
        delete obj[key];
      } else {
        sanitize(obj[key]);
      }
    }
  }
};

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai-doctor";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));


// middlewares
app.use(cors());
app.use(express.json());

// Apply Sanitization
app.use((req, res, next) => {
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
});

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