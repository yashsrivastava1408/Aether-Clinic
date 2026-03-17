/**
 * Aether Clinic — RAG Intelligence Service (v2)
 * ==============================================
 * Replaces the old keyword-based ragService.js with a client that communicates
 * with the Python Multi-Agent Intelligence Hub.
 *
 * Flow:
 *   1. Node.js sends query → Python Intelligence Hub (/api/intelligence/query)
 *   2. Hub runs: Triage Classifier → Knowledge Retriever (ChromaDB) → Citation Extractor
 *   3. Returns: formatted context + citations + classification
 *   4. After LLM response: Node.js sends → Python (/api/intelligence/verify)
 *   5. Safety Oversight verifies and amends the response if needed
 *
 * Fallback: If the Intelligence Hub is unavailable, falls back to the legacy
 * keyword-based JSON retrieval for resilience.
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Intelligence Hub configuration
const INTELLIGENCE_BASE_URL = process.env.INTELLIGENCE_BASE_URL || 'http://localhost:5001';

// =============================
// Legacy Fallback (from original ragService.js)
// =============================
const KNOWLEDGE_PATH = path.join(__dirname, '../data/medical_knowledge.json');
let legacyKnowledgeBase = [];

try {
    if (fs.existsSync(KNOWLEDGE_PATH)) {
        const data = fs.readFileSync(KNOWLEDGE_PATH, 'utf8');
        legacyKnowledgeBase = JSON.parse(data);
        console.log(`📚 RAG v2: Legacy fallback loaded (${legacyKnowledgeBase.length} entries).`);
    }
} catch (err) {
    console.warn("⚠️ RAG v2: Legacy knowledge file not found. Fallback disabled.");
}

/**
 * Legacy keyword-based retrieval (used as fallback when Intelligence Hub is down)
 */
const legacyRetrieve = (query) => {
    if (!query || legacyKnowledgeBase.length === 0) return null;
    const queryLower = query.toLowerCase();

    // Exact phrase match
    for (const entry of legacyKnowledgeBase) {
        for (const keyword of entry.keywords) {
            if (keyword.includes(' ') && queryLower.includes(keyword)) {
                return entry.content;
            }
        }
    }

    // Multi-keyword match
    for (const entry of legacyKnowledgeBase) {
        const matchCount = entry.keywords.filter(kw => queryLower.includes(kw)).length;
        if (matchCount >= 2) return entry.content;
    }

    return null;
};

// =============================
// Intelligence Hub Client
// =============================

/**
 * Queries the Multi-Agent Intelligence Hub for relevant medical context.
 *
 * @param {string} query - The user's message/symptoms
 * @param {string} specialization - Medical specialization (e.g., "Cardiology")
 * @param {string} conversationContext - Recent conversation messages for context enrichment
 * @returns {Object} { context, citations, classification, hasContext, usedFallback }
 */
export const retrieveIntelligence = async (query, specialization = "General Medicine", conversationContext = "") => {
    try {
        const response = await axios.post(`${INTELLIGENCE_BASE_URL}/api/intelligence/query`, {
            query,
            specialization,
            conversation_context: conversationContext,
            n_results: 5
        }, {
            timeout: 10000 // 10 second timeout
        });

        const data = response.data;

        console.log(`🧠 RAG v2: Intelligence Hub returned ${data.chunk_count} chunks`);
        console.log(`   Classification: ${data.classification?.category} | Urgency: ${data.classification?.urgency}`);
        console.log(`   Citations: ${data.citations?.length || 0}`);

        return {
            context: data.context || "",
            citations: data.citations || [],
            classification: data.classification || {},
            hasContext: data.has_context || false,
            usedFallback: false
        };

    } catch (error) {
        // Intelligence Hub is unavailable — fall back to legacy
        console.warn(`⚠️ RAG v2: Intelligence Hub unavailable (${error.message}). Using legacy fallback.`);

        const legacyContext = legacyRetrieve(query);

        return {
            context: legacyContext || "",
            citations: legacyContext ? [{
                title: "Internal Medical Protocol",
                source: "Legacy Knowledge Base",
                category: "General",
                relevance: 0.7
            }] : [],
            classification: {
                category: "general_medicine",
                urgency: "routine",
                is_emergency: false,
                routing_hint: "Fallback mode — keyword matching"
            },
            hasContext: !!legacyContext,
            usedFallback: true
        };
    }
};

/**
 * Verifies an AI response through the Safety Oversight Agent.
 *
 * @param {string} aiResponse - The AI-generated response
 * @param {string} retrievedContext - The medical context that was used
 * @param {string} userQuery - The original user query
 * @param {string} urgency - Urgency level from classification
 * @returns {Object} { isSafe, modifiedResponse, warningsAdded, violationsFound, safetyScore }
 */
export const verifyResponse = async (aiResponse, retrievedContext, userQuery, urgency = "routine") => {
    try {
        const response = await axios.post(`${INTELLIGENCE_BASE_URL}/api/intelligence/verify`, {
            ai_response: aiResponse,
            retrieved_context: retrievedContext,
            user_query: userQuery,
            urgency
        }, {
            timeout: 5000 // 5 second timeout
        });

        const data = response.data;

        if (data.warnings_added?.length > 0 || data.violations_found?.length > 0) {
            console.log(`🛡️ Safety Oversight: score=${data.safety_score}, ` +
                `warnings=${data.warnings_added?.length || 0}, violations=${data.violations_found?.length || 0}`);
        }

        return {
            isSafe: data.is_safe,
            modifiedResponse: data.modified_response || aiResponse,
            warningsAdded: data.warnings_added || [],
            violationsFound: data.violations_found || [],
            safetyScore: data.safety_score || 1.0
        };

    } catch (error) {
        // If safety service is unavailable, pass through the original response
        console.warn(`⚠️ Safety verification unavailable (${error.message}). Passing through.`);
        return {
            isSafe: true,
            modifiedResponse: aiResponse,
            warningsAdded: [],
            violationsFound: [],
            safetyScore: 0.5
        };
    }
};

/**
 * Backward-compatible wrapper: returns just the context string.
 * This ensures the chatController.js can use either old or new RAG seamlessly.
 *
 * @param {string} query - The search query
 * @returns {string|null} The retrieved context text, or null if nothing found
 */
export const retrieveContext = (query) => {
    // This is a synchronous fallback for backward compatibility
    // The chatController should prefer retrieveIntelligence() for full features
    return legacyRetrieve(query);
};
