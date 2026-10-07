import fs from 'fs';
import path from 'path';

/**
 * MOCK MONGOOSE PROXY (FOR WIFI-RESTRICTED ENVIRONMENTS)
 * Mimics Mongoose Chat model but saves to local JSON.
 */
class JsonChatProxy {
    constructor(filePath) {
        this.filePath = filePath;
    }

    _read() {
        try {
            if (!fs.existsSync(this.filePath)) return [];
            return JSON.parse(fs.readFileSync(this.filePath, 'utf8') || "[]");
        } catch (e) {
            console.error("❌ JsonChatProxy Read Error:", e);
            return [];
        }
    }

    _write(data) {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (e) {
            console.error("❌ JsonChatProxy Write Error:", e);
        }
    }

    async findOne(query) {
        const logs = this._read();
        // Matches on every field given: { userId, specialist } or { sessionId }
        const chat = logs.find(c => Object.entries(query).every(([key, value]) => c[key] === value));
        if (!chat) return null;
        
        // Return a document with save/toObject methods to mimic Mongoose.
        // The methods are non-enumerable so they are never written to disk,
        // and save() writes the document as it is now (including new fields).
        const filePath = this.filePath;
        const doc = { ...chat };
        Object.defineProperty(doc, "save", {
            enumerable: false,
            value: async function () {
                const currentLogs = JSON.parse(fs.readFileSync(filePath, 'utf8') || "[]");
                const index = currentLogs.findIndex(c => c.userId === doc.userId && c.specialist === doc.specialist);
                if (index !== -1) currentLogs[index] = doc;
                else currentLogs.push(doc);
                fs.writeFileSync(filePath, JSON.stringify(currentLogs, null, 2), 'utf8');
                return doc;
            },
        });
        Object.defineProperty(doc, "toObject", { enumerable: false, value: () => ({ ...doc }) });
        return doc;
    }

    async create(data) {
        const logs = this._read();
        const newChat = { ...data, _id: Date.now().toString() };
        logs.push(newChat);
        this._write(logs);
        return await this.findOne({ userId: data.userId, specialist: data.specialist });
    }

    async deleteOne({ userId, specialist }) {
        const logs = this._read();
        const filtered = logs.filter(c => !(c.userId === userId && c.specialist === specialist));
        this._write(filtered);
    }
}

export const chatDB = new JsonChatProxy(path.resolve('chat_logs.json'));
