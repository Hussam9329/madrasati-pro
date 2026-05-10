// ==================== User & Auth Types ====================

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

export interface UserData {
  id: string;
  username: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}
