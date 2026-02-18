export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: string;
}

export interface UserState {
  loading: boolean;
  error: string | null;

  user: User | null;

  users: User[];
}