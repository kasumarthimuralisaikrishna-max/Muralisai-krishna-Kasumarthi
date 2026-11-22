import "dotenv/config";
import express, { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MODEL_NAME = "gemini-4-hydrogen";
const FAST_CHAT_MODEL = "gemini-3.1-flash-lite";

const ALLOWED_DOMAINS = [
  "Artificial Intelligence (AI)",
  "Internet of Things (IoT)",
  "Web Development",
  "Cybersecurity",
  "Machine Learning",
  "Data Science",
  "Cloud Computing",
  "Blockchain",
  "Other",
];

const ALLOWED_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const ALLOWED_STYLES = ["Simple Academic", "Professional Academic"];
const ALLOWED_FOCUS = ["Implementation", "Analysis", "Comparison", "Innovation"];

const MIN_ABSTRACT_WORDS = 150;
const MAX_ABSTRACT_WORDS = 200;

class MissingApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingApiKeyError";
  }
}

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new MissingApiKeyError(
      "Gemini API key is missing. Please configure GEMINI_API_KEY in Settings > Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function countWords(text: string): number {
  const matches = (text || "").trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

function deduplicateStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const cleaned = (item || "").trim();
    const key = cleaned.toLowerCase();
    if (cleaned && !seen.has(key)) {
      seen.add(key);
      result.push(cleaned);
    }
  }
  return result;
}

function extractErrorDetails(error: unknown): { status: number; message: string } {
  if (error instanceof MissingApiKeyError) {
    return { status: 500, message: error.message };
  }
  if (error instanceof Error) {
    const msg = error.message || "Unknown Gemini API error";
    const lower = msg.toLowerCase();

    if (lower.includes("api_key_invalid") || lower.includes("api key not valid")) {
      return {
        status: 400,
        message: "The configured Gemini API key is invalid. Please check your key in Settings > Secrets.",
      };
    }
    if (lower.includes("permission_denied") || lower.includes("403")) {
      return {
        status: 403,
        message: "Permission denied by the Gemini API. Please verify your API key in Settings > Secrets.",
      };
    }
    if (lower.includes("resource_exhausted") || lower.includes("429") || lower.includes("quota")) {
      return {
        status: 429,
        message: "Gemini API rate limit reached. Please wait a moment and try again.",
      };
    }
    if (lower.includes("not_found") || lower.includes("404")) {
      return {
        status: 404,
        message: "Requested Gemini model could not be found.",
      };
    }
    return { status: 502, message: `AI generation error: ${msg}` };
  }
  return { status: 500, message: "An unexpected server error occurred." };
}

const ACADEMIC_SYSTEM_INSTRUCTION = `You are an experienced academic researcher, technical writer, and university research advisor.
Your job is to transform a student's rough project idea into authentic, submission-ready academic research paper content.

STRICT INTEGRITY RULES:
1. NEVER invent fake experimental results, fabricated accuracy percentages (e.g., "achieved 96.4% accuracy"), fake dataset counts, or unverified benchmarks.
2. Frame expected outcomes honestly as anticipated goals, evaluation plans, or architectural capabilities.
3. If the project idea omits implementation details, make reasonable academic assumptions suited to the domain and present them as proposed methodology.
4. Use clear, formal, understandable academic English free of unnecessary buzzwords or repetition.`;

