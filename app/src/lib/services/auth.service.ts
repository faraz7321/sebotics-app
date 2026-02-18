import { API_ENDPOINTS } from "@/config/routes";
import type { AuthResult, AuthUser, LoginCreds, RegisterCreds } from "../types/AuthTypes";
import api from "@/lib/api/axios";
import axios from "axios";

type AuthApiResponse = {
  accessToken: string;
  user: AuthUser;
  message?: string;
  error?: string;
};

type ServiceError = Error & { code?: string };

class AuthService {
  async login(credentials: LoginCreds): Promise<AuthResult> {
    try {
      const response = await api.post<AuthApiResponse>(API_ENDPOINTS.AUTH.LOGIN, {
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
    } catch (err: unknown) {
      throw this.buildServiceError(err, "Signin failed");
    }
  }

  async register(credentials: RegisterCreds): Promise<AuthResult> {
    try {
      const response = await api.post<AuthApiResponse>(
        API_ENDPOINTS.AUTH.REGISTER, {
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        email: credentials.email,
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
    } catch (err: unknown) {
      throw this.buildServiceError(err, "Registration failed");
    }
  }

  private buildServiceError(err: unknown, fallbackMessage: string): ServiceError {
    let errorMessage = fallbackMessage;
    let errorCode: string | undefined;

    if (axios.isAxiosError<AuthApiResponse>(err)) {
      errorMessage = err.response?.data?.message || errorMessage;
      errorCode = err.response?.data?.error;
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }

    const error: ServiceError = new Error(errorMessage);
    error.code = errorCode;
    return error;
  }
}

export const authService = new AuthService();
