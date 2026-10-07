import mongoose from "mongoose";

// One document per user. `data` is the AES-encrypted JSON list of
// consultation summaries (see utils/memoryStore.js).
const PatientMemorySchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    data: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
});

const PatientMemory = mongoose.model("PatientMemory", PatientMemorySchema);
export default PatientMemory;
