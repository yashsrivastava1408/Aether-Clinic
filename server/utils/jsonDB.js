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

    async findOne({ userId, specialist }) {
        const logs = this._read();
        const chat = logs.find(c => c.userId === userId && c.specialist === specialist);
        if (!chat) return null;
        
        // Return object with save method to mimic Mongoose
        return {
            ...chat,
            save: async function() {
                const currentLogs = JSON.parse(fs.readFileSync(this.filePath, 'utf8') || "[]");
                const index = currentLogs.findIndex(c => c.userId === this.userId && c.specialist === this.specialist);
                if (index !== -1) currentLogs[index] = this;
                else currentLogs.push(this);
                fs.writeFileSync(this.filePath, JSON.stringify(currentLogs, null, 2), 'utf8');
                return this;
            }.bind({ ...chat, filePath: this.filePath }),
            toObject: () => chat
        };
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
