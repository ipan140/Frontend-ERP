// src/views/SCM/_scmApi.js
import axios from "axios";

export function resolveBaseUrl() {
  const raw =
    import.meta?.env?.VITE_API_BASE ||
    process?.env?.VUE_APP_API_BASE ||
    "http://localhost:8000";
  return String(raw).trim().replace(/\/+$/, "");
}

export function scmApi() {
  const token = localStorage.getItem("token");
  const API_BASE = resolveBaseUrl();

  const instance = axios.create({
    baseURL: `${API_BASE}/api/scm`,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/auth/login";
      }
      return Promise.reject(err);
    }
  );

  return instance;
}
