// //index.ts
// require("dotenv").config();
// import express from "express"; 
// import { GoogleGenAI } from "@google/genai";
// import { BASE_PROMPT, getSystemPrompt } from "./prompts";
// import { basePrompt as nodeBasePrompt } from "./defaults/node";
// import { basePrompt as reactBasePrompt } from "./defaults/react";
// import { fullstackprompt as fullstackprompt } from "./defaults/fullstack";
// import cors from "cors";

// const ai = new GoogleGenAI({
//     apiKey: process.env.GEMINI_API_KEY
// });
// const app = express();
// app.use(cors())
// app.use(express.json())

// // Helper function to clean response (keeping for consistency, though Gemini doesn't use <think> tags)
// function cleanResponse(text: string): string {
//     // Remove any potential unwanted tags - can be modified if needed
//     return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
// }

// app.post("/template", async (req, res) => {
//     const prompt = req.body.prompt;
    
//     try {
//         const response = await ai.models.generateContent({
//             model: "gemini-2.5-pro",
//             contents: `System: Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra.

// User: ${prompt}`
//         });

//         const rawAnswer = response.text;
//         if (!rawAnswer) {
//             res.status(500).json({message: "No response from AI"});
//             return;
//         }
//         console.log(rawAnswer);
//         const answer = cleanResponse(rawAnswer).toLowerCase();
//         console.log(answer);
        
//         if (answer === "react") {
//             res.json({
//                 prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
//                 uiPrompts: [reactBasePrompt]
//             });
//             return;
//         }

//         if (answer === "node") {
//             res.json({
//                 prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n\nIn the beginning of the every response give a very very short description about what your going to do.\n\n`],
//                 uiPrompts: [nodeBasePrompt]
//             });
//             return;
//         }

//         res.status(403).json({message: "You cant access this"});
//         return;

//     } catch (error) {
//         console.error("Error in /template:", error);
//         res.status(500).json({message: "Internal server error"});
//         return;
//     }
// })

// app.post("/chat", async (req, res) => {
//     const messages = req.body.messages;
    
//     try {
//         // Convert messages to Gemini format - simple string format
//         let conversationText = `System: ${getSystemPrompt()}\n\n`;
        
//         // Add all messages to the conversation
//         for (const message of messages) {
//             const role = message.role === 'assistant' ? 'Assistant' : 'User';
//             conversationText += `${role}: ${message.content}\n\n`;
//         }

//         const response = await ai.models.generateContent({
//             model: "gemini-2.5-pro",
//             contents: conversationText
//         });

//         console.log(response);

//         const rawContent = response.text;
//         if (!rawContent) {
//             res.status(500).json({message: "No response from AI"});
//             return;
//         }
//         const cleanedContent = cleanResponse(rawContent);
//         console.log(cleanedContent);

//         res.json({
//             response: cleanedContent
//         });

//     } catch (error) {
//         console.error("Error in /chat:", error);
//         res.status(500).json({message: "Internal server error"});
//         return;
//     }
// })

// app.listen(3000);


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

// Function to validate and fix JSON content
function validateAndFixJsonContent(content: string, filename: string = 'unknown'): string {
    try {
        // Try to parse the JSON first
        const parsed = JSON.parse(content);
        return JSON.stringify(parsed, null, 2); // Return prettified JSON
    } catch (error) {
        console.warn(`⚠️ Invalid JSON in ${filename}, attempting to fix...`);
        console.error('JSON Error:', error);
        console.log('Problematic content preview:', content.substring(0, 200) + '...');
        
        // Common JSON fixes
        let fixedContent = content
            // Remove trailing commas before closing brackets/braces
            .replace(/,(\s*[}\]])/g, '$1')
            // Fix unescaped quotes in strings (basic attempt)
            .replace(/([^\\])"/g, '$1\\"')
            // Remove any null bytes or control characters
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            // Remove any BOM or weird characters at start
            .replace(/^\uFEFF/, '')
            // Trim whitespace
            .trim();

        // Try parsing the fixed content
        try {
            const parsed = JSON.parse(fixedContent);
            console.log('✅ Successfully fixed JSON');
            return JSON.stringify(parsed, null, 2);
        } catch (stillError) {
            console.error(`❌ Could not fix JSON in ${filename}:`, stillError);
            
            // If it's package.json, return a minimal valid one
            if (filename.includes('package.json')) {
                console.log('🔧 Returning minimal package.json as fallback');
                return JSON.stringify({
                    "name": "generated-app",
                    "version": "1.0.0",
                    "type": "module",
                    "scripts": {
                        "dev": "vite",
                        "build": "vite build",
                        "preview": "vite preview"
                    },
                    "dependencies": {
                        "react": "^18.2.0",
                        "react-dom": "^18.2.0"
                    },
                    "devDependencies": {
                        "@types/react": "^18.2.66",
                        "@types/react-dom": "^18.2.22",
                        "@vitejs/plugin-react": "^4.2.1",
                        "typescript": "^5.2.2",
                        "vite": "^5.2.0"
                    }
                }, null, 2);
            }
            
            // For other JSON files, return empty object
            return JSON.stringify({}, null, 2);
        }
    }
}

// Function to process and validate AI response content
function processAIResponse(content: string): string {
    console.log('📝 Processing AI response...');
    
    // Extract and validate JSON files from boltAction tags
    const processedContent = content.replace(
        /<boltAction\s+type="file"\s+filePath="([^"]*\.json)"[^>]*>([\s\S]*?)<\/boltAction>/g,
        (match, filePath, fileContent) => {
            console.log(`🔍 Found JSON file: ${filePath}`);
            
            // Clean the file content (remove extra whitespace, etc.)
            let cleanedContent = fileContent.trim();
            
            // Validate and fix the JSON
            const validatedContent = validateAndFixJsonContent(cleanedContent, filePath);
            
            return `<boltAction type="file" filePath="${filePath}">${validatedContent}</boltAction>`;
        }
    );
    
    return processedContent;
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
        console.log('Template response:', rawAnswer);
        const answer = cleanResponse(rawAnswer).toLowerCase();
        console.log('Cleaned answer:', answer);
        
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

        console.log('🤖 Sending request to Gemini...');
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: conversationText
        });

        console.log('📨 Received response from Gemini');

        const rawContent = response.text;
        if (!rawContent) {
            res.status(500).json({message: "No response from AI"});
            return;
        }
        
        // Clean the response first
        const cleanedContent = cleanResponse(rawContent);
        
        // Process and validate JSON files in the response
        const processedContent = processAIResponse(cleanedContent);
        
        console.log('✅ Response processed and validated');

        res.json({
            response: processedContent
        });

    } catch (error) {
        console.error("Error in /chat:", error);
        res.status(500).json({message: "Internal server error"});
        return;
    }
})

app.listen(3000, () => {
    console.log('🚀 Backend server started on port 3000');
    console.log('🔧 JSON validation enabled for AI responses');
});