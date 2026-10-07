/**
 * Long-term patient memory: a short, encrypted list of finished consultations
 * per user (date, specialist, complaint, duration, history the user mentioned).
 *
 * Entries come from the Python service and contain only things the user said.
 * Stored in MongoDB when connected, in patient_memory.json otherwise.
 */

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import PatientMemory from "../models/PatientMemory.js";
import { encrypt, decrypt } from "./encryption.js";

const MAX_ENTRIES = 10;
const FILE_PATH = path.resolve("patient_memory.json");

const usingMongo = () => mongoose.connection.readyState === 1;

const readFile = () => {
    try {
        return fs.existsSync(FILE_PATH) ? JSON.parse(fs.readFileSync(FILE_PATH, "utf8") || "{}") : {};
    } catch {
        return {};
    }
};

const decode = (data) => {
    try {
        const entries = JSON.parse(decrypt(data));
        return Array.isArray(entries) ? entries : [];
    } catch {
        return [];
    }
};

export const getMemory = async (userId) => {
    if (!userId) return [];
    if (usingMongo()) {
        const doc = await PatientMemory.findOne({ userId });
        return doc ? decode(doc.data) : [];
    }
    const stored = readFile()[userId];
    return stored ? decode(stored) : [];
};

export const addMemoryEntry = async (userId, entry) => {
    if (!userId || !entry?.complaint) return;
    const entries = [...(await getMemory(userId)), entry].slice(-MAX_ENTRIES);
    const data = encrypt(JSON.stringify(entries));
    if (usingMongo()) {
        await PatientMemory.updateOne({ userId }, { data, updatedAt: new Date() }, { upsert: true });
        return;
    }
    const all = readFile();
    all[userId] = data;
    fs.writeFileSync(FILE_PATH, JSON.stringify(all, null, 2), "utf8");
};

export const clearMemory = async (userId) => {
    if (usingMongo()) {
        await PatientMemory.deleteOne({ userId });
        return;
    }
    const all = readFile();
    delete all[userId];
    fs.writeFileSync(FILE_PATH, JSON.stringify(all, null, 2), "utf8");
};

/**
 * The text sent with a chat turn: the most recent consultations, newest last.
 */
export const memoryDigest = (entries, limit = 5) =>
    entries.slice(-limit).map((e) => {
        const parts = [`${e.date} ${e.specialist}: ${e.complaint}`];
        if (e.duration) parts.push(`for ${e.duration}`);
        if (e.urgency && e.urgency !== "routine") parts.push(`(${e.urgency})`);
        if (e.relevant_history) parts.push(`History mentioned: ${e.relevant_history}`);
        return parts.join(" ");
    }).join("\n");
