export type AuthUser = {
  id: string;
  username: string;
  role: string;
};

export type AuthCreds = {
  username: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string;

  loading: boolean;
  error: string | null;
}