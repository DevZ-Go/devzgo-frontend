import axios from "axios";

const API_BASE = "http://localhost:8000";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  username: string;
}

export async function login(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  const { data } = await axios.post<LoginResponse>(
    `${API_BASE}/login`,
    credentials,
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
}

export async function register(
  credentials: RegisterCredentials
): Promise<RegisterResponse> {
  const { data } = await axios.post<RegisterResponse>(
    `${API_BASE}/register`,
    credentials,
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
}
