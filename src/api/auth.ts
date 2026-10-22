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
  role?: string;
  company?: string;
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

/** Always resolves with the same message whether or not the email has an account. */
export async function requestPasswordReset(email: string): Promise<string> {
  const { data } = await axios.post<{ message: string }>(`${API_BASE_URL}/auth/forgot-password`, { email });
  return data.message;
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await axios.post(`${API_BASE_URL}/auth/reset-password`, { token, new_password: newPassword });
}

export async function checkUsername(username: string, signal?: AbortSignal) {
  const { data } = await api.get<{ username: string; available: boolean; reason: string | null }>(
    "/auth/username-available", { params: { username }, signal });
  return data;
}

/** Creates the account for a first-time GitHub sign-in and returns its login token. */
export async function completeGitHubSignup(
  onboardingToken: string,
  username: string,
  role?: string,
  company?: string,
): Promise<string> {
  const { data } = await axios.post<LoginTokenResponse>(`${API_BASE_URL}/auth/github/complete`,
    { onboarding_token: onboardingToken, username, role: role || undefined, company: company || undefined });
  return data.access_token;
}

/** Omit currentPassword to set a first password on a GitHub-only account. Returns a fresh token. */
export async function changePassword(newPassword: string, currentPassword?: string): Promise<string> {
  const { data } = await api.post<LoginTokenResponse>("/auth/change-password",
    { new_password: newPassword, current_password: currentPassword || undefined });
  return data.access_token;
}

/** Requires Bearer token (uses `api` client). */
export async function changeUsername(username: string): Promise<AuthUser> {
  const { data } = await api.put<AuthUser>("/auth/username", { username });
  return data;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/auth/me");
  return data;
}
