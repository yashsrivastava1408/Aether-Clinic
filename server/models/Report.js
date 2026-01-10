import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    // We will encrypt the summary as it contains sensitive health info
    summary: {
        type: String,
        required: true
    },
    // Store the full structured analysis (could also be encrypted string but we'll keep it JSON for now, or stringify+encrypt)
    // For "AES-256" promise, let's encrypt the whole stringified analysis
    encryptedAnalysis: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

const Report = mongoose.model("Report", ReportSchema);
export default Report;
