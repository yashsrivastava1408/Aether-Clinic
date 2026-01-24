import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const viewData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const users = await User.find().sort({ lastLogin: -1 }).limit(5);

        console.log("\n📦 Recent Users (Last 5):");
        if (users.length === 0) {
            console.log("   (No users found)");
        }

        users.forEach(u => {
            console.log("------------------------------------------------");
            console.log(`👤 Name:     ${u.name}`);
            console.log(`📧 Email:    ${u.email}`);
            console.log(`📍 Location: ${u.locationConsent ? 'ALLOWED' : 'DENIED'}`);
            if (u.location && u.location.lat) {
                console.log(`   Coords:   ${u.location.lat}, ${u.location.lng}`);
            }
            console.log(`⏰ Last Seen: ${u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'N/A'}`);
        });
        console.log("------------------------------------------------\n");

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected");
    }
};

viewData();
