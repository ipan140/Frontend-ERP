// src/lib/api.js
import axios from "axios";

/* ============================================================================
| 🔧 Base Axios Instance
|==============================================================================
| - Gunakan VITE_API_BASE dari environment, fallback ke localhost:8000
| - Otomatis kirim Bearer token jika tersimpan di localStorage
| - Jika butuh Sanctum (cookie-based), aktifkan withCredentials
============================================================================ */
const API_BASE =
  import.meta.env.VITE_API_BASE?.trim().replace(/\/+$/, "") ||
  "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/* ============================================================================
| 🧠 Request Interceptor — Tambah Bearer Token
============================================================================ */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/* ============================================================================
| ⚠️ Response Interceptor — Tangani 401 / 419
============================================================================ */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401 || status === 419) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/auth/login") {
          window.location.href = "/auth/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

/* ============================================================================
| ⚙️ Sanctum Helpers (opsional)
|==============================================================================
| Jika kamu memakai Laravel Sanctum cookie-based SPA, gunakan fungsi ini.
============================================================================ */
export async function sanctumLogin(email, password) {
  await api.get("/sanctum/csrf-cookie");
  return api.post("/login", { email, password });
}

export async function sanctumLogout() {
  return api.post("/logout");
}

export async function sanctumProfile() {
  return api.get("/profile");
}

/* ============================================================================
| 📦 SCM API Helper — baseURL otomatis ke /api/scm
|==============================================================================
| Contoh pemakaian:
|   import { scmApi } from "@/lib/api";
|   scmApi().get("/inventory/stocks");
============================================================================ */
export function scmApi() {
  const token = localStorage.getItem("token");

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

/* ============================================================================
| 🧩 Default export untuk API umum
============================================================================ */
export default api;
