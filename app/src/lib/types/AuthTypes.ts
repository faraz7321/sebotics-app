export type AuthUser = {
  id: string;
  email: string;
  name: string;
  token: string;

  loading: boolean;
  error: string | null;
};