// require("dotenv").config();
// import express from "express"; 
// import Anthropic from "@anthropic-ai/sdk";
// import { BASE_PROMPT, getSystemPrompt } from "./prompts";
// import { ContentBlock, TextBlock } from "@anthropic-ai/sdk/resources";
// import {basePrompt as nodeBasePrompt} from "./defaults/node";
// import {basePrompt as reactBasePrompt} from "./defaults/react";
// import cors from "cors";

// const anthropic = new Anthropic();
// const app = express();
// app.use(cors())
// app.use(express.json())

// app.post("/template", async (req, res) => {
//     const prompt = req.body.prompt;
    
//     const response = await anthropic.messages.create({
//         messages: [{
//             role: 'user', content: prompt
//         }],
//         model: 'claude-3-5-sonnet-20241022',
//         max_tokens: 100,
//         system: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"
//     })

//     const answer = (response.content[0] as TextBlock).text; // react or node
//     if (answer == "react") {
//         res.json({
//             prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
//             uiPrompts: [reactBasePrompt]
//         })
//         return;
//     }

//     if (answer === "node") {
//         res.json({
//             prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
//             uiPrompts: [nodeBasePrompt]
//         })
//         return;
//     }

//     res.status(403).json({message: "You cant access this"})
//     return;

// })

// app.post("/chat", async (req, res) => {
//     const messages = req.body.messages;
//     const response = await anthropic.messages.create({
//         messages: messages,
//         model: 'claude-3-5-sonnet-20241022',
//         max_tokens: 8192,
//         system: getSystemPrompt()
//     })

//     console.log(response);

//     res.json({
//         response: (response.content[0] as TextBlock)?.text
//     });
// })

// app.listen(3000);


// require("dotenv").config();
// import express from "express";
// import cors from "cors";

// // 🔄 Replace Anthropic SDK with Hugging Face InferenceClient
// import { InferenceClient } from "@huggingface/inference";

// import { BASE_PROMPT, getSystemPrompt } from "./prompts";
// import { basePrompt as nodeBasePrompt } from "./defaults/node";
// import { basePrompt as reactBasePrompt } from "./defaults/react";
// import { ContentBlock, TextBlock } from "@anthropic-ai/sdk/resources"; // we’ll cast to TextBlock for compatibility

// const client = new InferenceClient(process.env.HF_TOKEN);
// const app = express();

// app.use(cors());
// app.use(express.json());

// app.post("/template", async (req, res)  => {
//   const prompt = req.body.prompt;

//   // 🔄 HF chatCompletion in place of Anthropic.messages.create
//   const hfResponse = await client.chatCompletion({
//     provider: "fireworks-ai",
//     model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
//     messages: [{ role: "user", content: `${prompt} . Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra` }],
//   });

//   // hfResponse.choices[0].message.content is your text
//   const rawContent = hfResponse.choices?.[0]?.message.content;
//       if (!rawContent) {
//         throw new Error("No response content received from chat completion");
//       }
//       console.log("Raw template response:", rawContent);
//       const answer = rawContent.trim().toLowerCase()

//   if (answer === "react") {
//      res.json({
//       prompts: [
//         BASE_PROMPT,
//         `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
//       ],
//       uiPrompts: [reactBasePrompt],
//     });
//     return;
//   }

//   if (answer === "node") {
//     res.json({
//       prompts: [
//         `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
//       ],
//       uiPrompts: [nodeBasePrompt],
//     });
//     return;
//   }

//    res.status(403).json({ message: "You can't access this" });
// });

// app.post("/chat", async (req, res) => {
//   const messages = req.body.messages;
//   const reply = `${messages}, ${getSystemPrompt()}`;

//   // 🔄 HF chatCompletion in place of Anthropic.messages.create
//   const hfResponse = await client.chatCompletion({
//     provider: "fireworks-ai",
//     model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
//     messages: reply,
//   });

//   console.log(res.json({ response: hfResponse.choices[0].message.content }));

//   res.json({ response: hfResponse.choices[0].message.content });
// });

// app.listen(3000, () => {
//   console.log("Server listening on port 3000");
// });


// require("dotenv").config();
// import express from "express"; 
// import { InferenceClient } from "@huggingface/inference";
// import { BASE_PROMPT, getSystemPrompt } from "./prompts";
// import {basePrompt as nodeBasePrompt} from "./defaults/node";
// import {basePrompt as reactBasePrompt} from "./defaults/react";
// import cors from "cors";

// const client = new InferenceClient(process.env.HF_TOKEN);
// const app = express();
// app.use(cors())
// app.use(express.json())

// // Helper function to format messages for Hugging Face API
// function formatMessagesForHF(messages: any[], systemPrompt?: string) {
//     const formattedMessages = [];
    
//     // Add system message if provided
//     if (systemPrompt) {
//         formattedMessages.push({
//             role: "system",
//             content: systemPrompt
//         });
//     }
    
//     // Add user messages
//     messages.forEach(msg => {
//         formattedMessages.push({
//             role: msg.role,
//             content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
//         });
//     });
    
//     return formattedMessages;
// }

// // Helper function to make API call with retry logic
// async function makeHFAPICall(messages: any[], maxTokens: number = 8192, systemPrompt?: string) {
//     try {
//         const formattedMessages = formatMessagesForHF(messages, systemPrompt);
        
//         const response = await client.chatCompletion({
//             provider: "cerebras",
//             model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
//             messages: formattedMessages,
//             max_tokens: maxTokens,
//             temperature: 1,
//             stream: false
//         });
        
//         return response.choices[0]?.message?.content || "";
//     } catch (error) {
//         console.error("Hugging Face API error:", error);
//         throw new Error("Failed to get response from Hugging Face API");
//     }
// }

// app.post("/template", async (req, res) => {
//     try {
//         const prompt = req.body.prompt;
        
//         const systemPrompt = "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra";
        
//         const messages = [{
//             role: 'user', 
//             content: prompt
//         }];
        
//         const answer = await makeHFAPICall(messages, 100, systemPrompt);
        
//         // Clean the response to get just the word
//         const cleanAnswer = answer.trim().toLowerCase();
        
//         if (cleanAnswer.includes("react")) {
//             res.json({
//                 prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
//                 uiPrompts: [reactBasePrompt]
//             });
//             return;
//         }

//         if (cleanAnswer.includes("node")) {
//             res.json({
//                 prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
//                 uiPrompts: [nodeBasePrompt]
//             });
//             return;
//         }

//         // Default to react if unclear
//         res.json({
//             prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
//             uiPrompts: [reactBasePrompt]
//         });
        
//     } catch (error) {
//         console.error("Error in /template endpoint:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });

// app.post("/chat", async (req, res) => {
//     try {
//         const messages = req.body.messages;
//         const systemPrompt = getSystemPrompt();
        
//         const response = await makeHFAPICall(messages, 8192, systemPrompt);
        
//         console.log("HF API Response:", response);

//         res.json({
//             response: response
//         });
        
//     } catch (error) {
//         console.error("Error in /chat endpoint:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });

// app.listen(3000, () => {
//     console.log("Server running on port 3000");
// });


require("dotenv").config();
import express from "express"; 
import { InferenceClient } from "@huggingface/inference";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";
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
                prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
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