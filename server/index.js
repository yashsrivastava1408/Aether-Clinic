import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import chatRoutes from "./routes/chat.js";
import reportRoutes from "./routes/report.js";
import mlRoutes from "./routes/mlRoutes.js";
import authRoutes from "./routes/auth.js";




import mongoose from "mongoose";

// Connect to MongoDB with retry logic
const connectDB = async (retries = 5) => {
  while (retries > 0) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("✅ MongoDB Connected Successfully");
      return;
    } catch (err) {
      retries -= 1;
      console.error(`❌ MongoDB Connection Error. Retries left: ${retries}`);
      console.error(`Error Details: ${err.message}`);
      if (retries === 0) {
        console.error("💀 Could not connect to MongoDB. Exiting...");
        process.exit(1);
      }
      // Wait for 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// connectDB();

import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import winston from "winston";

const app = express();

// --- LOGGING CONFIGURATION ---
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Stream for Morgan to log via Winston
const stream = {
  write: (message) => logger.info(message.trim()),
};

// Data Sanitization (Prevent NoSQL Injection)
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

// --- MIDDLEWARE ---

// 1. Security Headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com", "https://apis.google.com", "https://*.google.com", "https://*.googleapis.com", "https://*.gstatic.com"],
      connectSrc: ["'self'", "http://localhost:5050", "ws://localhost:5050", "https://accounts.google.com", "https://oauth2.googleapis.com", "https://*.googleapis.com", "https://*.google.com"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://*.google.com"],
      imgSrc: ["'self'", "data:", "https:", "https://*.googleusercontent.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// 2. Logging (Morgan)
app.use(morgan("combined", { stream }));

// 3. Compression (Gzip)
app.use(compression());

// 4. Rate Limiting (dev-friendly limits)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs (increased for dev)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use(limiter);

// 5. CORS
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5050"],
  credentials: true
}));
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
app.use("/api/auth", authRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err.stack); // Log error stack via Winston
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  });
});


// server start
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});