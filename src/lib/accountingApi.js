// src/lib/accountingApi.js
import axios from "axios";

/* ============================================================================
| 🔧 Resolve Base URL dari env (fallback localhost)
============================================================================ */
const API_BASE =
  (import.meta?.env?.VITE_API_BASE && String(import.meta.env.VITE_API_BASE).trim().replace(/\/+$/, "")) ||
  "http://localhost:8000";

/* ============================================================================
| 🧩 Singleton Axios untuk /api/accounting
| - Request interceptor membaca token TERKINI dari localStorage
| - Response interceptor handle 401 → redirect ke /auth/login
============================================================================ */
let _instance = null;

export function accountingApi() {
  if (_instance) return _instance;

  _instance = axios.create({
    baseURL: `${API_BASE}/api/accounting`,
    headers: { Accept: "application/json" },
    timeout: 15000,
  });

  // Inject token sebelum setiap request (selalu paling baru)
  _instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Tangani 401
  _instance.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/auth/login") {
          window.location.href = "/auth/login";
        }
      }
      return Promise.reject(err);
    }
  );

  return _instance;
}

/* ============================================================================
| 🧠 Wrapper nyaman (opsional)
| - Sesuai route API yang sudah kamu set:
|   /api/accounting/accounts, /journals, /moves, /moves/{id}/post, /reports/{type}
============================================================================ */
export const Accounting = {
  Accounts: {
    list:   (params)     => accountingApi().get("/accounts", { params }),
    show:   (id)         => accountingApi().get(`/accounts/${id}`),
    create: (payload)    => accountingApi().post("/accounts", payload),
    update: (id, payload)=> accountingApi().put(`/accounts/${id}`, payload),     // kamu pakai PUT/PATCH, pilih salah satu
    patch:  (id, payload)=> accountingApi().patch(`/accounts/${id}`, payload),   // opsional kalau mau PATCH
    remove: (id)         => accountingApi().delete(`/accounts/${id}`),
  },

  Journals: {
    list:   (params)     => accountingApi().get("/journals", { params }),
    show:   (id)         => accountingApi().get(`/journals/${id}`),
    create: (payload)    => accountingApi().post("/journals", payload),
    update: (id, payload)=> accountingApi().put(`/journals/${id}`, payload),
    patch:  (id, payload)=> accountingApi().patch(`/journals/${id}`, payload),
    remove: (id)         => accountingApi().delete(`/journals/${id}`),
  },

  Moves: {
    list:     (params)    => accountingApi().get("/moves", { params }),
    show:     (id)        => accountingApi().get(`/moves/${id}`),
    create:   (payload)   => accountingApi().post("/moves", payload),
    update:   (id, payload)=> accountingApi().put(`/moves/${id}`, payload),
    patch:    (id, payload)=> accountingApi().patch(`/moves/${id}`, payload),
    remove:   (id)        => accountingApi().delete(`/moves/${id}`),
    post:     (id)        => accountingApi().post(`/moves/${id}/post`),
    bulkPost: (ids)       => accountingApi().post("/moves/bulk-post", { ids }),
  },

  Reports: {
    index:       ()                   => accountingApi().get("/reports"),
    byType:      (type, params)       => accountingApi().get(`/reports/${type}`, { params }),
    // helper sesuai controller kamu
    trialBalance:(params)             => accountingApi().get("/reports/trial-balance", { params }),
    generalLedger:(params)            => accountingApi().get("/reports/general-ledger", { params }),
  },
};
