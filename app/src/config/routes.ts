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
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
  },
  USER: {
    LIST: "/users",
    ME: "/users/me",
  },
  BUSINESS: {
    LIST: "/autoxing/businesses/list",
    ASSIGN: "/autoxing/businesses/assign",
    UNASSIGN: "/autoxing/businesses/unassign",
  },
} as const;
