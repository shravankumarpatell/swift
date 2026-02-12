// index.ts
require("dotenv").config();
import express from "express";
import { GoogleGenAI } from "@google/genai";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";
import { fullstackprompt as fullstackprompt } from "./defaults/fullstack";
import cors from "cors";

// ─── Configuration ───────────────────────────────────────────────────────────
const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 8192;
const TEMPERATURE = 0.7;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const app = express();
app.use(cors());
app.use(express.json());

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Converts frontend message format { role, content } into Gemini SDK
 * structured contents array with proper roles ("user" | "model").
 */
function buildContents(messages: { role: string; content: string }[]) {
  return messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));
}

/**
 * Clean response text – removes unwanted <think> tags if any model
 * injects them (safety net).
 */
function cleanResponse(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

/**
 * Sleep helper for exponential backoff.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls Gemini generateContent with automatic retry + exponential backoff
 * for transient errors (429, 503, 500).
 */
async function generateWithRetry(params: {
  model: string;
  contents: any;
  config?: any;
}): Promise<any> {
  let lastError: any;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const start = Date.now();
      const response = await ai.models.generateContent(params);
      const elapsed = Date.now() - start;
      console.log(
        `[Gemini] Model: ${params.model} | Took: ${elapsed}ms | Attempt: ${attempt + 1}`
      );

      // Debug: log response structure if text is missing
      if (!response.text) {
        console.warn(`[Gemini] response.text is empty. Full response:`, JSON.stringify(response, null, 2));
      }

      return response;
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.httpStatusCode || 0;
      const isRetryable =
        status === 429 || status === 503 || status === 500;

      if (isRetryable && attempt < MAX_RETRIES - 1) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `[Gemini] Retryable error (${status}). Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`
        );
        await sleep(delay);
        continue;
      }

      // Non-retryable or exhausted retries
      throw error;
    }
  }

  throw lastError;
}

/**
 * Safely extracts text from a Gemini generateContent response.
 * Falls back to candidates[0].content.parts[0].text if response.text is null.
 */
function extractText(response: any): string | null {
  // Try the direct accessor first
  if (response.text) {
    return response.text;
  }

  // Fallback: dig into candidates
  try {
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0]?.content?.parts;
      if (parts && parts.length > 0 && parts[0].text) {
        return parts[0].text;
      }
    }
  } catch (e) {
    // ignore extraction errors
  }

  return null;
}

/**
 * Maps Gemini SDK errors to appropriate HTTP status codes.
 */
function getHttpStatus(error: any): number {
  const status = error?.status || error?.httpStatusCode || 0;
  if (status === 429) return 429; // Rate limited
  if (status === 401 || status === 403) return 401; // Auth error
  if (status === 400) return 400; // Bad request
  return 500; // Internal server error
}

/**
 * Extracts a user-friendly error message from Gemini SDK errors.
 */
function getErrorMessage(error: any): string {
  const status = error?.status || error?.httpStatusCode || 0;
  if (status === 429) return "Rate limit exceeded. Please try again in a moment.";
  if (status === 401 || status === 403) return "API authentication error. Check your API key.";
  if (status === 400) return "Invalid request to the AI model.";
  return "An error occurred while generating the response. Please try again.";
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.post("/template", async (req, res) => {
  const prompt = req.body.prompt;

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ message: "Prompt is required" });
    return;
  }

  try {
    const response = await generateWithRetry({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          "Return either node or react based on what you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra.",
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
          BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [reactBasePrompt],
      });
      return;
    }

    if (answer === "node") {
      res.json({
        prompts: [
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n\nIn the beginning of the every response give a very very short description about what your going to do.\n\n`,
        ],
        uiPrompts: [nodeBasePrompt],
      });
      return;
    }

    res.status(403).json({ message: "You cant access this" });
    return;
  } catch (error: any) {
    console.error("[/template] Error:", error?.message || error);
    res
      .status(getHttpStatus(error))
      .json({ message: getErrorMessage(error) });
    return;
  }
});

app.post("/chat", async (req, res) => {
  const messages = req.body.messages;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ message: "Messages array is required" });
    return;
  }

  try {
    // Build structured contents for multi-turn conversation
    const contents = buildContents(messages);

    const response = await generateWithRetry({
      model: GEMINI_MODEL,
      contents: contents,
      config: {
        systemInstruction: getSystemPrompt(),
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
  } catch (error: any) {
    console.error("[/chat] Error:", error?.message || error);
    res
      .status(getHttpStatus(error))
      .json({ message: getErrorMessage(error) });
    return;
  }
});

// ─── Server Start ────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Swift Backend] Running on port ${PORT}`);
  console.log(`[Swift Backend] Model: ${GEMINI_MODEL}`);
});