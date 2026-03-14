/* FRONTEND ROUTES */

export const ROUTES = {
  AUTH: {
    SIGN_IN: "/login",
    SIGN_UP: "/register",
    FORGOT_PASSWORD: "/forgot-password",
  },
  USER: {
    PROFILE: "/user/profile",
    CHANGE_PASSWORD: "/user/change-password",
  },
  DASHBOARD: {
    HOME: "/home",
  },
  BUSINESSES: {
    PAGE: "/businesses",
  },
  MAPS: {
    PAGE: "/maps",
  },
} as const;

export const API_ENDPOINTS = {
  CONFIG: {
    MAPBOX_TOKEN: "/config/mapbox-token",
  },
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    CHANGE_PASSWORD: "/auth/change-password",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },
  USER: {
    LIST: "/users",
    ME: "/users/me",
  },
  ROBOT: {
    LIST: "/autoxing/robots/list",
    GET: "/autoxing/robots/{robotId}/state-v2",
  },
  BUSINESS: {
    LIST: "/autoxing/businesses/list",
    ASSIGN: "/autoxing/businesses/assign",
    UNASSIGN: "/autoxing/businesses/unassign",
  },
  MAP: {
    POINTS_OF_INTEREST: {
      LIST: "/autoxing/maps/pois/list",
    },
    AREAS: {
      LIST: "/autoxing/maps/areas/list",
      BASE_MAP: "/autoxing/maps/areas/{areaId}/base-map",
    },
  },
  TASK: {
    LIST: "/autoxing/tasks/list",
    GET: "/autoxing/tasks/v2/{taskId}/state",
    CREATE: "/autoxing/tasks",
    CREATE_V3: "/autoxing/tasks/v3",
    EXECUTE: "/autoxing/tasks/{taskId}/execute",
    CANCEL: "/autoxing/tasks/{taskId}/cancel",
  },
} as const;
