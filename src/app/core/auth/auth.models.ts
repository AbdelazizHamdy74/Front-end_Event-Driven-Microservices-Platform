export interface AuthUser {
  id: number;
  role: string;
}

export interface LoginResponse {
  token: string;
}

export interface SignupResponse {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface SessionResponse {
  user: AuthUser;
}
