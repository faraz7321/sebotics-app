type RuntimeConfig = {
  API_BASE_URL?: string;
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

export const API_BASE_URL =
  normalizeUrl(import.meta.env.VITE_PUBLIC_API_URL)??
  normalizeUrl(runtimeConfig.API_BASE_URL) ??
  "http://localhost:4000/api";
