import * as p from "@clack/prompts";
import type { LlmConfig } from "../config/schema.js";

export async function promptLlm(): Promise<LlmConfig | undefined> {
  const configureLlm = await p.confirm({
    message: "Configure Gemini now?",
    initialValue: false,
  });

  if (p.isCancel(configureLlm)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  if (!configureLlm) return undefined;

  const apiKey = await p.password({
    message: "Gemini API key (optional; leave blank to use `gemini auth` or existing env)",
  });

  if (p.isCancel(apiKey)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  const trimmedApiKey = apiKey.trim();
  return {
    provider: "gemini",
    ...(trimmedApiKey ? { apiKey: trimmedApiKey } : {}),
  };
}
