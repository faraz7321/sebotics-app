type RuntimeConfig = {
  API_BASE_URL?: string;
  WS_BASE_URL?: string;
};

function normalizeUrl(value: string | undefined | null) {
  if (!value) return null;
  return value.trim().replace(/\/$/, "");
}

function readRuntimeConfig(): RuntimeConfig {
  if (typeof window === "undefined") {
    return {};
  }

  return window.__APP_CONFIG__ ?? {};
}

const runtimeConfig = readRuntimeConfig();

const apiBaseUrl =
  normalizeUrl(import.meta.env.VITE_PUBLIC_API_URL) ??
  normalizeUrl(runtimeConfig.API_BASE_URL);

if (!apiBaseUrl) {
  throw new Error("VITE_PUBLIC_API_URL (or runtime API_BASE_URL) is required");
}

export const API_BASE_URL = apiBaseUrl;

const wsBaseUrl =
  normalizeUrl(import.meta.env.VITE_PUBLIC_WS_URL) ??
  normalizeUrl(runtimeConfig.WS_BASE_URL) ??
  "/ws/autoxing";

export const WS_BASE_URL = wsBaseUrl;
