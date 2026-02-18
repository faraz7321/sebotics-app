export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface UserState {
  loading: boolean;
  error: string | null;

  users: User[];
}