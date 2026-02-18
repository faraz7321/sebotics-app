/* FRONTEND ROUTES */

export const ROUTES = {
  AUTH: {
    SIGN_IN: "/login",
    SIGN_UP: "/register",
  },
  DASHBOARD: {
    HOME: "/home",
  },
  BUSINESSES: {
    PAGE: "/businesses",
  }
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
  },
  USER: {
    LIST: "/users",
    ME: "/users/me",
  },
  ROBOT: {
    LIST: "/autoxing/robots/list",
  },
  BUSINESS: {
    LIST: "/autoxing/businesses/list",
    ASSIGN: "/autoxing/businesses/assign",
    UNASSIGN: "/autoxing/businesses/unassign",
  },
} as const;
