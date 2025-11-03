<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">hr</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Holidays</h1>
      </div>

      <div class="flex gap-2 w-full lg:w-auto">
        <input
          v-model="q.search"
          @input="debouncedSearch"
          @keyup.enter="reload"
          class="flex-1 lg:flex-none border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search by name or note…"
        />
        <button
          @click="reload"
          class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5"
        >
          Search
        </button>
        <button
          @click="openCreate"
          class="inline-flex items-center justify-center gap-2 bg-primary text-white rounded py-2.5 px-5 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[.98] transition"
          title="Add new holiday"
        >
          <Icon icon="ic:round-add" class="text-xl" />
          <span class="font-medium">New Holiday</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div class="flex flex-col sm:flex-row gap-3 flex-1">
          <!-- Year -->
          <div class="w-full sm:w-48">
            <label class="block text-sm dark:text-gray-300 mb-1">Year</label>
            <select
              v-model="q.year"
              @change="reload"
              class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="all">All Years</option>
              <option v-for="y in years" :key="y" :value="String(y)">{{ y }}</option>
            </select>
          </div>

          <!-- Per page -->
          <div class="w-full sm:w-40">
            <label class="block text-sm dark:text-gray-300 mb-1">Per page</label>
            <select
              v-model.number="q.perPage"
              @change="reload"
              class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
            >
              <option v-for="n in [10,20,50]" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>

        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ page.from || 0 }}–{{ page.to || 0 }} of {{ page.total || 0 }}
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">Date</th>
              <th class="px-6 py-3">Weekday</th>
              <th class="px-6 py-3">Name</th>
              <th class="px-6 py-3">National</th>
              <th class="px-6 py-3">Note</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3">{{ formatDate(r.date) }}</td>
              <td class="px-6 py-3">{{ formatWeekday(r.date) }}</td>
              <td class="px-6 py-3">{{ r.name }}</td>
              <td class="px-6 py-3">
                <span v-if="isTrue(r.is_national)" class="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Yes</span>
                <span v-else class="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">No</span>
              </td>
              <td class="px-6 py-3 truncate max-w-[360px]" :title="r.note">{{ r.note || '-' }}</td>
              <td class="px-6 py-3 text-right space-x-2">
                <button @click="openEdit(r)" class="px-2 py-1 rounded border dark:border-gray-600" title="Edit">Edit</button>
                <button @click="confirmDelete(r)" class="px-2 py-1 rounded border dark:border-gray-600" :disabled="saving" title="Delete">Delete</button>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="6" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-5 py-4 flex items-center justify-between">
        <button :disabled="!page.prev" @click="go(page.current - 1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">Prev</button>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ page.current || 1 }} / {{ page.last || 1 }}
        </div>
        <button :disabled="!page.next" @click="go(page.current + 1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">Next</button>
      </div>
    </div>

    <!-- Modal: Create/Edit -->
    <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-md p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">
          {{ modal.mode === 'create' ? 'New Holiday' : 'Edit Holiday' }}
        </h3>

        <div class="grid gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Date<span class="text-red-500">*</span></label>
            <input v-model="form.date" type="date" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.date" class="text-xs text-red-500 mt-1">{{ fieldErrors.date[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Name<span class="text-red-500">*</span></label>
            <input v-model="form.name" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="e.g., New Year" />
            <p v-if="fieldErrors.name" class="text-xs text-red-500 mt-1">{{ fieldErrors.name[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Note</label>
            <input v-model="form.note" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="Optional note" />
            <p v-if="fieldErrors.note" class="text-xs text-red-500 mt-1">{{ fieldErrors.note[0] }}</p>
          </div>

          <div class="flex items-center gap-2 mt-1">
            <input id="is_national" type="checkbox" v-model="form.is_national" class="w-4 h-4 rounded border dark:border-gray-600 dark:bg-gray-800" />
            <label for="is_national" class="text-sm dark:text-gray-300">National Holiday</label>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open = false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="save" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast fallback -->
    <div v-if="error" class="fixed bottom-4 right-4 bg-red-600 text-white text-sm px-4 py-3 rounded shadow">
      {{ error }}
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { Icon } from "@iconify/vue";

export default {
  name: "Holidays",
  components: { Icon },

  data() {
    return {
      loading: false,
      rows: [],
      q: { page: 1, perPage: 10, search: "", year: "all" },
      page: { current: 1, last: 1, total: 0, from: 0, to: 0, prev: false, next: false },

      years: [],

      modal: { open: false, mode: "create", id: null },
      form: { id: null, date: "", name: "", is_national: false, note: "" },

      saving: false,
      error: "",
      fieldErrors: {},
      _searchTimer: null,
    };
  },

  mounted() {
    this.loadYears().finally(() => this.reload());
  },

  methods: {
    toast(icon, title) {
      Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 1500, timerProgressBar: true })
        .fire({ icon, title });
    },

    resolveBaseUrl() {
      const raw = import.meta?.env?.VITE_API_BASE || process?.env?.VUE_APP_API_BASE || "http://localhost:8000";
      return String(raw).trim().replace(/\/+$/, "");
    },

    api() {
      const token = localStorage.getItem("token");
      const API_BASE = this.resolveBaseUrl();
      const instance = axios.create({
        baseURL: `${API_BASE}/api/hr`,
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
    },

    formatDate(iso) {
      const d = new Date(iso);
      if (isNaN(d)) return iso || "-";
      return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(d);
    },
    formatWeekday(iso) {
      const d = new Date(iso);
      if (isNaN(d)) return "-";
      return new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(d);
    },
    isTrue(v) { return v === true || v === 1 || v === "1"; },

    cleanParams(raw) {
      const p = { ...raw };
      if (!String(p.search || "").trim()) delete p.search;
      if (!String(p.year || "")) delete p.year;
      return p;
    },

    async loadYears() {
      try {
        const { data } = await this.api().get("/holidays/years");
        const arr = Array.isArray(data?.years) ? data.years : Array.isArray(data) ? data : [];
        this.years = arr.map(Number).filter(Boolean).sort((a, b) => b - a);
      } catch {
        this.years = []; // fallback dari list
      }
    },

    async reload() {
      this.loading = true; this.error = ""; this.fieldErrors = {};
      try {
        const params = this.cleanParams({
          page: this.q.page,
          per_page: this.q.perPage,
          search: this.q.search,
          year: this.q.year === "all" ? undefined : this.q.year,
        });

        const { data } = await this.api().get("/holidays", { params });

        const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.rows = rows.map(r => ({
          id: r.id,
          date: r.date,
          name: r.name,
          is_national: this.isTrue(r.is_national) ? 1 : 0,
          note: r.note || null,
        }));

        // fallback generate years
        if (!this.years.length && this.rows.length) {
          const ys = new Set(this.rows.map(h => new Date(h.date).getFullYear()).filter(n => !isNaN(n)));
          this.years = Array.from(ys).sort((a, b) => b - a);
        }

        this.page = {
          current: Number(data.current_page || 1),
          last: Number(data.last_page || 1),
          total: Number(data.total || this.rows.length),
          from: Number(data.from || (this.rows.length ? 1 : 0)),
          to: Number(data.to || this.rows.length),
          prev: Number(data.current_page || 1) > 1,
          next: Number(data.current_page || 1) < Number(data.last_page || 1),
        };
      } catch (e) {
        this.error = e?.response?.data?.message || "Failed to load holidays";
      } finally {
        this.loading = false;
      }
    },

    debouncedSearch() {
      clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => this.reload(), 350);
    },

    go(p) {
      this.q.page = Math.max(1, p);
      this.reload();
    },

    openCreate() {
      this.modal = { open: true, mode: "create", id: null };
      this.error = ""; this.fieldErrors = {};
      this.form = { id: null, date: "", name: "", is_national: false, note: "" };
    },

    openEdit(row) {
      this.modal = { open: true, mode: "edit", id: row.id };
      this.error = ""; this.fieldErrors = {};
      this.form = {
        id: row.id,
        date: row.date || "",
        name: row.name || "",
        is_national: this.isTrue(row.is_national),
        note: row.note || "",
      };
    },

    toPayload() {
      const t = (v) => (typeof v === "string" ? v.trim() : v);
      return {
        date: this.form.date || null,
        name: t(this.form.name),
        is_national: this.form.is_national ? 1 : 0,
        note: t(this.form.note) || null,
      };
    },

    async save() {
      this.saving = true; this.error = ""; this.fieldErrors = {};

      if (!this.form.date) { this.saving = false; this.error = "Date wajib diisi."; return; }
      if (!String(this.form.name || "").trim()) { this.saving = false; this.error = "Name wajib diisi."; return; }

      try {
        const payload = this.toPayload();
        if (this.modal.mode === "create") {
          await this.api().post("/holidays", payload);
          this.toast("success", "Holiday created");
        } else {
          await this.api().put(`/holidays/${this.form.id}`, payload);
          this.toast("success", "Holiday updated");
        }
        this.modal.open = false;
        await this.reload();
      } catch (e) {
        if (e?.response?.status === 422) {
          this.fieldErrors = e.response.data?.errors || {};
          this.error = Object.values(this.fieldErrors)[0]?.[0] || e.response.data?.message || "Validasi gagal";
          this.toast("error", this.error);
        } else {
          this.error = e?.response?.data?.message || "Gagal menyimpan holiday";
          this.toast("error", this.error);
        }
      } finally { this.saving = false; }
    },

    async confirmDelete(row) {
      const res = await Swal.fire({
        title: `Hapus "${row.name}"?`,
        text: `Tanggal ${this.formatDate(row.date)}`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        focusCancel: true,
      });
      if (!res.isConfirmed) return;

      this.saving = true; this.error = "";
      try {
        await this.api().delete(`/holidays/${row.id}`);
        this.toast("success", "Deleted");
        await this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal menghapus holiday";
        this.toast("error", this.error);
      } finally { this.saving = false; }
    },
  },
};
</script>
