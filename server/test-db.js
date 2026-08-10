import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const testConn = async () => {
    try {
        const uri = "mongodb://admin:AetherClinic123@ac-0h6oi79-shard-00-00.boisw5o.mongodb.net:27017,ac-0h6oi79-shard-00-01.boisw5o.mongodb.net:27017,ac-0h6oi79-shard-00-02.boisw5o.mongodb.net:27017/ai_doctor_db?ssl=true&replicaSet=atlas-hrizkc-shard-0&authSource=admin&retryWrites=true&w=majority";
        console.log("Connecting to:", uri);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
        console.log("✅ Database connectivity test PASSED");
        process.exit(0);
    } catch (err) {
        console.error("❌ Database connectivity test FAILED");
        console.error(err);
        process.exit(1);
    }
};

testConn();
