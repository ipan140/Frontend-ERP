<template>
  <div class="lg:h-screen h-auto p-3">
    <!-- Breadcrumb -->
    <nav class="flex" aria-label="Breadcrumb">
      <ol class="inline-flex items-center space-x-1 md:space-x-3">
        <li class="inline-flex items-center">
          <a href="#" class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <svg class="mr-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
            </svg>
            Dashboard
          </a>
        </li>
        <li>
          <div class="flex items-center">
            <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
            </svg>
            <span class="ml-1 text-sm font-medium text-gray-700 md:ml-2 dark:text-gray-400">Users</span>
          </div>
        </li>
      </ol>
    </nav>

    <!-- Header -->
    <div class="mt-5 w-full">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl text-gray-900 font-medium dark:text-gray-200">Kelola User</h1>
          <p class="mt-1 text-sm font-normal text-gray-400">
            Tambah, edit, dan hapus user. Data diambil dari API Laravel (Sanctum).
          </p>
        </div>

        <!-- Modal Tambah User (pakai komponen Modal proyek) -->
        <Modal
          title="Tambah User"
          subtitle="Isi data user baru"
          btnText="Tambah User"
          btnTextSubmit="Simpan"
          @submit="handleCreate"
        >
          <template #body>
            <div class="space-y-4">
              <div>
                <label class="block text-sm mb-1">Nama</label>
                <input v-model.trim="formCreate.name" type="text" class="p-2 border dark:border-gray-600 dark:bg-gray-700 w-full rounded outline-none" />
              </div>
              <div>
                <label class="block text-sm mb-1">Email</label>
                <input v-model.trim="formCreate.email" type="email" class="p-2 border dark:border-gray-600 dark:bg-gray-700 w-full rounded outline-none" />
              </div>
              <div>
                <label class="block text-sm mb-1">Password</label>
                <input v-model="formCreate.password" type="password" class="p-2 border dark:border-gray-600 dark:bg-gray-700 w-full rounded outline-none" />
              </div>
              <div>
                <label class="block text-sm mb-1">Konfirmasi Password</label>
                <input v-model="formCreate.password_confirmation" type="password" class="p-2 border dark:border-gray-600 dark:bg-gray-700 w-full rounded outline-none" />
              </div>
            </div>
          </template>
        </Modal>
      </div>
    </div>

    <!-- Card List -->
    <div class="card bg-white dark:bg-gray-800 w-full rounded-md p-5 border dark:border-gray-700 mt-4">
      <!-- Search + Refresh -->
      <div class="flex items-center gap-2 mb-4">
        <input
          v-model.trim="q"
          type="text"
          placeholder="Cari nama/email…"
          class="p-2 border dark:border-gray-600 dark:bg-gray-700 w-full rounded outline-none"
          @input="applyFilter"
        />
        <button
          @click="reload"
          class="px-3 py-2 text-sm rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-100"
        >
          Refresh
        </button>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="text-gray-600 dark:text-gray-300">
            <tr class="text-left border-b dark:border-gray-700">
              <th class="py-3 pr-3">Nama</th>
              <th class="py-3 pr-3">Email</th>
              <th class="py-3 pr-3">Dibuat</th>
              <th class="py-3 pr-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" class="py-6 text-center text-gray-500 dark:text-gray-400">Memuat data…</td>
            </tr>
            <tr v-else-if="!filtered.length">
              <td colspan="4" class="py-6 text-center text-gray-500 dark:text-gray-400">Tidak ada data.</td>
            </tr>
            <tr v-for="u in filtered" :key="u.id" class="border-b dark:border-gray-700">
              <td class="py-3 pr-3 text-gray-900 dark:text-gray-100">{{ u.name }}</td>
              <td class="py-3 pr-3 text-gray-600 dark:text-gray-300">{{ u.email }}</td>
              <td class="py-3 pr-3 text-gray-500 dark:text-gray-400">{{ formatDate(u.created_at) }}</td>
              <td class="py-3 pr-3">
                <div class="flex items-center justify-end gap-2">
                  <!-- Modal Edit -->
                  <Modal
                    :title="`Edit User: ${u.name}`"
                    subtitle="Ubah data user. Kosongkan password jika tidak diganti."
                    btnText="Edit"
                    btnTextSubmit="Simpan Perubahan"
                    @open="prefillEdit(u)"
                    @submit="() => handleUpdate(u.id)"
                  >
                    <template #body>
                      <div class="space-y-4">
                        <div>
                          <label class="block text-sm mb-1">Nama</label>
                          <input v-model.trim="formEdit.name" type="text" class="p-2 border dark:border-gray-600 dark:bg-gray-700 w-full rounded outline-none" />
                        </div>
                        <div>
                          <label class="block text-sm mb-1">Email</label>
                          <input v-model.trim="formEdit.email" type="email" class="p-2 border dark:border-gray-600 dark:bg-gray-700 w-full rounded outline-none" />
                        </div>
                        <div>
                          <label class="block text-sm mb-1">Password (opsional)</label>
                          <input v-model="formEdit.password" type="password" class="p-2 border dark:border-gray-600 dark:bg-gray-700 w-full rounded outline-none" />
                        </div>
                        <div v-if="formEdit.password">
                          <label class="block text-sm mb-1">Konfirmasi Password</label>
                          <input v-model="formEdit.password_confirmation" type="password" class="p-2 border dark:border-gray-600 dark:bg-gray-700 w-full rounded outline-none" />
                        </div>
                      </div>
                    </template>
                  </Modal>

                  <!-- Hapus -->
                  <button
                    @click="confirmDelete(u)"
                    class="px-3 py-2 text-sm rounded bg-red-500 text-white hover:bg-red-600"
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination (simple, client-side) -->
      <div class="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Jumlah: {{ filtered.length }} / {{ users.length }}</span>
        <div class="flex items-center gap-2">
          <button class="px-2 py-1 rounded border dark:border-gray-700" @click="pageDown" :disabled="page === 1">Prev</button>
          <span>Hal {{ page }}</span>
          <button class="px-2 py-1 rounded border dark:border-gray-700" @click="pageUp" :disabled="endIndex >= filteredAll.length">Next</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Modal from "@/components/modal.vue";

