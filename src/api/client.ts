import axios from "axios";
import { getToken } from "../auth/token";
import { API_BASE_URL } from "./config";

/**
 * Authenticated API client. Sends `Authorization: Bearer <token>` when a token exists in localStorage.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = String(error.config?.url ?? "");
      const skip =
        url.includes("/auth/login") || url.includes("/auth/register");
      if (!skip) {
        window.dispatchEvent(new CustomEvent("devzgo:session-expired"));
      }
    }
    return Promise.reject(error);
  }
);
