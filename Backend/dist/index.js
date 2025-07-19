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
//index.ts
require("dotenv").config();
const express_1 = __importDefault(require("express"));
const genai_1 = require("@google/genai");
const prompts_1 = require("./prompts");
const node_1 = require("./defaults/node");
const react_1 = require("./defaults/react");
const cors_1 = __importDefault(require("cors"));
const ai = new genai_1.GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Helper function to clean response (keeping for consistency, though Gemini doesn't use <think> tags)
function cleanResponse(text) {
    // Remove any potential unwanted tags - can be modified if needed
    return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}
app.post("/template", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const prompt = req.body.prompt;
    try {
        const response = yield ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `System: Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra.

User: ${prompt}`
        });
        const rawAnswer = response.text;
        if (!rawAnswer) {
            res.status(500).json({ message: "No response from AI" });
            return;
        }
        console.log(rawAnswer);
        const answer = cleanResponse(rawAnswer).toLowerCase();
        console.log(answer);
        if (answer === "react") {
            res.json({
                prompts: [prompts_1.BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${react_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [react_1.basePrompt]
            });
            return;
        }
        if (answer === "node") {
            res.json({
                prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${node_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n\nIn the beginning of the every response give a very very short description about what your going to do.\n\n`],
                uiPrompts: [node_1.basePrompt]
            });
            return;
        }
        res.status(403).json({ message: "You cant access this" });
        return;
    }
    catch (error) {
        console.error("Error in /template:", error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
}));
app.post("/chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = req.body.messages;
    try {
        // Convert messages to Gemini format - simple string format
        let conversationText = `System: ${(0, prompts_1.getSystemPrompt)()}\n\n`;
        // Add all messages to the conversation
        for (const message of messages) {
            const role = message.role === 'assistant' ? 'Assistant' : 'User';
            conversationText += `${role}: ${message.content}\n\n`;
        }
        const response = yield ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: conversationText
        });
        console.log(response);
        const rawContent = response.text;
        if (!rawContent) {
            res.status(500).json({ message: "No response from AI" });
            return;
        }
        const cleanedContent = cleanResponse(rawContent);
        console.log(cleanedContent);
        res.json({
            response: cleanedContent
        });
    }
    catch (error) {
        console.error("Error in /chat:", error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
}));
app.listen(3000);
