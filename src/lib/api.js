import axios from "axios";

/*
|--------------------------------------------------------------------------
| 🔧 Axios Instance
|--------------------------------------------------------------------------
| - Secara default pakai Bearer token (Authorization header)
| - Jika withCredentials diaktifkan (Sanctum cookie-based), maka token
|   diabaikan dan cookie otomatis dikirim.
*/
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5173",
  timeout: 15000,
  withCredentials: true, // ⬅️ penting kalau pakai Sanctum cookie
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| 🧠 Interceptor Request
|--------------------------------------------------------------------------
| - Tambahkan Authorization Bearer token jika ada di localStorage.
| - Berlaku kalau kamu masih mau support API token (misal: mobile app)
*/
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/*
|--------------------------------------------------------------------------
| ⚠️ Interceptor Response
|--------------------------------------------------------------------------
| - Tangani error global 401/419 (token invalid atau session expired)
| - Hapus token dan redirect ke login page.
*/
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401 || status === 419) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Jika bukan di halaman login, redirect
        if (window.location.pathname !== "/auth/login") {
          window.location.href = "/auth/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

/*
|--------------------------------------------------------------------------
| ⚙️ Sanctum Helpers
|--------------------------------------------------------------------------
| Fungsi tambahan untuk login berbasis cookie (SPA).
| Kamu bisa panggil ini dari Vue component sebelum request API.
*/
export async function sanctumLogin(email, password) {
  // 1️⃣ Ambil CSRF cookie dari Laravel
  await api.get("/sanctum/csrf-cookie");

  // 2️⃣ Login (gunakan route /login, bukan /api/login)
  return api.post("/login", { email, password });
}

export async function sanctumLogout() {
  return api.post("/logout");
}

export async function sanctumProfile() {
  return api.get("/profile");
}

export default api;
