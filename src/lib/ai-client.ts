import type { AiProvider } from "@/lib/ai-types";

type GenerateJsonInput = {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
};

type GenerateJsonResult<T> = {
  provider: AiProvider;
  model: string;
  data: T;
};

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";

function resolveProvider(raw?: string): AiProvider {
  const normalized = raw?.trim().toLowerCase();
  if (normalized === "gemini") return "gemini";
  if (normalized === "openai") return "openai";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "openai";
}

function providerModel(provider: AiProvider): string {
  const configured = process.env.AI_MODEL?.trim();
  if (configured) return configured;
  return provider === "gemini" ? DEFAULT_GEMINI_MODEL : DEFAULT_OPENAI_MODEL;
}

function providerApiKey(provider: AiProvider): string {
  const key = provider === "gemini" ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY;
  if (!key) {
    const expected = provider === "gemini" ? "GEMINI_API_KEY" : "OPENAI_API_KEY";
    throw new Error(`Missing AI API key. Set ${expected}.`);
  }
  return key;
}

function tryParseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function extractJson<T>(raw: string): T {
  const parsedDirect = tryParseJson<T>(raw);
  if (parsedDirect) return parsedDirect;

  const withoutFences = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const parsedWithoutFences = tryParseJson<T>(withoutFences);
  if (parsedWithoutFences) return parsedWithoutFences;

  const firstBrace = withoutFences.indexOf("{");
  const lastBrace = withoutFences.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const sliced = withoutFences.slice(firstBrace, lastBrace + 1);
    const parsedSliced = tryParseJson<T>(sliced);
    if (parsedSliced) return parsedSliced;
  }

  throw new Error("AI response was not valid JSON");
}

async function callOpenAi(input: GenerateJsonInput, model: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: input.temperature ?? 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: input.userPrompt }
      ]
    })
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        error?: { message?: string };
        choices?: Array<{ message?: { content?: string } }>;
      }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "OpenAI request failed");
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("OpenAI returned an empty response");
  }

  return content;
}

async function callGemini(input: GenerateJsonInput, model: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${input.systemPrompt}\n\n${input.userPrompt}\n\nReturn valid JSON only.`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: input.temperature ?? 0.2,
          responseMimeType: "application/json"
        }
      })
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | {
        error?: { message?: string };
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Gemini request failed");
  }

  const content = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!content) {
    throw new Error("Gemini returned an empty response");
  }

  return content;
}

export async function generateJson<T>(input: GenerateJsonInput): Promise<GenerateJsonResult<T>> {
  const provider = resolveProvider(process.env.AI_PROVIDER);
  const model = providerModel(provider);
  const apiKey = providerApiKey(provider);

  const raw =
    provider === "gemini"
      ? await callGemini(input, model, apiKey)
      : await callOpenAi(input, model, apiKey);

  return {
    provider,
    model,
    data: extractJson<T>(raw)
  };
}
