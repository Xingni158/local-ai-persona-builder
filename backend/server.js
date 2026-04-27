const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { buildPrompt } = require("./promptBuilder");

const app = express();

const PORT = process.env.PORT || 3001;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL_NAME = process.env.MODEL_NAME || "qwen2.5:3b";

// CORS + public frontend → user-local backend support
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  // Helps public websites request local-network resources in newer browsers.
  res.header("Access-Control-Allow-Private-Network", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

async function callOllama(prompt) {
  let response;

  try {
    response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt,
        stream: false,
      }),
    });
  } catch (error) {
    throw new Error(
      `Cannot reach Ollama at ${OLLAMA_URL}. Make sure "ollama serve" is running.`
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Ollama API error: ${response.status}. ${errorText || "No details returned."}`
    );
  }

  const data = await response.json();

  if (!data.response) {
    throw new Error("Ollama returned no response text.");
  }

  return data.response;
}

app.get("/", (req, res) => {
  res.json({
    status: "Backend is running",
    mode: "user-local runtime",
    model: MODEL_NAME,
    ollamaUrl: OLLAMA_URL,
    endpoints: ["/api/generate", "/api/compare", "/api/debug"],
  });
});

app.get("/api/debug", async (req, res) => {
  let ollamaStatus = "unknown";

  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/tags`);
    ollamaStatus = ollamaRes.ok ? "connected" : "error";
  } catch {
    ollamaStatus = "not_running";
  }

  res.json({
    status: "OK",
    port: String(PORT),
    model: MODEL_NAME,
    ollamaUrl: OLLAMA_URL,
    ollamaStatus,
  });
});

app.post("/api/generate", async (req, res) => {
  try {
    const {
      role,
      relationship,
      personality,
      tone,
      length,
      goal,
      message,
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required.",
      });
    }

    const prompt = buildPrompt({
      role,
      relationship,
      personality,
      tone,
      length,
      goal,
      message,
    });

    const response = await callOllama(prompt);

    res.json({
      persona: {
        role,
        relationship,
        personality,
        tone,
        length,
        goal,
      },
      prompt,
      response,
      model: MODEL_NAME,
    });
  } catch (error) {
    console.error("Generate API error:", error.message);

    res.status(500).json({
      error: "Failed to generate response.",
      detail: error.message,
    });
  }
});

app.post("/api/compare", async (req, res) => {
  try {
    const { message, personas } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required.",
      });
    }

    if (!Array.isArray(personas) || personas.length === 0) {
      return res.status(400).json({
        error: "Personas must be a non-empty array.",
      });
    }

    const results = [];

    for (const persona of personas) {
      const prompt = buildPrompt({
        role: persona.role,
        relationship: persona.relationship,
        personality: persona.personality,
        tone: persona.tone,
        length: persona.length,
        goal: persona.goal,
        message,
      });

      const response = await callOllama(prompt);

      results.push({
        persona: {
          role: persona.role,
          relationship: persona.relationship,
          personality: persona.personality,
          tone: persona.tone,
          length: persona.length,
          goal: persona.goal,
        },
        label: `${persona.personality || "default"} ${
          persona.role || "assistant"
        }`,
        prompt,
        response,
        model: MODEL_NAME,
      });
    }

    res.json({
      message,
      results,
    });
  } catch (error) {
    console.error("Compare API error:", error.message);

    res.status(500).json({
      error: "Failed to compare personas.",
      detail: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Model: ${MODEL_NAME}`);
  console.log(`Ollama URL: ${OLLAMA_URL}`);
});