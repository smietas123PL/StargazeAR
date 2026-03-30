import { describe, expect, it } from "vitest";
import {
  sessionCodec as geminiSessionCodec,
  isGeminiUnknownSessionError,
} from "@paperclipai/adapter-gemini-local/server";

describe("adapter session codecs", () => {
  it("normalizes gemini session params with cwd", () => {
    const parsed = geminiSessionCodec.deserialize({
      session_id: "gemini-session-1",
      cwd: "/tmp/gemini",
    });
    expect(parsed).toEqual({
      sessionId: "gemini-session-1",
      cwd: "/tmp/gemini",
    });

    const serialized = geminiSessionCodec.serialize(parsed);
    expect(serialized).toEqual({
      sessionId: "gemini-session-1",
      cwd: "/tmp/gemini",
    });
    expect(geminiSessionCodec.getDisplayId?.(serialized ?? null)).toBe("gemini-session-1");
  });
});

describe("gemini resume recovery detection", () => {
  it("detects unknown session errors from gemini output", () => {
    expect(
      isGeminiUnknownSessionError(
        "",
        "unknown session id abc",
      ),
    ).toBe(true);
    expect(
      isGeminiUnknownSessionError(
        "",
        "checkpoint latest not found",
      ),
    ).toBe(true);
    expect(
      isGeminiUnknownSessionError(
        '{"type":"result","subtype":"success"}',
        "",
      ),
    ).toBe(false);
  });
});