/** Ambil base URL API (Vite / Vue-CLI / fallback) */
function resolveBaseURL() {
  // Vue CLI / webpack
  const cli =
    (typeof process !== "undefined" &&
      process.env &&
      (process.env.VUE_APP_API_BASE || process.env.VUE_APP_API_BASE)) ||
    undefined;

  // Vite (via eval agar aman di Babel)
  let vite;
  try {
    // eslint-disable-next-line no-eval
    vite = eval(
      'typeof import !== "undefined" && import.meta && import.meta.env && import.meta.env.VITE_API_BASE'
    );
  } catch (_) {
    vite = undefined;
  }

  const injected =
    (typeof window !== "undefined" && window.__VITE_API_BASE__) || undefined;

  const raw = vite || cli || injected || "http://localhost:8000";
  return String(raw).replace(/\/+$/, "");
}

async function apiFetch(path, { method = "GET", body, token } = {}) {
  const base = resolveBaseURL();
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) {
    const msg =
      data?.message ||
      data?.errors && Object.values(data.errors)[0]?.[0] ||
      `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export default {
  name: "UserManagePage",
  components: { Modal },

  data() {
    return {
      loading: false,
      users: [],
      q: "",
      // form create
      formCreate: {
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
      },
      // form edit
      formEdit: {
        id: null,
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
      },
      // pagination (client-side)
      page: 1,
      perPage: 10,
    };
  },

  computed: {
    filteredAll() {
      const key = this.q.toLowerCase();
      if (!key) return this.users;
      return this.users.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(key) ||
          (u.email || "").toLowerCase().includes(key)
      );
    },
    startIndex() {
      return (this.page - 1) * this.perPage;
    },
    endIndex() {
      return this.startIndex + this.perPage;
    },
    filtered() {
      return this.filteredAll.slice(this.startIndex, this.endIndex);
    },
  },

  methods: {
    formatDate(d) {
      if (!d) return "-";
      try {
        const dt = new Date(d);
        return dt.toLocaleString();
      } catch {
        return d;
      }
    },

    applyFilter() {
      this.page = 1;
    },

    pageUp() {
      if (this.endIndex < this.filteredAll.length) this.page += 1;
    },
    pageDown() {
      if (this.page > 1) this.page -= 1;
    },

    async reload() {
      await this.loadUsers();
    },

    async loadUsers() {
      this.loading = true;
      const token = localStorage.getItem("token");
      try {
        // Ekspektasi backend: GET /api/users -> { data: [...] } atau langsung [...]
        const data = await apiFetch("/users", { token });
        this.users = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : data?.users || []);
      } catch (err) {
        if (err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          this.$router.push({ name: "Login" });
          return;
        }
        alert(err.message || "Gagal memuat user.");
        console.error("loadUsers error:", err.payload || err);
      } finally {
        this.loading = false;
      }
    },

    /** Modal Create submit */
    async handleCreate() {
      const token = localStorage.getItem("token");
      const { name, email, password, password_confirmation } = this.formCreate;

      if (!name || !email || !password || !password_confirmation) {
        alert("Semua field wajib diisi.");
        return false; // biar modal tidak auto-close jika komponen Modal mendukung
      }
      if (password.length < 8) {
        alert("Password minimal 8 karakter.");
        return false;
      }
      if (password !== password_confirmation) {
        alert("Konfirmasi password tidak cocok.");
        return false;
      }

      try {
        await apiFetch("/users", {
          method: "POST",
          token,
          body: { name, email, password, password_confirmation },
        });
        await this.loadUsers();
        // reset
        this.formCreate = { name: "", email: "", password: "", password_confirmation: "" };
        return true; // izinkan modal close (jika Modal mendukung)
      } catch (err) {
        alert(err.message || "Gagal menambah user.");
        console.error("create error:", err.payload || err);
        return false;
      }
    },

    /** Saat modal Edit dibuka, isi data */
    prefillEdit(u) {
      this.formEdit = {
        id: u.id,
        name: u.name || "",
        email: u.email || "",
        password: "",
        password_confirmation: "",
      };
    },

    /** Modal Edit submit */
    async handleUpdate(id) {
      const token = localStorage.getItem("token");
      const payload = {
        name: this.formEdit.name,
        email: this.formEdit.email,
      };
      // password opsional
      if (this.formEdit.password) {
        if (this.formEdit.password.length < 8) {
          alert("Password minimal 8 karakter.");
          return false;
        }
        if (this.formEdit.password !== this.formEdit.password_confirmation) {
          alert("Konfirmasi password tidak cocok.");
          return false;
        }
        payload.password = this.formEdit.password;
        payload.password_confirmation = this.formEdit.password_confirmation;
      }

      try {
        await apiFetch(`/users/${id}`, {
          method: "PUT",
          token,
          body: payload,
        });
        await this.loadUsers();
        return true;
      } catch (err) {
        alert(err.message || "Gagal mengubah user.");
        console.error("update error:", err.payload || err);
        return false;
      }
    },

    async confirmDelete(u) {
      if (!confirm(`Hapus user "${u.name}" ?`)) return;
      const token = localStorage.getItem("token");
      try {
        await apiFetch(`/users/${u.id}`, { method: "DELETE", token });
        await this.loadUsers();
      } catch (err) {
        alert(err.message || "Gagal menghapus user.");
        console.error("delete error:", err.payload || err);
      }
    },
  },

  async mounted() {
    await this.loadUsers();
  },
};
</script>
