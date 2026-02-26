import axios from "axios";
import { API_BASE_URL } from "@/lib/runtime-config";
import { authService } from "../services/auth.service";
import { store } from "@/store";
import { refreshToken } from "../slices/AuthSlice";
import { robotStateSocket, taskStateSocket } from "../ws/stateSockets";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshingPromise: Promise<string> | null = null;

api.interceptors.request.use(
  async (config) => {
    if (refreshingPromise) {
      await refreshingPromise;
    }

    const state = store.getState();
    const keepLoggedIn = localStorage.getItem('keepLoggedIn') === "true";
    let accessToken = state.auth.accessToken;

    if (keepLoggedIn && authService.isTokenExpired(accessToken)) {
      try {
        if (!refreshingPromise) {
          refreshingPromise = store.dispatch(refreshToken()).unwrap().then((newToken) => {
            robotStateSocket.connect();
            taskStateSocket.connect();

            return newToken;
          });
        }

        const refreshedAccessToken = await refreshingPromise;
        accessToken = refreshedAccessToken;
      } catch (err) {
        refreshingPromise = null;
        return Promise.reject(err);
      } finally {
        refreshingPromise = null;
      }
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);



export default api;
