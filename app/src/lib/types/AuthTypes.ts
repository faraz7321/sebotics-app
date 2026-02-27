export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: string;
};

export type LoginCreds = {
  username: string;
  password: string;
};

export type RegisterCreds = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
};

export type AuthResult = {
  accessToken: string;
  user: AuthUser;
};

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;

  resetToken: string | null;

  loading: boolean;
  error: string | null;
}
