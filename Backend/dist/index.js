"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// index.ts
require("dotenv").config();
const express_1 = __importDefault(require("express"));
const genai_1 = require("@google/genai");
const prompts_1 = require("./prompts");
const node_1 = require("./defaults/node");
const react_1 = require("./defaults/react");
const cors_1 = __importDefault(require("cors"));
// ─── Configuration ───────────────────────────────────────────────────────────
const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 8192;
const TEMPERATURE = 0.7;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;
const ai = new genai_1.GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// ─── Helpers ─────────────────────────────────────────────────────────────────
/**
 * Converts frontend message format { role, content } into Gemini SDK
 * structured contents array with proper roles ("user" | "model").
 */
function buildContents(messages) {
    return messages.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
    }));
}
/**
 * Clean response text – removes unwanted <think> tags if any model
 * injects them (safety net).
 */
function cleanResponse(text) {
    return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}
/**
 * Sleep helper for exponential backoff.
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Calls Gemini generateContent with automatic retry + exponential backoff
 * for transient errors (429, 503, 500).
 */
function generateWithRetry(params) {
    return __awaiter(this, void 0, void 0, function* () {
        let lastError;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const start = Date.now();
                const response = yield ai.models.generateContent(params);
                const elapsed = Date.now() - start;
                console.log(`[Gemini] Model: ${params.model} | Took: ${elapsed}ms | Attempt: ${attempt + 1}`);
                // Debug: log response structure if text is missing
                if (!response.text) {
                    console.warn(`[Gemini] response.text is empty. Full response:`, JSON.stringify(response, null, 2));
                }
                return response;
            }
            catch (error) {
                lastError = error;
                const status = (error === null || error === void 0 ? void 0 : error.status) || (error === null || error === void 0 ? void 0 : error.httpStatusCode) || 0;
                const isRetryable = status === 429 || status === 503 || status === 500;
                if (isRetryable && attempt < MAX_RETRIES - 1) {
                    const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
                    console.warn(`[Gemini] Retryable error (${status}). Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
                    yield sleep(delay);
                    continue;
                }
                // Non-retryable or exhausted retries
                throw error;
            }
        }
        throw lastError;
    });
}
/**
 * Safely extracts text from a Gemini generateContent response.
 * Falls back to candidates[0].content.parts[0].text if response.text is null.
 */
function extractText(response) {
    var _a, _b;
    // Try the direct accessor first
    if (response.text) {
        return response.text;
    }
    // Fallback: dig into candidates
    try {
        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
            const parts = (_b = (_a = candidates[0]) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.parts;
            if (parts && parts.length > 0 && parts[0].text) {
                return parts[0].text;
            }
        }
    }
    catch (e) {
        // ignore extraction errors
    }
    return null;
}
/**
 * Maps Gemini SDK errors to appropriate HTTP status codes.
 */
function getHttpStatus(error) {
    const status = (error === null || error === void 0 ? void 0 : error.status) || (error === null || error === void 0 ? void 0 : error.httpStatusCode) || 0;
    if (status === 429)
        return 429; // Rate limited
    if (status === 401 || status === 403)
        return 401; // Auth error
    if (status === 400)
        return 400; // Bad request
    return 500; // Internal server error
}
/**
 * Extracts a user-friendly error message from Gemini SDK errors.
 */
function getErrorMessage(error) {
    const status = (error === null || error === void 0 ? void 0 : error.status) || (error === null || error === void 0 ? void 0 : error.httpStatusCode) || 0;
    if (status === 429)
        return "Rate limit exceeded. Please try again in a moment.";
    if (status === 401 || status === 403)
        return "API authentication error. Check your API key.";
    if (status === 400)
        return "Invalid request to the AI model.";
    return "An error occurred while generating the response. Please try again.";
}
// ─── Routes ──────────────────────────────────────────────────────────────────
app.post("/template", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const prompt = req.body.prompt;
    if (!prompt || typeof prompt !== "string") {
        res.status(400).json({ message: "Prompt is required" });
        return;
    }
    try {
        const response = yield generateWithRetry({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
                systemInstruction: "Return either node or react based on what you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra.",
                maxOutputTokens: 100,
                temperature: 0,
                thinkingConfig: {
                    thinkingBudget: 0,
                },
            },
        });
        const rawAnswer = extractText(response);
        if (!rawAnswer) {
            res.status(500).json({ message: "No response from AI" });
            return;
        }
        console.log(`[/template] Raw answer: "${rawAnswer}"`);
        const answer = cleanResponse(rawAnswer).toLowerCase().trim();
        console.log(`[/template] Cleaned answer: "${answer}"`);
        if (answer === "react") {
            res.json({
                prompts: [
                    prompts_1.BASE_PROMPT,
                    `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${react_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
                ],
                uiPrompts: [react_1.basePrompt],
            });
            return;
        }
        if (answer === "node") {
            res.json({
                prompts: [
                    `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${node_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n\nIn the beginning of the every response give a very very short description about what your going to do.\n\n`,
                ],
                uiPrompts: [node_1.basePrompt],
            });
            return;
        }
        res.status(403).json({ message: "You cant access this" });
        return;
    }
    catch (error) {
        console.error("[/template] Error:", (error === null || error === void 0 ? void 0 : error.message) || error);
        res
            .status(getHttpStatus(error))
            .json({ message: getErrorMessage(error) });
        return;
    }
}));
app.post("/chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = req.body.messages;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ message: "Messages array is required" });
        return;
    }
    try {
        // Build structured contents for multi-turn conversation
        const contents = buildContents(messages);
        const response = yield generateWithRetry({
            model: GEMINI_MODEL,
            contents: contents,
            config: {
                systemInstruction: (0, prompts_1.getSystemPrompt)(),
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                temperature: TEMPERATURE,
            },
        });
        const rawContent = extractText(response);
        if (!rawContent) {
            res.status(500).json({ message: "No response from AI" });
            return;
        }
        const cleanedContent = cleanResponse(rawContent);
        console.log(`[/chat] Response length: ${cleanedContent.length} chars`);
        res.json({
            response: cleanedContent,
        });
    }
    catch (error) {
        console.error("[/chat] Error:", (error === null || error === void 0 ? void 0 : error.message) || error);
        res
            .status(getHttpStatus(error))
            .json({ message: getErrorMessage(error) });
        return;
    }
}));
// ─── Server Start ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[Swift Backend] Running on port ${PORT}`);
    console.log(`[Swift Backend] Model: ${GEMINI_MODEL}`);
});
