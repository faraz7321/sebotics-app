import { API_BASE_URL } from "@/lib/runtime-config";

/* FRONTEND ROUTES */

export const ROUTES = {
  AUTH: {
    SIGN_IN: "/login",
    SIGN_UP: "/register",
  },
  DASHBOARD: {
    HOME: "/home",
  }
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
  },
} as const;
