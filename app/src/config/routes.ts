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

export const API_BASE_URL = import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:8080/api";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
  },
} as const;