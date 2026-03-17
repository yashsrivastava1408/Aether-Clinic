import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const testConn = async () => {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log("✅ Database connectivity test PASSED");
        process.exit(0);
    } catch (err) {
        console.error("❌ Database connectivity test FAILED");
        console.error(err);
        process.exit(1);
    }
};

testConn();
