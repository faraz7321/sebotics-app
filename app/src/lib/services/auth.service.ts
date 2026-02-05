import { API_ENDPOINTS } from "@/config/routes";
import type { AuthCreds } from "../types/AuthTypes";


class AuthService {
  async login(credentials: AuthCreds): Promise<any> {

    const body = {
      username: credentials.username,
      password: credentials.password,
    };

    const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorMessage = "Signin failed";
      let errorCode: string | undefined;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        errorCode = errorData.error;
      } catch {
        // Ignore JSON parse errors
      }

      const error = new Error(errorMessage);
      (error as Error & { code?: string; }).code =
        errorCode;
      throw error;
    }

    const data = await response.json();
    return {
      accessToken: data.accessToken,
      user: data.user,
    };
  }

  async register(userData: {
    username: string;
    password: string;
  }): Promise<any> {
    const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Registration failed");
    }

    const data = await response.json();
    return {
      token: data.token,
      user: data.user,
    };
  }
}

export const authService = new AuthService();