async function enforceAbstractWordCount(
  ai: GoogleGenAI,
  initialAbstract: string,
  contextBlock: string,
  writingStyle: string
): Promise<string> {
  let current = initialAbstract.trim();
  let words = countWords(current);
  if (words >= MIN_ABSTRACT_WORDS && words <= MAX_ABSTRACT_WORDS) {
    return current;
  }

  for (let round = 0; round < 2; round++) {
    const direction =
      words < MIN_ABSTRACT_WORDS
        ? `currently ${words} words, which is TOO SHORT`
        : `currently ${words} words, which is TOO LONG`;

    const prompt = `Revise the research abstract below so that its total length is STRICTLY between ${MIN_ABSTRACT_WORDS} and ${MAX_ABSTRACT_WORDS} words (aim for 170-185 words).
The current draft is ${direction}.
Preserve all 5 required components in a cohesive single paragraph: (1) background, (2) problem statement, (3) proposed methodology, (4) expected outcome, (5) project significance.
Writing Style: ${writingStyle}. Do not fabricate accuracy percentages or test metrics.

Context:
${contextBlock}

Draft Abstract:
${current}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: ACADEMIC_SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            abstract: { type: Type.STRING },
          },
          required: ["abstract"],
        },
      },
    });

    const parsed = JSON.parse((response.text || "{}").trim()) as { abstract?: string };
    const candidate = (parsed.abstract || "").trim();
    if (candidate) {
      current = candidate;
      words = countWords(current);
      if (words >= MIN_ABSTRACT_WORDS && words <= MAX_ABSTRACT_WORDS) {
        return current;
      }
    }
  }

  return current;
}

function validateInputBody(body: Record<string, unknown>): {
  error?: string;
  projectIdea: string;
  resolvedDomain: string;
  researchLevel: string;
  writingStyle: string;
  researchFocus: string;
} {
  const projectIdea = String(body.projectIdea || "").trim();
  const domain = String(body.domain || "").trim();
  const customDomain = String(body.customDomain || "").trim();
  const researchLevel = String(body.researchLevel || "Intermediate").trim();
  const writingStyle = String(body.writingStyle || "Professional Academic").trim();
  const researchFocus = String(body.researchFocus || "Implementation").trim();

  if (!projectIdea) {
    return {
      error: "Please enter your project idea before generating research content.",
      projectIdea,
      resolvedDomain: "",
      researchLevel,
      writingStyle,
      researchFocus,
    };
  }
  if (projectIdea.length < 15 || countWords(projectIdea) < 4) {
    return {
      error: "Please describe your project idea in at least 4 words (2–3 clear lines work best).",
      projectIdea,
      resolvedDomain: "",
      researchLevel,
      writingStyle,
      researchFocus,
    };
  }
  if (!ALLOWED_DOMAINS.includes(domain)) {
    return {
      error: "Please select a valid domain from the dropdown.",
      projectIdea,
      resolvedDomain: "",
      researchLevel,
      writingStyle,
      researchFocus,
    };
  }

  const resolvedDomain = domain === "Other" ? customDomain : domain;
  if (!resolvedDomain || resolvedDomain.length < 2) {
    return {
      error: "Please enter a custom domain name when 'Other' is selected.",
      projectIdea,
      resolvedDomain: "",
      researchLevel,
      writingStyle,
      researchFocus,
    };
  }

  if (!ALLOWED_LEVELS.includes(researchLevel)) {
    return {
      error: "Invalid research level selected.",
      projectIdea,
      resolvedDomain,
      researchLevel,
      writingStyle,
      researchFocus,
    };
  }
  if (!ALLOWED_STYLES.includes(writingStyle)) {
    return {
      error: "Invalid writing style selected.",
      projectIdea,
      resolvedDomain,
      researchLevel,
      writingStyle,
      researchFocus,
    };
  }
  if (!ALLOWED_FOCUS.includes(researchFocus)) {
    return {
      error: "Invalid research focus selected.",
      projectIdea,
      resolvedDomain,
      researchLevel,
      writingStyle,
      researchFocus,
    };
  }

  return {
    projectIdea,
    resolvedDomain,
    researchLevel,
    writingStyle,
    researchFocus,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // 1. Single-call structured research package generation + word count validation
  app.post("/api/research/generate", async (req: Request, res: Response) => {
    try {
      const ai = createGeminiClient();
      const validatedInput = validateInputBody((req.body || {}) as Record<string, unknown>);
      if (validatedInput.error) {
        res.status(400).json({ error: validatedInput.error });
        return;
      }

      const {
        projectIdea,
        resolvedDomain,
        researchLevel,
        writingStyle,
        researchFocus,
      } = validatedInput;

      const contextBlock = `Project Idea: ${projectIdea}
Domain: ${resolvedDomain}
Research Level: ${researchLevel}
Writing Style: ${writingStyle}
Research Focus: ${researchFocus}`;

      const prompt = `Generate complete academic research content for the following student project:

${contextBlock}

REQUIREMENTS:
1. "titles": Exactly 3 distinct research paper title options suitable for academic reports and papers. Each title must take a different approach (e.g., System/Architecture focus, Analytical/Empirical focus, Application/Impact focus) and include a short "approach" label.
2. "abstract": A cohesive single-paragraph academic abstract STRICTLY between 150 and 200 words (target 170–185 words). It MUST include:
   - Background of the problem
   - Problem statement
   - Proposed methodology or approach
   - Expected outcome (without fabricating metrics)
   - Significance of the project
3. "keywords": Exactly 5 unique, domain-relevant academic keywords.
4. "objectives": Exactly 3 clear, measurable research objectives, each starting with "To <action verb>...".
5. "futureEnhancements": Exactly 3 realistic technical future enhancements focusing on scalability, performance, accuracy, or new capabilities, each with a concise "title" and "description".`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: ACADEMIC_SYSTEM_INSTRUCTION,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              titles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    approach: { type: Type.STRING },
                  },
                  required: ["title", "approach"],
                },
              },
              abstract: { type: Type.STRING },
              keywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              objectives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              futureEnhancements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ["title", "description"],
                },
              },
            },
            required: [
              "titles",
              "abstract",
              "keywords",
              "objectives",
              "futureEnhancements",
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text || "{}").trim()) as {
        titles?: Array<{ title?: string; approach?: string }>;
        abstract?: string;
        keywords?: string[];
        objectives?: string[];
        futureEnhancements?: Array<{ title?: string; description?: string }>;
      };

      const rawTitles = Array.isArray(parsed.titles) ? parsed.titles : [];
      const titles = rawTitles
        .slice(0, 3)
        .map((item) => ({
          title: (item?.title || "").trim(),
          approach: (item?.approach || "Academic Perspective").trim(),
        }))
        .filter((t) => t.title.length > 0);

      const keywords = deduplicateStrings(
        Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : []
      ).slice(0, 5);

      const objectives = (Array.isArray(parsed.objectives) ? parsed.objectives : [])
        .map((o) => String(o || "").trim())
        .filter(Boolean)
        .slice(0, 3);

      const futureEnhancements = (
        Array.isArray(parsed.futureEnhancements) ? parsed.futureEnhancements : []
      )
        .slice(0, 3)
        .map((e) => ({
          title: (e?.title || "Technical Enhancement").trim(),
          description: (e?.description || "").trim(),
        }))
        .filter((e) => e.description.length > 0);

      const rawAbstract = (parsed.abstract || "").trim();

      if (
        titles.length < 3 ||
        !rawAbstract ||
        keywords.length < 5 ||
        objectives.length < 3 ||
        futureEnhancements.length < 3
      ) {
        res.status(502).json({
          error: "Incomplete structured research content returned by AI. Please retry.",
        });
        return;
      }

      const finalAbstract = await enforceAbstractWordCount(
        ai,
        rawAbstract,
        contextBlock,
        writingStyle
      );

      res.json({
        resolvedDomain,
        research: {
          titles,
          abstract: finalAbstract,
          abstractWordCount: countWords(finalAbstract),
          keywords,
          objectives,
          futureEnhancements,
        },
      });
    } catch (error) {
      const { status, message } = extractErrorDetails(error);
      res.status(status).json({ error: message });
    }
  });

  // 2. Regenerate only the Abstract (150-200 words)
  app.post("/api/research/regenerate-abstract", async (req: Request, res: Response) => {
    try {
      const ai = createGeminiClient();
      const validatedInput = validateInputBody((req.body || {}) as Record<string, unknown>);
      if (validatedInput.error) {
        res.status(400).json({ error: validatedInput.error });
        return;
      }

      const {
        projectIdea,
        resolvedDomain,
        researchLevel,
        writingStyle,
        researchFocus,
      } = validatedInput;
      const selectedTitle = String(req.body?.selectedTitle || "").trim();

      const contextBlock = `Project Idea: ${projectIdea}
Domain: ${resolvedDomain}
Research Level: ${researchLevel}
Writing Style: ${writingStyle}
Research Focus: ${researchFocus}${selectedTitle ? `\nSelected Title: ${selectedTitle}` : ""}`;

      const prompt = `Write a fresh, distinct academic research abstract STRICTLY between 150 and 200 words (target 175 words) for:
${contextBlock}

Include all 5 components smoothly in one paragraph: background, problem statement, proposed methodology, expected outcome, and significance. Do not fabricate metrics.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: ACADEMIC_SYSTEM_INSTRUCTION,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              abstract: { type: Type.STRING },
            },
            required: ["abstract"],
          },
        },
      });

      const parsed = JSON.parse((response.text || "{}").trim()) as { abstract?: string };
      const rawAbstract = (parsed.abstract || "").trim();
      if (!rawAbstract) {
        res.status(502).json({ error: "Gemini returned an empty abstract. Please try again." });
        return;
      }

      const finalAbstract = await enforceAbstractWordCount(
        ai,
        rawAbstract,
        contextBlock,
        writingStyle
      );

      res.json({
        abstract: finalAbstract,
        abstractWordCount: countWords(finalAbstract),
      });
    } catch (error) {
      const { status, message } = extractErrorDetails(error);
      res.status(status).json({ error: message });
    }
  });

  // 3. Fast Multi-turn AI Research Advisor Chatbot (SSE streaming + JSON fallback)
  app.post("/api/research/chat", async (req: Request, res: Response) => {
    const wantStream = Boolean(req.body?.stream);
    try {
      const ai = createGeminiClient();
      const advisorRole = String(req.body?.advisorRole || "methodology").trim();
      const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
      const ctx = req.body?.researchContext || {};

      if (rawMessages.length === 0) {
        res.status(400).json({ error: "Please enter a message to start chatting." });
        return;
      }

      const sanitizedMessages = rawMessages
        .filter(
          (m: unknown): m is { role: "user" | "model"; text: string } =>
            Boolean(m) &&
            typeof m === "object" &&
            ((m as { role?: string }).role === "user" ||
              (m as { role?: string }).role === "model") &&
            typeof (m as { text?: unknown }).text === "string" &&
            (m as { text: string }).text.trim().length > 0
        )
        .map((m: { role: "user" | "model"; text: string }) => ({
          role: m.role,
          text: m.text.trim(),
        }));

      if (sanitizedMessages.length === 0) {
        res.status(400).json({ error: "Message text cannot be empty." });
        return;
      }

      const latestMessage = sanitizedMessages[sanitizedMessages.length - 1];
      if (latestMessage.role !== "user") {
        res.status(400).json({ error: "The latest message must be from the user." });
        return;
      }

      // Build clean alternating history prior to latest user message
      const alternatingHistory: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
      for (const msg of sanitizedMessages.slice(0, -1)) {
        const last = alternatingHistory[alternatingHistory.length - 1];
        if (!last) {
          if (msg.role === "user") {
            alternatingHistory.push({ role: "user", parts: [{ text: msg.text }] });
          }
        } else if (last.role === msg.role) {
          last.parts[0].text += `\n${msg.text}`;
        } else {
          alternatingHistory.push({ role: msg.role, parts: [{ text: msg.text }] });
        }
      }
      // Ensure history ends on a model turn (or is empty) before sending latest user turn
      if (
        alternatingHistory.length > 0 &&
        alternatingHistory[alternatingHistory.length - 1].role === "user"
      ) {
        alternatingHistory.pop();
      }

      const roleInstructions: Record<string, string> = {
        methodology:
          "You are a Senior Academic Research Methodology Advisor. Help college students design sound methodologies, choose appropriate public datasets or evaluation metrics, compare baseline approaches, and scope their project realistically.",
        reviewer:
          "You are an experienced Academic Peer Reviewer. Provide constructive, honest critique of the student's research title, abstract, objectives, and problem framing. Point out ambiguities, missing justifications, or overly broad claims while suggesting concrete fixes.",
        writer:
          "You are an Academic Writing Coach. Help students draft clear, formal research sections such as introduction paragraphs, problem statements, literature survey outlines, and methodology descriptions without fabricating fake experimental results.",
      };

      const baseRoleInstruction =
        roleInstructions[advisorRole] || roleInstructions.methodology;

      const contextLines: string[] = [];
      if (ctx.domain) contextLines.push(`Domain: ${String(ctx.domain)}`);
      if (ctx.projectIdea) contextLines.push(`Project Idea: ${String(ctx.projectIdea)}`);
      if (ctx.selectedTitle) contextLines.push(`Selected Title: ${String(ctx.selectedTitle)}`);
      if (ctx.abstract) contextLines.push(`Current Abstract: ${String(ctx.abstract)}`);

      const systemInstruction = `${baseRoleInstruction}

RESPONSE STYLE RULES:
- Give fast, crisp, practical answers (around 90-160 words unless asked for a detailed breakdown).
- Use clean plain text and simple bullet points (- ). Avoid LaTeX math ($...$), horizontal rules (---), or unnecessary filler.
- Never fabricate fake experimental results, accuracy percentages, or fake citations.
${
  contextLines.length > 0
    ? `\nACTIVE STUDENT RESEARCH CONTEXT:\n${contextLines.join("\n")}`
    : ""
}`;

      const chat = ai.chats.create({
        model: FAST_CHAT_MODEL,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        },
        history: alternatingHistory,
      });

      if (wantStream) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders?.();

        let fullText = "";
        const stream = await chat.sendMessageStream({
          message: latestMessage.text,
        });

        for await (const chunk of stream) {
          const textChunk = chunk.text || "";
          if (textChunk) {
            fullText += textChunk;
            res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
          }
        }

        if (!fullText.trim()) {
          res.write(
            `data: ${JSON.stringify({ error: "Gemini returned an empty response. Please try again." })}\n\n`
          );
        } else {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        }
        res.end();
        return;
      }

      const response = await chat.sendMessage({
        message: latestMessage.text,
      });

      const reply = (response.text || "").trim();
      if (!reply) {
        res.status(502).json({
          error: "Gemini returned an empty response. Please try again.",
        });
        return;
      }

      res.json({ reply });
    } catch (error) {
      const { status, message } = extractErrorDetails(error);
      if (wantStream && res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
        res.end();
        return;
      }
      res.status(status).json({ error: message });
    }
  });

  // 4. Serve Python/Streamlit project files from research_generator/
  app.get("/api/research/python-project", async (_req: Request, res: Response) => {
    try {
      const baseDir = path.resolve(__dirname, "research_generator");
      const fileList = [
        "app.py",
        "utils/content_generator.py",
        "utils/gemini_service.py",
        "utils/validators.py",
        "utils/exporters.py",
        "requirements.txt",
        ".env.example",
        ".streamlit/config.toml",
        "README.md",
      ];

      const files = await Promise.all(
        fileList.map(async (relPath) => ({
          name: `research_generator/${relPath}`,
          content: await fs.readFile(path.join(baseDir, relPath), "utf-8"),
        }))
      );

      res.json({ files });
    } catch {
      res.status(500).json({ error: "Failed to load Python Streamlit project files." });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
