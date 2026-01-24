import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const runTest = async () => {
    console.log("--- Testing Standard MongoDB Connection ---");

    // Standard connection string constructed from resolved SRV nodes
    const STANDARD_URI = "mongodb://imyashsrivastava_db_user:IPdR3PWdOuAkc7wz@ac-0h6oi79-shard-00-00.boisw5o.mongodb.net:27017,ac-0h6oi79-shard-00-01.boisw5o.mongodb.net:27017,ac-0h6oi79-shard-00-02.boisw5o.mongodb.net:27017/ai_doctor_db?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

    try {
        await mongoose.connect(STANDARD_URI);
        console.log("✅ MongoDB Connected (Standard URI)");
    } catch (error) {
        console.error("❌ MongoDB Error (Standard):", error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
