require("dotenv").config();
import express from "express"; 
import { InferenceClient } from "@huggingface/inference";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";
import { fullstackprompt as fullstackprompt } from "./defaults/fullstack";
import cors from "cors";

const client = new InferenceClient(process.env.HF_TOKEN);
const app = express();
app.use(cors())
app.use(express.json())

// Helper function to clean DeepSeek response by removing <think> tags
function cleanDeepSeekResponse(text: string): string {
    // Remove <think>...</think> blocks including the tags
    return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

app.post("/template", async (req, res) => {
    const prompt = req.body.prompt;
    
    try {
        const response = await client.chatCompletion({
            provider: "fireworks-ai",
            model: "deepseek-ai/DeepSeek-V3",
            messages: [
                {
                    role: "system",
                    content: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 100
        });

        const rawAnswer = response.choices[0].message.content;
        if (!rawAnswer) {
            res.status(500).json({message: "No response from AI"});
            return;
        }
        console.log(rawAnswer);
        const answer = cleanDeepSeekResponse(rawAnswer).toLowerCase();
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

        // if (answer === "fullstack") {
        //     res.json({
        //         prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${fullstackprompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
        //         uiPrompts: [fullstackprompt]
        //     });
        //     return;
        // }

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
        // Convert messages format if needed and add system prompt
        const formattedMessages = [
            {
                role: "system",
                content: getSystemPrompt()
            },
            ...messages
        ];

        const response = await client.chatCompletion({
            provider: "fireworks-ai",
            model: "deepseek-ai/DeepSeek-V3",
            messages: formattedMessages,
            max_tokens: 128000
        });

        console.log(response);

        const rawContent = response.choices[0].message.content;
        if (!rawContent) {
            res.status(500).json({message: "No response from AI"});
            return;
        }
        const cleanedContent = cleanDeepSeekResponse(rawContent);
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