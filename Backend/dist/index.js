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
require("dotenv").config();
const express_1 = __importDefault(require("express"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const prompts_1 = require("./prompts");
const node_1 = require("./defaults/node");
const react_1 = require("./defaults/react");
const cors_1 = __importDefault(require("cors"));
const anthropic = new sdk_1.default();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post("/template", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const prompt = req.body.prompt;
    const response = yield anthropic.messages.create({
        messages: [{
                role: 'user', content: prompt
            }],
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        system: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"
    });
    const answer = response.content[0].text; // react or node
    if (answer == "react") {
        res.json({
            prompts: [prompts_1.BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${react_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [react_1.basePrompt]
        });
        return;
    }
    if (answer === "node") {
        res.json({
            prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${node_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [node_1.basePrompt]
        });
        return;
    }
    res.status(403).json({ message: "You cant access this" });
    return;
}));
app.post("/chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const messages = req.body.messages;
    const response = yield anthropic.messages.create({
        messages: messages,
        model: 'claude-opus-4-20250514',
        max_tokens: 8192,
        system: (0, prompts_1.getSystemPrompt)()
    });
    console.log(response);
    res.json({
        response: (_a = response.content[0]) === null || _a === void 0 ? void 0 : _a.text
    });
}));
app.listen(3000);
//index.ts
// //index.ts
// require("dotenv").config();
// import express from "express"; 
// import Anthropic from "@anthropic-ai/sdk";
// import { BASE_PROMPT, getSystemPrompt } from "./prompts";
// import { ContentBlock, TextBlock, Message } from "@anthropic-ai/sdk/resources";
// import {basePrompt as nodeBasePrompt} from "./defaults/node";
// import {basePrompt as reactBasePrompt} from "./defaults/react";
// import cors from "cors";
// const anthropic = new Anthropic();
// const app = express();
// app.use(cors())
// app.use(express.json())
// interface ChatMessage {
//     role: 'user' | 'assistant';
//     content: string | ContentBlock[];
// }
// interface CompleteResponse {
//     content: string;
//     isComplete: boolean;
//     error?: string;
// }
// // Helper function to extract text from content blocks
// function extractTextFromContent(content: ContentBlock[]): string {
//     return content
//         .filter(block => block.type === 'text')
//         .map(block => (block as TextBlock).text)
//         .join('');
// }
// // Helper function to make API requests with retry logic and streaming support
// async function makeRequestWithRetry(
//     messages: ChatMessage[], 
//     model: string = 'claude-opus-4-20250514',
//     maxTokens: number = 64000,
//     systemPrompt?: string,
//     maxRetries: number = 3,
//     useStreaming: boolean = true
// ): Promise<Message> {
//     let lastError: any;
//     for (let attempt = 0; attempt < maxRetries; attempt++) {
//         try {
//             const requestParams: any = {
//                 messages: messages,
//                 model: model,
//                 max_tokens: maxTokens
//             };
//             if (systemPrompt) {
//                 requestParams.system = systemPrompt;
//             }
//             // Use streaming for long requests to avoid timeout
//             if (useStreaming) {
//                 const stream = await anthropic.messages.stream(requestParams);
//                 let fullContent = '';
//                 let finalMessage: Message;
//                 for await (const chunk of stream) {
//                     if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text') {
//                         fullContent += chunk.delta.text;
//                     } else if (chunk.type === 'message_stop') {
//                         finalMessage = chunk.message;
//                         break;
//                     }
//                 }
//                 // Reconstruct the message object with the streamed content
//                 const response: Message = {
//                     id: finalMessage!.id,
//                     type: 'message',
//                     role: 'assistant',
//                     content: [{ type: 'text', text: fullContent }],
//                     model: finalMessage!.model,
//                     stop_reason: finalMessage!.stop_reason,
//                     stop_sequence: finalMessage!.stop_sequence,
//                     usage: finalMessage!.usage
//                 };
//                 return response;
//             } else {
//                 // Use regular non-streaming request
//                 const response = await anthropic.messages.create(requestParams);
//                 return response;
//             }
//         } catch (error) {
//             lastError = error;
//             // Check if it's a timeout error and suggest streaming
//             if (error instanceof Error && error.message.includes('Streaming is strongly recommended')) {
//                 console.log('Long request detected, switching to streaming...');
//                 if (!useStreaming) {
//                     return makeRequestWithRetry(messages, model, maxTokens, systemPrompt, maxRetries, true);
//                 }
//             }
//             if (error instanceof Anthropic.APIError) {
//                 // Retry on server errors (5xx), overloaded (529), and rate limits (429)
//                 if (error.status >= 500 || error.status === 529 || error.status === 429) {
//                     const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
//                     console.log(`Attempt ${attempt + 1} failed with ${error.status} (${error.message}). Retrying in ${Math.round(delay)}ms...`);
//                     if (attempt < maxRetries - 1) { // Don't delay on the last attempt
//                         await new Promise(resolve => setTimeout(resolve, delay));
//                         continue;
//                     }
//                 }
//             }
//             // Don't retry on client errors (4xx) or other errors, or if max retries reached
//             throw error;
//         }
//     }
//     throw lastError;
// }
// // Helper function to handle tool use
// async function handleToolUse(response: Message, messages: ChatMessage[]): Promise<Message> {
//     // Add the assistant's response with tool use to messages
//     messages.push({
//         role: 'assistant',
//         content: response.content
//     });
//     // For tool use, we need to continue the conversation
//     messages.push({
//         role: 'user',
//         content: 'Please continue with your task and provide the complete solution.'
//     });
//     // Continue the conversation with retry logic
//     return await makeRequestWithRetry(messages, 'claude-opus-4-20250514', 64000, getSystemPrompt());
// }
// // Helper function to handle pause_turn
// async function handlePauseTurn(response: Message, messages: ChatMessage[], maxRetries: number = 3): Promise<Message> {
//     let currentResponse = response;
//     let attempts = 0;
//     while (currentResponse.stop_reason === 'pause_turn' && attempts < maxRetries) {
//         // Add the paused response to messages
//         messages.push({
//             role: 'assistant',
//             content: currentResponse.content
//         });
//         // Continue the conversation with retry logic
//         currentResponse = await makeRequestWithRetry(messages, 'claude-opus-4-20250514', 64000, getSystemPrompt());
//         attempts++;
//     }
//     return currentResponse;
// }
// // Main function to get complete response
// async function getCompleteResponse(messages: ChatMessage[], maxAttempts: number = 5): Promise<CompleteResponse> {
//     let fullResponse = '';
//     let currentMessages = [...messages];
//     let attempts = 0;
//     try {
//         while (attempts < maxAttempts) {
//             console.log(`Processing attempt ${attempts + 1}/${maxAttempts}`);
//             const response = await makeRequestWithRetry(currentMessages, 'claude-opus-4-20250514', 64000, getSystemPrompt());
//             console.log(`Attempt ${attempts + 1}, Stop reason: ${response.stop_reason}`);
//             switch (response.stop_reason) {
//                 case 'end_turn':
//                     // Natural completion - add final response and return
//                     fullResponse += extractTextFromContent(response.content);
//                     console.log('Task completed successfully');
//                     return {
//                         content: fullResponse,
//                         isComplete: true
//                     };
//                 case 'max_tokens':
//                     // Response was truncated - continue generation
//                     const truncatedText = extractTextFromContent(response.content);
//                     fullResponse += truncatedText;
//                     console.log('Response truncated, continuing...');
//                     // Update messages to continue from where it left off
//                     currentMessages = [
//                         ...messages,
//                         {
//                             role: 'assistant',
//                             content: fullResponse
//                         },
//                         {
//                             role: 'user',
//                             content: 'Please continue from where you left off and complete the task fully. Make sure to include all necessary files and complete implementation.'
//                         }
//                     ];
//                     break;
//                 case 'tool_use':
//                     // Handle tool use and continue
//                     console.log('Handling tool use...');
//                     const toolResponse = await handleToolUse(response, [...currentMessages]);
//                     fullResponse += extractTextFromContent(toolResponse.content);
//                     if (toolResponse.stop_reason === 'end_turn') {
//                         return {
//                             content: fullResponse,
//                             isComplete: true
//                         };
//                     }
//                     // Update messages for next iteration
//                     currentMessages.push({
//                         role: 'assistant',
//                         content: toolResponse.content
//                     });
//                     break;
//                 case 'pause_turn':
//                     // Handle pause and continue
//                     console.log('Handling pause turn...');
//                     const pausedResponse = await handlePauseTurn(response, [...currentMessages]);
//                     fullResponse += extractTextFromContent(pausedResponse.content);
//                     if (pausedResponse.stop_reason === 'end_turn') {
//                         return {
//                             content: fullResponse,
//                             isComplete: true
//                         };
//                     }
//                     // Update messages for next iteration
//                     currentMessages.push({
//                         role: 'assistant',
//                         content: pausedResponse.content
//                     });
//                     break;
//                 case 'stop_sequence':
//                     // Custom stop sequence encountered
//                     fullResponse += extractTextFromContent(response.content);
//                     console.log(`Stopped at sequence: ${response.stop_sequence}`);
//                     // Check if this indicates completion or if we should continue
//                     if (response.stop_sequence === 'END' || response.stop_sequence === 'COMPLETE') {
//                         return {
//                             content: fullResponse,
//                             isComplete: true
//                         };
//                     }
//                     // Otherwise, continue
//                     currentMessages = [
//                         ...messages,
//                         {
//                             role: 'assistant',
//                             content: fullResponse
//                         },
//                         {
//                             role: 'user',
//                             content: 'Please continue and complete the full task.'
//                         }
//                     ];
//                     break;
//                 case 'refusal':
//                     // Claude refused to respond
//                     console.log('Request was refused due to safety concerns');
//                     return {
//                         content: fullResponse || 'Claude was unable to process this request due to safety concerns. Please try rephrasing your request.',
//                         isComplete: false,
//                         error: 'Request was refused due to safety concerns'
//                     };
//                 default:
//                     // Unknown stop reason
//                     fullResponse += extractTextFromContent(response.content);
//                     console.log(`Unknown stop reason: ${response.stop_reason}`);
//                     return {
//                         content: fullResponse,
//                         isComplete: true
//                     };
//             }
//             attempts++;
//         }
//         // If we've reached max attempts without completion
//         console.log('Maximum attempts reached without completion');
//         return {
//             content: fullResponse || 'Unable to complete the task within the maximum number of attempts.',
//             isComplete: false,
//             error: 'Maximum attempts reached without completion'
//         };
//     } catch (error) {
//         console.error('Error in getCompleteResponse:', error);
//         // Handle different types of errors
//         if (error instanceof Anthropic.APIError) {
//             let errorMessage = 'An API error occurred';
//             if (error.status === 529) {
//                 errorMessage = 'The AI service is currently overloaded. Please try again in a few moments.';
//             } else if (error.status === 429) {
//                 errorMessage = 'Rate limit exceeded. Please try again later.';
//             } else if (error.status === 500) {
//                 errorMessage = 'Server error. Please try again.';
//             } else if (error.status === 400) {
//                 errorMessage = 'Invalid request. Please check your input.';
//             }
//             return {
//                 content: fullResponse || errorMessage,
//                 isComplete: false,
//                 error: errorMessage
//             };
//         }
//         // Handle timeout/streaming errors
//         if (error instanceof Error) {
//             if (error.message.includes('Streaming is strongly recommended')) {
//                 return {
//                     content: fullResponse || 'Request timed out due to length. The system has been configured to use streaming for long requests.',
//                     isComplete: false,
//                     error: 'Request timeout - automatically switching to streaming mode'
//                 };
//             }
//             if (error.message.includes('timeout')) {
//                 return {
//                     content: fullResponse || 'Request timed out. Please try breaking down your request into smaller parts.',
//                     isComplete: false,
//                     error: 'Request timeout'
//                 };
//             }
//         }
//         return {
//             content: fullResponse || 'An unexpected error occurred.',
//             isComplete: false,
//             error: 'Unexpected error occurred'
//         };
//     }
// }
// app.post("/template", async (req, res): Promise<void> => {
//     try {
//         const prompt = req.body.prompt;
//         if (!prompt) {
//             res.status(400).json({
//                 message: "Prompt is required",
//                 error: "Missing prompt in request body"
//             });
//             return;
//         }
//         console.log('Determining project type...');
//         const response = await makeRequestWithRetry(
//             [{ role: 'user', content: prompt }],
//             'claude-sonnet-4-20250514',
//             100,
//             "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"
//         );
//         const answer = (response.content[0] as TextBlock).text.trim().toLowerCase();
//         console.log(`Project type determined: ${answer}`);
//         if (answer === "react") {
//             res.json({
//                 prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
//                 uiPrompts: [reactBasePrompt]
//             });
//             return;
//         }
//         if (answer === "node") {
//             res.json({
//                 prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
//                 uiPrompts: [nodeBasePrompt]
//             });
//             return;
//         }
//         res.status(400).json({
//             message: "Unable to determine project type",
//             error: "Invalid response from AI"
//         });
//     } catch (error) {
//         console.error('Error in /template:', error);
//         if (error instanceof Anthropic.APIError) {
//             let errorMessage = "API error occurred";
//             let statusCode = error.status || 500;
//             if (error.status === 529) {
//                 errorMessage = "The AI service is currently overloaded. Please try again in a few moments.";
//                 statusCode = 503; // Service Unavailable
//             } else if (error.status === 429) {
//                 errorMessage = "Rate limit exceeded. Please try again later.";
//                 statusCode = 429;
//             }
//             res.status(statusCode).json({
//                 message: errorMessage,
//                 error: error.message
//             });
//         } else {
//             res.status(500).json({
//                 message: "Internal server error",
//                 error: "An unexpected error occurred"
//             });
//         }
//     }
// });
// app.post("/chat", async (req, res): Promise<void> => {
//     try {
//         const messages: ChatMessage[] = req.body.messages;
//         if (!messages || !Array.isArray(messages) || messages.length === 0) {
//             res.status(400).json({
//                 message: "Invalid messages format",
//                 error: "Messages must be a non-empty array",
//                 response: "Please provide valid messages.",
//                 isComplete: false
//             });
//             return;
//         }
//         console.log('Starting chat with complete response handling...');
//         console.log(`Processing ${messages.length} messages`);
//         const result = await getCompleteResponse(messages);
//         console.log(`Task completion status: ${result.isComplete}`);
//         if (result.error) {
//             console.error('Error during processing:', result.error);
//         }
//         res.json({
//             response: result.content,
//             isComplete: result.isComplete,
//             error: result.error
//         });
//     } catch (error) {
//         console.error('Error in /chat:', error);
//         if (error instanceof Anthropic.APIError) {
//             let errorMessage = "API error occurred";
//             let statusCode = error.status || 500;
//             if (error.status === 529) {
//                 errorMessage = "The AI service is currently overloaded. Please try again in a few moments.";
//                 statusCode = 503; // Service Unavailable
//             } else if (error.status === 429) {
//                 errorMessage = "Rate limit exceeded. Please try again later.";
//                 statusCode = 429;
//             }
//             res.status(statusCode).json({
//                 message: errorMessage,
//                 error: error.message,
//                 response: "I encountered an error while processing your request. Please try again.",
//                 isComplete: false
//             });
//         } else {
//             res.status(500).json({
//                 message: "Internal server error",
//                 error: "An unexpected error occurred",
//                 response: "I encountered an unexpected error. Please try again later.",
//                 isComplete: false
//             });
//         }
//     }
// });
// // Health check endpoint
// app.get("/health", (req, res) => {
//     res.json({ status: "healthy", timestamp: new Date().toISOString() });
// });
// // Error handling middleware
// app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
//     console.error('Unhandled error:', error);
//     res.status(500).json({
//         message: "Internal server error",
//         error: "An unexpected error occurred"
//     });
// });
// app.listen(3000, () => {
//     console.log('Server running on port 3000 with enhanced error handling and retry logic');
// });
//index.ts
// require("dotenv").config();
// import express from "express"; 
// import Anthropic from "@anthropic-ai/sdk";
// import { BASE_PROMPT, getSystemPrompt } from "./prompts";
// import { ContentBlock, TextBlock, Message } from "@anthropic-ai/sdk/resources";
// import {basePrompt as nodeBasePrompt} from "./defaults/node";
// import {basePrompt as reactBasePrompt} from "./defaults/react";
// import cors from "cors";
// const anthropic = new Anthropic();
// const app = express();
// app.use(cors())
// app.use(express.json())
// interface ChatMessage {
//     role: 'user' | 'assistant';
//     content: string | ContentBlock[];
// }
// interface CompleteResponse {
//     content: string;
//     isComplete: boolean;
//     error?: string;
// }
// // Helper function to extract text from content blocks
// function extractTextFromContent(content: ContentBlock[]): string {
//     return content
//         .filter(block => block.type === 'text')
//         .map(block => (block as TextBlock).text)
//         .join('');
// }
// // Helper function to make API requests with retry logic and streaming support
// async function makeRequestWithRetry(
//     messages: ChatMessage[], 
//     model: string = 'claude-opus-4-20250514',
//     maxTokens: number = 32000,
//     systemPrompt?: string,
//     maxRetries: number = 3,
//     useStreaming: boolean = true
// ): Promise<Message> {
//     let lastError: any;
//     for (let attempt = 0; attempt < maxRetries; attempt++) {
//         try {
//             const requestParams: any = {
//                 messages: messages,
//                 model: model,
//                 max_tokens: maxTokens
//             };
//             if (systemPrompt) {
//                 requestParams.system = systemPrompt;
//             }
//             // Use streaming for long requests to avoid timeout
//             if (useStreaming) {
//                 const stream = await anthropic.messages.stream(requestParams);
//                 let fullContent = '';
//                 let finalMessage: Message | null = null;
//                 for await (const chunk of stream) {
//                     // Handle content block delta events
//                     if (chunk.type === 'content_block_delta') {
//                         if (chunk.delta.type === 'text_delta') {
//                             fullContent += chunk.delta.text;
//                         }
//                     } else if (chunk.type === 'message_stop') {
//                         // The message is available in the stream's finalMessage
//                         finalMessage = await stream.finalMessage();
//                         break;
//                     }
//                 }
//                 // If we didn't get a final message from message_stop, get it from the stream
//                 if (!finalMessage) {
//                     finalMessage = await stream.finalMessage();
//                 }
//                 // Reconstruct the message object with the streamed content
//                 const response: Message = {
//                     id: finalMessage.id,
//                     type: 'message',
//                     role: 'assistant',
//                     content: [{ 
//                         type: 'text', 
//                         text: fullContent,
//                         citations: [] // Required by the TextBlock interface
//                     }],
//                     model: finalMessage.model,
//                     stop_reason: finalMessage.stop_reason,
//                     stop_sequence: finalMessage.stop_sequence,
//                     usage: finalMessage.usage
//                 };
//                 return response;
//             } else {
//                 // Use regular non-streaming request
//                 const response = await anthropic.messages.create(requestParams);
//                 return response;
//             }
//         } catch (error) {
//             lastError = error;
//             // Check if it's a timeout error and suggest streaming
//             if (error instanceof Error && error.message.includes('Streaming is strongly recommended')) {
//                 console.log('Long request detected, switching to streaming...');
//                 if (!useStreaming) {
//                     return makeRequestWithRetry(messages, model, maxTokens, systemPrompt, maxRetries, true);
//                 }
//             }
//             if (error instanceof Anthropic.APIError) {
//                 // Retry on server errors (5xx), overloaded (529), and rate limits (429)
//                 if (error.status >= 500 || error.status === 529 || error.status === 429) {
//                     const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
//                     console.log(`Attempt ${attempt + 1} failed with ${error.status} (${error.message}). Retrying in ${Math.round(delay)}ms...`);
//                     if (attempt < maxRetries - 1) { // Don't delay on the last attempt
//                         await new Promise(resolve => setTimeout(resolve, delay));
//                         continue;
//                     }
//                 }
//             }
//             // Don't retry on client errors (4xx) or other errors, or if max retries reached
//             throw error;
//         }
//     }
//     throw lastError;
// }
// // Helper function to handle tool use
// async function handleToolUse(response: Message, messages: ChatMessage[]): Promise<Message> {
//     // Add the assistant's response with tool use to messages
//     messages.push({
//         role: 'assistant',
//         content: response.content
//     });
//     // For tool use, we need to continue the conversation
//     messages.push({
//         role: 'user',
//         content: 'Please continue with your task and provide the complete solution.'
//     });
//     // Continue the conversation with retry logic
//     return await makeRequestWithRetry(messages, 'claude-opus-4-20250514', 32000, getSystemPrompt());
// }
// // Helper function to handle pause_turn
// async function handlePauseTurn(response: Message, messages: ChatMessage[], maxRetries: number = 3): Promise<Message> {
//     let currentResponse = response;
//     let attempts = 0;
//     while (currentResponse.stop_reason === 'pause_turn' && attempts < maxRetries) {
//         // Add the paused response to messages
//         messages.push({
//             role: 'assistant',
//             content: currentResponse.content
//         });
//         // Continue the conversation with retry logic
//         currentResponse = await makeRequestWithRetry(messages, 'claude-opus-4-20250514', 32000, getSystemPrompt());
//         attempts++;
//     }
//     return currentResponse;
// }
// // Main function to get complete response
// async function getCompleteResponse(messages: ChatMessage[], maxAttempts: number = 5): Promise<CompleteResponse> {
//     let fullResponse = '';
//     let currentMessages = [...messages];
//     let attempts = 0;
//     try {
//         while (attempts < maxAttempts) {
//             console.log(`Processing attempt ${attempts + 1}/${maxAttempts}`);
//             const response = await makeRequestWithRetry(currentMessages, 'claude-opus-4-20250514', 32000, getSystemPrompt());
//             console.log(`Attempt ${attempts + 1}, Stop reason: ${response.stop_reason}`);
//             switch (response.stop_reason) {
//                 case 'end_turn':
//                     // Natural completion - add final response and return
//                     fullResponse += extractTextFromContent(response.content);
//                     console.log('Task completed successfully');
//                     return {
//                         content: fullResponse,
//                         isComplete: true
//                     };
//                 case 'max_tokens':
//                     // Response was truncated - continue generation
//                     const truncatedText = extractTextFromContent(response.content);
//                     fullResponse += truncatedText;
//                     console.log('Response truncated, continuing...');
//                     // Update messages to continue from where it left off
//                     currentMessages = [
//                         ...messages,
//                         {
//                             role: 'assistant',
//                             content: fullResponse
//                         },
//                         {
//                             role: 'user',
//                             content: 'Please continue from where you left off and complete the task fully. Make sure to include all necessary files and complete implementation.'
//                         }
//                     ];
//                     break;
//                 case 'tool_use':
//                     // Handle tool use and continue
//                     console.log('Handling tool use...');
//                     const toolResponse = await handleToolUse(response, [...currentMessages]);
//                     fullResponse += extractTextFromContent(toolResponse.content);
//                     if (toolResponse.stop_reason === 'end_turn') {
//                         return {
//                             content: fullResponse,
//                             isComplete: true
//                         };
//                     }
//                     // Update messages for next iteration
//                     currentMessages.push({
//                         role: 'assistant',
//                         content: toolResponse.content
//                     });
//                     break;
//                 case 'pause_turn':
//                     // Handle pause and continue
//                     console.log('Handling pause turn...');
//                     const pausedResponse = await handlePauseTurn(response, [...currentMessages]);
//                     fullResponse += extractTextFromContent(pausedResponse.content);
//                     if (pausedResponse.stop_reason === 'end_turn') {
//                         return {
//                             content: fullResponse,
//                             isComplete: true
//                         };
//                     }
//                     // Update messages for next iteration
//                     currentMessages.push({
//                         role: 'assistant',
//                         content: pausedResponse.content
//                     });
//                     break;
//                 case 'stop_sequence':
//                     // Custom stop sequence encountered
//                     fullResponse += extractTextFromContent(response.content);
//                     console.log(`Stopped at sequence: ${response.stop_sequence}`);
//                     // Check if this indicates completion or if we should continue
//                     if (response.stop_sequence === 'END' || response.stop_sequence === 'COMPLETE') {
//                         return {
//                             content: fullResponse,
//                             isComplete: true
//                         };
//                     }
//                     // Otherwise, continue
//                     currentMessages = [
//                         ...messages,
//                         {
//                             role: 'assistant',
//                             content: fullResponse
//                         },
//                         {
//                             role: 'user',
//                             content: 'Please continue and complete the full task.'
//                         }
//                     ];
//                     break;
//                 case 'refusal':
//                     // Claude refused to respond
//                     console.log('Request was refused due to safety concerns');
//                     return {
//                         content: fullResponse || 'Claude was unable to process this request due to safety concerns. Please try rephrasing your request.',
//                         isComplete: false,
//                         error: 'Request was refused due to safety concerns'
//                     };
//                 default:
//                     // Unknown stop reason
//                     fullResponse += extractTextFromContent(response.content);
//                     console.log(`Unknown stop reason: ${response.stop_reason}`);
//                     return {
//                         content: fullResponse,
//                         isComplete: true
//                     };
//             }
//             attempts++;
//         }
//         // If we've reached max attempts without completion
//         console.log('Maximum attempts reached without completion');
//         return {
//             content: fullResponse || 'Unable to complete the task within the maximum number of attempts.',
//             isComplete: false,
//             error: 'Maximum attempts reached without completion'
//         };
//     } catch (error) {
//         console.error('Error in getCompleteResponse:', error);
//         // Handle different types of errors
//         if (error instanceof Anthropic.APIError) {
//             let errorMessage = 'An API error occurred';
//             if (error.status === 529) {
//                 errorMessage = 'The AI service is currently overloaded. Please try again in a few moments.';
//             } else if (error.status === 429) {
//                 errorMessage = 'Rate limit exceeded. Please try again later.';
//             } else if (error.status === 500) {
//                 errorMessage = 'Server error. Please try again.';
//             } else if (error.status === 400) {
//                 errorMessage = 'Invalid request. Please check your input.';
//             }
//             return {
//                 content: fullResponse || errorMessage,
//                 isComplete: false,
//                 error: errorMessage
//             };
//         }
//         // Handle timeout/streaming errors
//         if (error instanceof Error) {
//             if (error.message.includes('Streaming is strongly recommended')) {
//                 return {
//                     content: fullResponse || 'Request timed out due to length. The system has been configured to use streaming for long requests.',
//                     isComplete: false,
//                     error: 'Request timeout - automatically switching to streaming mode'
//                 };
//             }
//             if (error.message.includes('timeout')) {
//                 return {
//                     content: fullResponse || 'Request timed out. Please try breaking down your request into smaller parts.',
//                     isComplete: false,
//                     error: 'Request timeout'
//                 };
//             }
//         }
//         return {
//             content: fullResponse || 'An unexpected error occurred.',
//             isComplete: false,
//             error: 'Unexpected error occurred'
//         };
//     }
// }
// app.post("/template", async (req, res): Promise<void> => {
//     try {
//         const prompt = req.body.prompt;
//         if (!prompt) {
//             res.status(400).json({
//                 message: "Prompt is required",
//                 error: "Missing prompt in request body"
//             });
//             return;
//         }
//         console.log('Determining project type...');
//         const response = await makeRequestWithRetry(
//             [{ role: 'user', content: prompt }],
//             'claude-sonnet-4-20250514',
//             100,
//             "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"
//         );
//         const answer = (response.content[0] as TextBlock).text.trim().toLowerCase();
//         console.log(`Project type determined: ${answer}`);
//         if (answer === "react") {
//             res.json({
//                 prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
//                 uiPrompts: [reactBasePrompt]
//             });
//             return;
//         }
//         if (answer === "node") {
//             res.json({
//                 prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
//                 uiPrompts: [nodeBasePrompt]
//             });
//             return;
//         }
//         res.status(400).json({
//             message: "Unable to determine project type",
//             error: "Invalid response from AI"
//         });
//     } catch (error) {
//         console.error('Error in /template:', error);
//         if (error instanceof Anthropic.APIError) {
//             let errorMessage = "API error occurred";
//             let statusCode = error.status || 500;
//             if (error.status === 529) {
//                 errorMessage = "The AI service is currently overloaded. Please try again in a few moments.";
//                 statusCode = 503; // Service Unavailable
//             } else if (error.status === 429) {
//                 errorMessage = "Rate limit exceeded. Please try again later.";
//                 statusCode = 429;
//             }
//             res.status(statusCode).json({
//                 message: errorMessage,
//                 error: error.message
//             });
//         } else {
//             res.status(500).json({
//                 message: "Internal server error",
//                 error: "An unexpected error occurred"
//             });
//         }
//     }
// });
// app.post("/chat", async (req, res): Promise<void> => {
//     try {
//         const messages: ChatMessage[] = req.body.messages;
//         if (!messages || !Array.isArray(messages) || messages.length === 0) {
//             res.status(400).json({
//                 message: "Invalid messages format",
//                 error: "Messages must be a non-empty array",
//                 response: "Please provide valid messages.",
//                 isComplete: false
//             });
//             return;
//         }
//         console.log('Starting chat with complete response handling...');
//         console.log(`Processing ${messages.length} messages`);
//         const result = await getCompleteResponse(messages);
//         console.log(`Task completion status: ${result.isComplete}`);
//         if (result.error) {
//             console.error('Error during processing:', result.error);
//         }
//         res.json({
//             response: result.content,
//             isComplete: result.isComplete,
//             error: result.error
//         });
//     } catch (error) {
//         console.error('Error in /chat:', error);
//         if (error instanceof Anthropic.APIError) {
//             let errorMessage = "API error occurred";
//             let statusCode = error.status || 500;
//             if (error.status === 529) {
//                 errorMessage = "The AI service is currently overloaded. Please try again in a few moments.";
//                 statusCode = 503; // Service Unavailable
//             } else if (error.status === 429) {
//                 errorMessage = "Rate limit exceeded. Please try again later.";
//                 statusCode = 429;
//             }
//             res.status(statusCode).json({
//                 message: errorMessage,
//                 error: error.message,
//                 response: "I encountered an error while processing your request. Please try again.",
//                 isComplete: false
//             });
//         } else {
//             res.status(500).json({
//                 message: "Internal server error",
//                 error: "An unexpected error occurred",
//                 response: "I encountered an unexpected error. Please try again later.",
//                 isComplete: false
//             });
//         }
//     }
// });
// // Health check endpoint
// app.get("/health", (req, res) => {
//     res.json({ status: "healthy", timestamp: new Date().toISOString() });
// });
// // Error handling middleware
// app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
//     console.error('Unhandled error:', error);
//     res.status(500).json({
//         message: "Internal server error",
//         error: "An unexpected error occurred"
//     });
// });
// app.listen(3000, () => {
//     console.log('Server running on port 3000 with enhanced error handling and retry logic');
// });
