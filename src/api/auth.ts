import axios from "axios";
import type { AuthUser } from "../types/auth";
import { api } from "./client";
import { API_BASE_URL } from "./config";

export interface LoginTokenResponse {
  access_token: string;
  token_type?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  username: string;
}

/**
 * OAuth2 password flow: FastAPI expects form fields `username` (email) and `password`.
 */
export async function loginWithPassword(
  email: string,
  password: string
): Promise<LoginTokenResponse> {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);

  const { data } = await axios.post<LoginTokenResponse>(
    `${API_BASE_URL}/auth/login`,
    body,
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );
  return data;
}

export async function registerUser(payload: RegisterPayload): Promise<unknown> {
  const { data } = await axios.post(`${API_BASE_URL}/auth/register`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
}

/** Requires Bearer token (uses `api` client). */
export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/auth/me");
  return data;
}
