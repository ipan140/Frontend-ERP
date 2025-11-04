<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">sales</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Pricelists</h1>
      </div>

      <div class="flex gap-2 w-full lg:w-auto">
        <input
          v-model="q.search"
          @keyup.enter="reload()"
          class="flex-1 lg:flex-none border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search name/description…"
        />
        <button
          @click="reload()"
          class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5"
        >
          Search
        </button>

        <!-- FIXED BUTTON: solid, ikon plus rapi -->
        <button
          @click="openCreate()"
          class="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 bg-primary text-white
                 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40
                 active:scale-[.98] transition shadow-sm"
          title="Create new pricelist"
        >
          <Icon icon="ic:round-add" class="text-xl" />
          <span class="font-medium">New Pricelist</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 flex flex-wrap gap-3 items-center justify-between">
        <div class="flex flex-wrap gap-3 items-center">
          <div class="flex items-center gap-2">
            <label class="text-sm dark:text-gray-300">Active</label>
            <select
              v-model="q.active"
              @change="reload()"
              class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">All</option>
              <option value="1">Yes</option>
              <option value="0">No</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-sm dark:text-gray-300">Type</label>
            <select
              v-model="q.type"
              @change="reload()"
              class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">All</option>
              <option value="sale">sale</option>
              <option value="purchase">purchase</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-sm dark:text-gray-300">Currency</label>
            <select
              v-model="q.currency"
              @change="reload()"
              class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">All</option>
              <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-sm dark:text-gray-300">Per page</label>
            <select
              v-model.number="q.perPage"
              @change="reload()"
              class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
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
              <th class="px-6 py-3">Name</th>
              <th class="px-6 py-3">Type</th>
              <th class="px-6 py-3">Currency</th>
              <th class="px-6 py-3">Description</th>
              <th class="px-6 py-3">Valid From</th>
              <th class="px-6 py-3">Valid Until</th>
              <th class="px-6 py-3">Active</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3 font-medium text-gray-800 dark:text-gray-100">{{ r.name }}</td>
              <td class="px-6 py-3 uppercase">{{ r.type }}</td>
              <td class="px-6 py-3">{{ r.currency }}</td>
              <td class="px-6 py-3">{{ r.description || '-' }}</td>
              <td class="px-6 py-3">{{ fmtDate(r.valid_from) || '—' }}</td>
              <td class="px-6 py-3">{{ fmtDate(r.valid_until) || '—' }}</td>
              <td class="px-6 py-3">
                <span v-if="r.active" class="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Active</span>
                <span v-else class="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Inactive</span>
              </td>
              <td class="px-6 py-3 text-right">
                <button @click="openEdit(r)" class="px-2 py-1 rounded border dark:border-gray-600 mr-2" title="Edit">
                  Edit
                </button>
                <button @click="confirmDelete(r)" class="px-2 py-1 rounded border dark:border-gray-600" title="Delete">
                  Delete
                </button>
              </td>
            </tr>

            <tr v-if="!loading && !rows.length">
              <td colspan="8" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-5 py-4 flex items-center justify-between">
        <button
          :disabled="!page.prev"
          @click="go(page.current - 1)"
          class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40"
        >
          Prev
        </button>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ page.current || 1 }} / {{ page.last || 1 }}
        </div>
        <button
          :disabled="!page.next"
          @click="go(page.current + 1)"
          class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>

      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">
          {{ modal.mode === 'create' ? 'New Pricelist' : 'Edit Pricelist' }}
        </h3>

        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Name<span class="text-red-500">*</span></label>
            <input v-model="form.name" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.name" class="text-xs text-red-500 mt-1">{{ fieldErrors.name[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Type<span class="text-red-500">*</span></label>
            <select v-model="form.type" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option value="sale">sale</option>
              <option value="purchase">purchase</option>
            </select>
            <p v-if="fieldErrors.type" class="text-xs text-red-500 mt-1">{{ fieldErrors.type[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Currency<span class="text-red-500">*</span></label>
            <select v-model="form.currency" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
            </select>
            <p v-if="fieldErrors.currency" class="text-xs text-red-500 mt-1">{{ fieldErrors.currency[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Valid From<span class="text-red-500">*</span></label>
            <input type="date" v-model="form.valid_from" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.valid_from" class="text-xs text-red-500 mt-1">{{ fieldErrors.valid_from[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Valid Until</label>
            <input type="date" v-model="form.valid_until" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p class="text-xs text-gray-500 mt-1">Kosongkan bila tidak dibatasi (NULL).</p>
            <p v-if="fieldErrors.valid_until" class="text-xs text-red-500 mt-1">{{ fieldErrors.valid_until[0] }}</p>
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Description</label>
            <textarea v-model="form.description" rows="3" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"></textarea>
            <p v-if="fieldErrors.description" class="text-xs text-red-500 mt-1">{{ fieldErrors.description[0] }}</p>
          </div>

          <div class="flex items-center gap-2 mt-2 md:col-span-2">
            <input id="active" type="checkbox" v-model="form.active" class="w-4 h-4 rounded border dark:border-gray-600 dark:bg-gray-800" />
            <label for="active" class="text-sm dark:text-gray-300">Active</label>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open = false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="save()" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Simple loading bar -->
    <div v-if="loading" class="fixed left-0 right-0 top-0 h-1 bg-primary animate-pulse"></div>
  </div>
</template>

<script>
import axios from "axios";
import Swal from "sweetalert2";
import { Icon } from "@iconify/vue";
// import 'sweetalert2/dist/sweetalert2.min.css' // kalau mau global css

export default {
  name: "Pricelists",
  components: { Icon },

  data() {
    return {
      loading: false,
      rows: [],
      q: { page: 1, perPage: 10, search: "", active: "", type: "", currency: "" },
      page: { current: 1, last: 1, total: 0, from: 0, to: 0, prev: false, next: false },

      currencies: ["IDR", "USD", "EUR", "SGD", "JPY"],

      modal: { open: false, mode: "create" },
      form: {
        id: null,
        name: "",
        type: "sale",
        currency: "IDR",
        description: "",
        valid_from: "",
        valid_until: "",
        active: true,
      },

      saving: false,
      error: "",
      fieldErrors: {},
    };
  },

  mounted() {
    this.reload();
  },

  methods: {
    // SweetAlert helpers
    toast(icon, title) {
      const T = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 1600, timerProgressBar: true });
      T.fire({ icon, title });
    },

    resolveBaseUrl() {
      const raw =
        import.meta?.env?.VITE_API_BASE ||
        process?.env?.VUE_APP_API_BASE ||
        "http://localhost:8000";
      return String(raw).trim().replace(/\/+$/, "");
    },

    api() {
      const token = localStorage.getItem("token");
      const API_BASE = this.resolveBaseUrl();

      const instance = axios.create({
        baseURL: `${API_BASE}/api`,
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
    },

    fmtDate(d) {
      if (!d) return "";
      return String(d).slice(0, 10);
    },

    cleanParams(raw) {
      const p = { ...raw };
      if (p.active !== "0" && p.active !== "1") delete p.active;
      if (!p.type) delete p.type;
      if (!p.currency) delete p.currency;
      if (!String(p.search || "").trim()) delete p.search;
      return p;
    },

    toPayload() {
      return {
        name: (this.form.name || "").trim(),
        type: this.form.type,
        currency: this.form.currency,
        description: (this.form.description || "").trim() || null,
        valid_from: this.form.valid_from || null,
        valid_until: this.form.valid_until || null,
        active: this.form.active ? 1 : 0,
      };
    },

    async reload() {
      this.loading = true;
      this.error = "";
      this.fieldErrors = {};
      try {
        const params = this.cleanParams({
          page: this.q.page,
          per_page: this.q.perPage,
          search: this.q.search,
          active: this.q.active,
          type: this.q.type,
          currency: this.q.currency,
        });

        const { data } = await this.api().get("/sales/pricelists", { params });

        const rows = Array.isArray(data?.data) ? data.data : [];
        this.rows = rows.map((r) => ({
          ...r,
          active: r.active === 1 || r.active === "1" || r.active === true,
        }));

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
        const msg = e?.response?.data?.message || "Gagal memuat data pricelist";
        this.error = msg;
        Swal.fire({ icon: "error", title: "Load gagal", text: msg });
      } finally {
        this.loading = false;
      }
    },

    go(p) {
      this.q.page = Math.max(1, p);
      this.reload();
    },

    openCreate() {
      this.modal = { open: true, mode: "create" };
      this.error = "";
      this.fieldErrors = {};
      const today = new Date().toISOString().slice(0, 10);
      this.form = {
        id: null,
        name: "",
        type: "sale",
        currency: "IDR",
        description: "",
        valid_from: today,
        valid_until: "",
        active: true,
      };
    },

    openEdit(row) {
      this.modal = { open: true, mode: "edit" };
      this.error = "";
      this.fieldErrors = {};
      this.form = {
        id: row.id,
        name: row.name || "",
        type: row.type || "sale",
        currency: row.currency || "IDR",
        description: row.description || "",
        valid_from: this.fmtDate(row.valid_from) || "",
        valid_until: this.fmtDate(row.valid_until) || "",
        active: !!row.active,
      };
    },

    async save() {
      if (this.saving) return;
      this.saving = true;
      this.error = "";
      this.fieldErrors = {};

      if (!String(this.form.name || "").trim()) {
        this.saving = false;
        this.error = "Name wajib diisi.";
        Swal.fire({ icon: "warning", title: "Validasi", text: this.error });
        return;
      }
      if (!this.form.valid_from) {
        this.saving = false;
        this.error = "Valid From wajib diisi.";
        Swal.fire({ icon: "warning", title: "Validasi", text: this.error });
        return;
      }

      try {
        const payload = this.toPayload();
        if (this.modal.mode === "create") {
          await this.api().post("/sales/pricelists", payload);
          this.toast("success", "Pricelist created");
        } else {
          await this.api().put(`/sales/pricelists/${this.form.id}`, payload);
          this.toast("success", "Pricelist updated");
        }
        this.modal.open = false;
        await this.reload();
      } catch (e) {
        if (e?.response?.status === 422) {
          this.fieldErrors = e.response.data?.errors || {};
          const msg =
            Object.values(this.fieldErrors)?.[0]?.[0] ||
            e.response.data?.message ||
            "Validasi gagal";
          this.error = msg;
          Swal.fire({ icon: "error", title: "Validasi gagal", text: msg });
        } else {
          const msg = e?.response?.data?.message || "Gagal menyimpan pricelist";
          this.error = msg;
          Swal.fire({ icon: "error", title: "Gagal", text: msg });
        }
      } finally {
        this.saving = false;
      }
    },

    async confirmDelete(row) {
      const res = await Swal.fire({
        icon: "warning",
        title: "Hapus pricelist?",
        text: `Anda akan menghapus "${row.name}". Tindakan ini tidak dapat dibatalkan.`,
        showCancelButton: true,
        confirmButtonText: "Ya, hapus",
        cancelButtonText: "Batal",
        reverseButtons: true,
        focusCancel: true,
      });
      if (!res.isConfirmed) return;

      try {
        await this.api().delete(`/sales/pricelists/${row.id}`);
        this.toast("success", "Pricelist deleted");
        await this.reload();
      } catch (e) {
        const msg = e?.response?.data?.message || "Gagal menghapus pricelist";
        this.error = msg;
        Swal.fire({ icon: "error", title: "Gagal", text: msg });
      }
    },
  },
};
</script>
