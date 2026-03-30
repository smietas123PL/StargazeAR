import { testEnvironment as testGeminiEnvironment } from "@paperclipai/adapter-gemini-local/server";
import type { PaperclipConfig } from "../config/schema.js";
import type { CheckResult } from "./index.js";

const GEMINI_CHECK_NAME = "Gemini";

function formatCheckMessage(message: string, detail?: string | null): string {
  const trimmedDetail = detail?.trim();
  return trimmedDetail ? `${message} ${trimmedDetail}` : message;
}

async function geminiCheck(apiKey: string | undefined): Promise<CheckResult> {
  try {
    const trimmedApiKey = apiKey?.trim();
    const result = await testGeminiEnvironment({
      companyId: "paperclip-cli",
      adapterType: "gemini_local",
      config: {
        command: "gemini",
        ...(trimmedApiKey
          ? {
            env: {
              GEMINI_API_KEY: trimmedApiKey,
            },
          }
          : {}),
      },
    });

    const primaryCheck =
      result.checks.find((check) => check.level === "error") ??
      result.checks.find((check) => check.level === "warn") ??
      result.checks.find((check) => check.code === "gemini_hello_probe_passed") ??
      result.checks.find((check) => check.code === "gemini_command_resolvable") ??
      result.checks[result.checks.length - 1];

    return {
      name: GEMINI_CHECK_NAME,
      status: result.status,
      message: primaryCheck
        ? formatCheckMessage(primaryCheck.message, primaryCheck.detail)
        : "Gemini setup check completed.",
      ...(result.status === "pass"
        ? {}
        : {
          repairHint:
            primaryCheck?.hint ??
            "Install Gemini CLI and run `gemini auth`, or set GEMINI_API_KEY / GOOGLE_API_KEY, then retry `paperclipai configure --section llm`.",
        }),
    };
  } catch {
    return {
      name: GEMINI_CHECK_NAME,
      status: "warn",
      message: "Could not verify Gemini CLI setup.",
      repairHint:
        "Install Gemini CLI and run `gemini auth`, or set GEMINI_API_KEY / GOOGLE_API_KEY, then retry `paperclipai configure --section llm`.",
    };
  }
}

export async function llmConfigCheck(llm: PaperclipConfig["llm"] | undefined): Promise<CheckResult> {
  if (!llm) {
    return {
      name: GEMINI_CHECK_NAME,
      status: "pass",
      message: "Gemini is not configured (optional).",
    };
  }

  if (llm.provider === "gemini") {
    return geminiCheck(llm.apiKey);
  }

  if (!llm.apiKey) {
    return {
      name: "LLM provider",
      status: "pass",
      message: `${llm.provider} configured but no API key set (optional)`,
    };
  }

  try {
    if (llm.provider === "claude") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": llm.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      if (res.ok || res.status === 400) {
        return { name: "LLM provider", status: "pass", message: "Claude API key is valid" };
      }
      if (res.status === 401) {
        return {
          name: "LLM provider",
          status: "fail",
          message: "Claude API key is invalid (401)",
          canRepair: false,
          repairHint: "Run `paperclipai configure --section llm`",
        };
      }
      return {
        name: "LLM provider",
        status: "warn",
        message: `Claude API returned status ${res.status}`,
      };
    }

    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${llm.apiKey}` },
    });
    if (res.ok) {
      return { name: "LLM provider", status: "pass", message: "OpenAI API key is valid" };
    }
    if (res.status === 401) {
      return {
        name: "LLM provider",
        status: "fail",
        message: "OpenAI API key is invalid (401)",
        canRepair: false,
        repairHint: "Run `paperclipai configure --section llm`",
      };
    }
    return {
      name: "LLM provider",
      status: "warn",
      message: `OpenAI API returned status ${res.status}`,
    };
  } catch {
    return {
      name: "LLM provider",
      status: "warn",
      message: "Could not reach API to validate key",
    };
  }
}

export async function llmCheck(config: PaperclipConfig): Promise<CheckResult> {
  return llmConfigCheck(config.llm);
}
