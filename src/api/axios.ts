import axios from "axios";
import { getToken } from "../auth/token";

const API_BASE = "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
