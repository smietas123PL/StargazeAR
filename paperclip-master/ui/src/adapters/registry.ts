import type { UIAdapterModule } from "./types";
import { geminiLocalUIAdapter } from "./gemini-local";
import { hermesLocalUIAdapter } from "./hermes-local";
import { processUIAdapter } from "./process";
import { httpUIAdapter } from "./http";

const uiAdapters: UIAdapterModule[] = [
  geminiLocalUIAdapter,
  hermesLocalUIAdapter,
  processUIAdapter,
  httpUIAdapter,
];

const adaptersByType = new Map<string, UIAdapterModule>(
  uiAdapters.map((a) => [a.type, a]),
);

export function getUIAdapter(type: string): UIAdapterModule {
  return adaptersByType.get(type) ?? processUIAdapter;
}

export function listUIAdapters(): UIAdapterModule[] {
  return [...uiAdapters];
}