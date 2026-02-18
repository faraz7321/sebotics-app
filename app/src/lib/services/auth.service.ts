import { API_ENDPOINTS } from "@/config/routes";
import { API_BASE_URL } from "../runtime-config";
import type { AuthResult, AuthUser, LoginCreds, RegisterCreds } from "../types/AuthTypes";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

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
      const response = await axios.post<AuthApiResponse>(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
        username: credentials.username,
        password: credentials.password,
      },
        {
          withCredentials: true,
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
      const response = await axios.post<AuthApiResponse>(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, {
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        email: credentials.email,
        username: credentials.username,
        password: credentials.password,
      },
        {
          withCredentials: true,
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

  async refreshToken(): Promise<string> {
    try {
      const response = await axios.post<AuthApiResponse>(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
        {},
        {
          withCredentials: true,
          validateStatus: (status) => status === 200 || status === 201,
        }
      );

      return response.data.accessToken;
    } catch (err: unknown) {
      throw this.buildServiceError(err, "Session expired. Please login again.");
    }
  }

  isTokenExpired(token: string | null): boolean {
    if (!token) return true;

    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      const currentTime = Date.now() / 1000;

      return decoded.exp < currentTime + 180;
    } catch {
      return true;
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
