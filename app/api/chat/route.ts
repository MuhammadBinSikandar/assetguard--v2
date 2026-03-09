import { NextResponse } from "next/server";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import path from "node:path";
import fs from "node:fs";

// ─── Configuration ───────────────────────────────────────────────
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL ?? "tinyllama";
const EMBED_MODEL = "nomic-embed-text";
const KB_PATH = path.join(
  process.cwd(),
  "documents",
  "assetguard_knowledge_base.md"
);
const TOP_K = 3;
const MAX_CONTEXT_CHARS = 1200; // cap context to prevent model OOM
const MAX_RETRIES = 2; // retry on transient model crashes

// ─── Global vector-store cache (survives across requests) ────────
let vectorStorePromise: Promise<MemoryVectorStore> | null = null;

/**
 * Initialise (or return cached) MemoryVectorStore from the knowledge base.
 * The Promise itself is cached so concurrent requests during init
 * don't trigger duplicate loads.
 */
function getVectorStore(): Promise<MemoryVectorStore> {
  if (!vectorStorePromise) {
    vectorStorePromise = buildVectorStore();
  }
  return vectorStorePromise;
}

async function buildVectorStore(): Promise<MemoryVectorStore> {
  console.log("[RAG] Loading knowledge base from", KB_PATH);

  // 1. Read the markdown file
  const raw = fs.readFileSync(KB_PATH, "utf-8");
  console.log("[RAG] Loaded knowledge base (%d chars)", raw.length);

  // 2. Split into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  const chunks = await splitter.splitDocuments([
    new Document({ pageContent: raw, metadata: { source: "knowledge_base" } }),
  ]);
  console.log("[RAG] Split into %d chunks", chunks.length);

  // 3. Embed and store in memory
  const embeddings = new OllamaEmbeddings({
    model: EMBED_MODEL,
    baseUrl: OLLAMA_BASE_URL,
  });

  const store = await MemoryVectorStore.fromDocuments(chunks, embeddings);
  console.log("[RAG] Vector store ready (%d vectors)", chunks.length);

  return store;
}

// ─── System prompt (kept short — small models choke on long system prompts) ──
const SYSTEM_PROMPT = `You are AssetGuard's support assistant. Answer using ONLY the provided context. Be concise and professional. If the context doesn't cover the question, say you don't have that information.`;

// ─── POST handler ────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = (body?.messages ?? []) as {
      role: string;
      content: string;
    }[];

    // Extract the latest user message
    const userMessage =
      messages.length > 0
        ? messages[messages.length - 1].content?.trim()
        : "";

    if (!userMessage) {
      return NextResponse.json(
        { error: "No message provided" },
        { status: 400 }
      );
    }

    console.log("[/api/chat] Question:", userMessage);

    // 1. Retrieve relevant chunks
    let contextText: string;
    try {
      const store = await getVectorStore();
      const results = await store.similaritySearch(userMessage, TOP_K);
      contextText = results.map((r) => r.pageContent).join("\n\n");
      // Truncate context to prevent blowing up the model's context window
      if (contextText.length > MAX_CONTEXT_CHARS) {
        contextText = contextText.slice(0, MAX_CONTEXT_CHARS);
      }
      console.log(
        "[RAG] Retrieved %d chunks for context (%d chars)",
        results.length,
        contextText.length
      );
    } catch (err) {
      console.error("[RAG] Vector store error:", err);
      // If this is the first load and it failed, clear the cache so
      // the next request retries.
      vectorStorePromise = null;
      throw err;
    }

    // 2. Call Ollama REST API directly (bypasses LangChain ChatOllama which crashes the runner)
    const fullPrompt = `${SYSTEM_PROMPT}\n\nContext:\n${contextText}\n\nQuestion: ${userMessage}\nAnswer:`;

    let answer = "";
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: CHAT_MODEL,
            prompt: fullPrompt,
            stream: false,
            options: {
              temperature: 0,
              num_predict: 256, // limit output tokens
              num_ctx: 1024,    // small KV cache — prevents OOM on llama3.2 (default is 131072!)
            },
          }),
        });

        if (!ollamaRes.ok) {
          const errBody = await ollamaRes.text();
          throw new Error(`Ollama API ${ollamaRes.status}: ${errBody}`);
        }

        const ollamaJson = (await ollamaRes.json()) as {
          response?: string;
          error?: string;
        };

        if (ollamaJson.error) {
          throw new Error(ollamaJson.error);
        }

        answer = ollamaJson.response?.trim() ?? "";
        console.log("[RAG] Response generated successfully (%d chars)", answer.length);
        break; // success
      } catch (invokeErr: unknown) {
        const errMsg =
          invokeErr instanceof Error ? invokeErr.message : String(invokeErr);
        const isRunnerCrash =
          errMsg.includes("runner process has terminated") ||
          errMsg.includes("exit status");
        if (isRunnerCrash && attempt < MAX_RETRIES) {
          console.warn(
            "[RAG] Model runner crashed (attempt %d/%d), retrying in 3s…",
            attempt,
            MAX_RETRIES
          );
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        throw invokeErr;
      }
    }

    return NextResponse.json({ text: answer || "I couldn't generate a response. Please try again." });
  } catch (error: unknown) {
    console.error("[/api/chat] Error:", error);

    // Detect Ollama connectivity issues
    const msg =
      error instanceof Error ? error.message : String(error);
    const isOllamaOffline =
      msg.includes("ECONNREFUSED") ||
      msg.includes("fetch failed") ||
      msg.includes("ENOTFOUND");

    if (isOllamaOffline) {
      return NextResponse.json(
        {
          text: "The AI service is currently unavailable. Please ensure the Ollama server is running and try again.",
          error: "Ollama server is offline or unreachable",
        },
        { status: 503 }
      );
    }

    const isRunnerCrash =
      msg.includes("runner process has terminated") ||
      msg.includes("exit status");
    if (isRunnerCrash) {
      return NextResponse.json(
        {
          text: "The AI model encountered a memory error. Please try a shorter question, or switch to a smaller model.",
          error: msg,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        text: "Sorry, I had trouble processing your question. Please try again.",
        error: msg,
      },
      { status: 500 }
    );
  }
}
