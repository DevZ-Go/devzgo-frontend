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
  first_name: string;
  last_name: string;
  role?: string;
  company?: string;
}

/**
 * OAuth2 password flow: FastAPI expects form fields `username` (email or username) and `password`.
 */
export async function loginWithPassword(
  identifier: string,
  password: string
): Promise<LoginTokenResponse> {
  const body = new URLSearchParams();
  body.set("username", identifier);
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

export type RegisterResult =
  | { verification_required: true; pending_id: string; email_masked: string; resend_after: string }
  | { id: string; username: string; email: string; verification_required?: false };

export async function registerUser(payload: RegisterPayload): Promise<RegisterResult> {
  const { data } = await axios.post<RegisterResult>(`${API_BASE_URL}/auth/register`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
}

export async function verifyEmailCode(pendingId: string, code: string): Promise<{ ok: boolean; username: string }> {
  const { data } = await axios.post<{ ok: boolean; username: string }>(`${API_BASE_URL}/auth/verify-email`, {
    pending_id: pendingId,
    code,
  });
  return data;
}

export async function resendVerification(pendingId: string): Promise<{ resend_after: string; email_masked: string }> {
  const { data } = await axios.post<{ resend_after: string; email_masked: string }>(
    `${API_BASE_URL}/auth/resend-verification`,
    { pending_id: pendingId },
  );
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

export type GitHubCompleteResult =
  | { access_token: string; token_type: string; verification_required?: false }
  | { verification_required: true; pending_id: string; email_masked: string; resend_after: string };

/** Creates the account for a first-time GitHub sign-in, or starts email OTP when GitHub had no verified email. */
export async function completeGitHubSignup(
  onboardingToken: string,
  username: string,
  role?: string,
  company?: string,
  email?: string,
): Promise<GitHubCompleteResult> {
  const { data } = await axios.post<GitHubCompleteResult>(`${API_BASE_URL}/auth/github/complete`, {
    onboarding_token: onboardingToken,
    username,
    role: role || undefined,
    company: company || undefined,
    email: email || undefined,
  });
  return data;
}

export async function requestEmailChange(newEmail: string): Promise<{ request_id: string; email_masked: string; resend_after: string }> {
  const { data } = await api.post<{ request_id: string; email_masked: string; resend_after: string }>("/auth/email-change", {
    new_email: newEmail,
  });
  return data;
}

export async function confirmEmailChange(requestId: string, code: string): Promise<{ access_token: string; email: string }> {
  const { data } = await api.post<{ access_token: string; email: string }>("/auth/email-change/confirm", {
    request_id: requestId,
    code,
  });
  return data;
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

/** Pause the account until the next successful sign-in. Invalidates every session. */
export async function deactivateAccount(password?: string, username?: string): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>("/auth/deactivate", {
    password: password || undefined,
    username: username || undefined,
  });
  return data;
}

/** Schedule permanent deletion in 30 days. Signing in before then cancels it. */
export async function scheduleAccountDelete(username: string, password?: string): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>("/auth/schedule-delete", {
    username,
    password: password || undefined,
  });
  return data;
}

/** Clear a pending deletion while still authenticated. */
export async function cancelAccountDelete(): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>("/auth/cancel-delete");
  return data;
}
