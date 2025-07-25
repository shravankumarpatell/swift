//index.ts
require("dotenv").config();
import express from "express"; 
import { GoogleGenAI } from "@google/genai";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";
import { fullstackprompt as fullstackprompt } from "./defaults/fullstack";
import cors from "cors";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});
const app = express();
app.use(cors())
app.use(express.json())

// Helper function to clean response (keeping for consistency, though Gemini doesn't use <think> tags)
function cleanResponse(text: string): string {
    // Remove any potential unwanted tags - can be modified if needed
    return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

app.post("/template", async (req, res) => {
    const prompt = req.body.prompt;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `System: Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra.

User: ${prompt}`
        });

        const rawAnswer = response.text;
        if (!rawAnswer) {
            res.status(500).json({message: "No response from AI"});
            return;
        }
        console.log(rawAnswer);
        const answer = cleanResponse(rawAnswer).toLowerCase();
        console.log(answer);
        
        if (answer === "react") {
            res.json({
                prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [reactBasePrompt]
            });
            return;
        }

        if (answer === "node") {
            res.json({
                prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n\nIn the beginning of the every response give a very very short description about what your going to do.\n\n`],
                uiPrompts: [nodeBasePrompt]
            });
            return;
        }

        res.status(403).json({message: "You cant access this"});
        return;

    } catch (error) {
        console.error("Error in /template:", error);
        res.status(500).json({message: "Internal server error"});
        return;
    }
})

app.post("/chat", async (req, res) => {
    const messages = req.body.messages;
    
    try {
        // Convert messages to Gemini format - simple string format
        let conversationText = `System: ${getSystemPrompt()}\n\n`;
        
        // Add all messages to the conversation
        for (const message of messages) {
            const role = message.role === 'assistant' ? 'Assistant' : 'User';
            conversationText += `${role}: ${message.content}\n\n`;
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: conversationText
        });

        console.log(response);

        const rawContent = response.text;
        if (!rawContent) {
            res.status(500).json({message: "No response from AI"});
            return;
        }
        const cleanedContent = cleanResponse(rawContent);
        console.log(cleanedContent);

        res.json({
            response: cleanedContent
        });

    } catch (error) {
        console.error("Error in /chat:", error);
        res.status(500).json({message: "Internal server error"});
        return;
    }
})

app.listen(3000);