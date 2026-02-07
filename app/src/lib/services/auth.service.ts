import { API_ENDPOINTS } from "@/config/routes";
import type { AuthCreds } from "../types/AuthTypes";
import api from "@/lib/api/axios";
import axios from "axios";

class AuthService {
  async login(credentials: AuthCreds): Promise<any> {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
        username: credentials.username,
        password: credentials.password,
      },
        {
          validateStatus: () => true,
          responseType: "json",
        }
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.data?.message || "Login failed");
      }

      return {
        accessToken: response.data.accessToken,
        user: response.data.user,
      };
    } catch (err) {
      let errorMessage = "Signin failed";
      let errorCode: string | undefined;

      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
        errorCode = err.response?.data?.error;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      const error = new Error(errorMessage);
      (error as Error & { code?: string }).code = errorCode;
      throw error;
    }
  }

  async register(credentials: AuthCreds): Promise<any> {
    try {
      const response = await api.post(
        API_ENDPOINTS.AUTH.REGISTER, {
        username: credentials.username,
        password: credentials.password,
      },
        {
          validateStatus: () => true,
          responseType: "json",
        }
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.data?.message || "Registration failed");
      }

      return {
        accessToken: response.data.accessToken,
        user: response.data.user,
      };
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw new Error(
          err.response?.data?.message || "Registration failed"
        );
      }

      throw err;
    }
  }
}

export const authService = new AuthService();