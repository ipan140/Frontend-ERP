<template>
  <div class="p-4">
    <!-- header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">master</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Customers</h1>
      </div>
      <div class="flex gap-2">
        <input v-model="q.search" @keyup.enter="reload()"
          class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search code/name/email…" />
        <button @click="reload()"
          class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5">
          Search
        </button>
        <button @click="openCreate()"
          class="bg-primary border flex gap-2 text-white hover:bg-primary/80 dark:border-gray-700 rounded py-2.5 px-5">
          <span class="text-2xl">
            <Icon icon="ic:twotone-plus" />
          </span>
          <span>New Customer</span>
        </button>
      </div>
    </div>

    <!-- summary cards -->
    <div class="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-3 mt-5">
      <SummaryCard icon-bg="bg-purple-200" icon-color="text-purple-600" title="Total Customers" :value="stats.total" />
      <SummaryCard icon-bg="bg-green-200" icon-color="text-green-600" title="Active" :value="stats.active" />
      <SummaryCard icon-bg="bg-orange-200" icon-color="text-orange-600" title="With Credit Limit"
        :value="stats.withCredit" />
      <SummaryCard icon-bg="bg-red-200" icon-color="text-red-600" title="Inactive" :value="stats.inactive" />
    </div>

    <!-- table -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 flex flex-wrap gap-3 items-center justify-between">
        <div class="flex gap-2 items-center">
          <label class="text-sm dark:text-gray-300">Active</label>
          <select v-model="q.active" @change="reload()"
            class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
            <option :value="''">All</option>
            <option :value="'1'">Yes</option>
            <option :value="'0'">No</option>
          </select>
          <label class="text-sm ml-3 dark:text-gray-300">Per page</label>
          <select v-model.number="q.perPage" @change="reload()"
            class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
            <option v-for="n in [10, 20, 50]" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ page.from || 0 }}–{{ page.to || 0 }} of {{ page.total || 0 }}
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">Code</th>
              <th class="px-6 py-3">Name</th>
              <th class="px-6 py-3">Email</th>
              <th class="px-6 py-3">Phone</th>
              <th class="px-6 py-3">Address</th>
              <th class="px-6 py-3">Payment Term</th>
              <th class="px-6 py-3 text-right">Credit Limit</th>
              <th class="px-6 py-3">Active</th>
              <th class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in rows" :key="c.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3 font-mono">{{ c.code }}</td>
              <td class="px-6 py-3">{{ c.name }}</td>
              <td class="px-6 py-3">{{ c.email || '-' }}</td>
              <td class="px-6 py-3">{{ c.phone || '-' }}</td>
              <td class="px-6 py-3">{{ c.address || '-' }}</td>
              <td class="px-6 py-3">{{ c.payment_term_name || c.payment_term_id || '-' }}</td>
              <td class="px-6 py-3 text-right">Rp{{ formatNumber(c.credit_limit) }}</td>
              <td class="px-6 py-3">
                <span v-if="c.is_active" class="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Active</span>
                <span v-else class="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Inactive</span>
              </td>
              <td class="px-6 py-3 text-right">
                <button @click="openEdit(c)" class="px-2 py-1 rounded border dark:border-gray-600 mr-2">
                  <Icon icon="mdi:pencil" />
                </button>
                <button @click="confirmDelete(c)" class="px-2 py-1 rounded border dark:border-gray-600">
                  <Icon icon="mdi:trash-can-outline" />
                </button>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="9" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- pagination -->
      <div class="px-5 py-4 flex items-center justify-between">
        <button :disabled="!page.prev" @click="go(page.current - 1)"
          class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">
          Prev
        </button>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ page.current || 1 }} / {{ page.last || 1 }}
        </div>
        <button :disabled="!page.next" @click="go(page.current + 1)"
          class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">
          Next
        </button>
      </div>
    </div>

    <!-- modal -->
    <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">
          {{ modal.mode === 'create' ? 'New Customer' : 'Edit Customer' }}
        </h3>
        <div class="grid md:grid-cols-2 gap-3">
          <FormInput v-model="form.code" label="Code" :required="true" />
          <FormInput v-model="form.name" label="Name" :required="true" />
          <FormInput v-model="form.email" label="Email" type="email" />
          <FormInput v-model="form.phone" label="Phone" />
          <FormInput v-model="form.address" label="Address" />
          <FormInput v-model.number="form.payment_term_id" label="Payment Term ID" placeholder="e.g. 1" />
          <FormInput v-model.number="form.credit_limit" label="Credit Limit" type="number" />
          <div class="flex items-center gap-2 mt-2">
            <input id="is_active" type="checkbox" v-model="form.is_active"
              class="w-4 h-4 rounded border dark:border-gray-600 dark:bg-gray-800" />
            <label for="is_active" class="text-sm dark:text-gray-300">Active</label>
          </div>
        </div>
        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>
        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open = false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="save()" :disabled="saving"
            class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { Icon } from "@iconify/vue";

export default {
  name: "Customers",
  components: { Icon },

  data() {
    return {
      loading: false,
      rows: [],
      stats: { total: 0, active: 0, inactive: 0, withCredit: 0 },
      q: { page: 1, perPage: 10, search: "", active: "" },
      page: { current: 1, last: 1, total: 0, from: 0, to: 0, prev: false, next: false },
      modal: { open: false, mode: "create" },
      form: {
        id: null,
        code: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        payment_term_id: null,
        credit_limit: 0,
        is_active: true,
      },
      saving: false,
      error: "",
      fieldErrors: {}, // untuk pesan error per field (422)
    };
  },

  mounted() {
    this.reload();
  },

  methods: {
    /* ========= Base URL resolver ========= */
    resolveBaseUrl() {
      const raw =
        import.meta?.env?.VITE_API_BASE ||
        process?.env?.VUE_APP_API_BASE ||
        "http://localhost:8000";
      return String(raw).trim().replace(/\/+$/, "");
    },

    /* ========= Axios instance (Bearer token) ========= */
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
          const status = err?.response?.status;
          if (status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/auth/login";
          }
          return Promise.reject(err);
        }
      );

      return instance;
    },

    /* ========= Helpers ========= */
    // HANYA kirim field yang diizinkan ke Laravel, dengan tipe yang benar
    toPayload() {
      const t = (v) => (typeof v === "string" ? v.trim() : v);
      return {
        code: t(this.form.code),
        name: t(this.form.name),
        email: t(this.form.email) || null,
        phone: t(this.form.phone) || null,
        address: t(this.form.address) || null,
        payment_term_id:
          this.form.payment_term_id === "" || this.form.payment_term_id == null
            ? null
            : Number(this.form.payment_term_id),
        credit_limit:
          this.form.credit_limit === "" || this.form.credit_limit == null
            ? 0
            : Number(this.form.credit_limit),
        is_active: this.form.is_active ? 1 : 0, // penting: 1/0 untuk MySQL tinyint
      };
    },

    formatNumber(n) {
      return Number(n || 0).toLocaleString("id-ID");
    },

    /* ========= Load (index) ========= */
    async reload() {
      this.loading = true;
      this.error = "";
      this.fieldErrors = {};
      try {
        const paramsRaw = {
          page: this.q.page,
          per_page: this.q.perPage,
          search: this.q.search,
          active: this.q.active, // "" | "1" | "0"
        };
        const params = Object.fromEntries(
          Object.entries(paramsRaw).filter(([key, val]) => {
            if (val === null || val === undefined) return false;
            if (key === "search") return String(val).trim().length > 0;
            if (key === "active") return val === "0" || val === "1";
            return true;
          })
        );

        const { data } = await this.api().get("/customers", { params });

        const rawRows = Array.isArray(data?.data) ? data.data : [];
        // Normalisasi data dari API → untuk tampilan
        this.rows = rawRows.map((r) => ({
          ...r,
          is_active: r.is_active === 1 || r.is_active === "1" || r.is_active === true,
          credit_limit: Number(r.credit_limit || 0),
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

        // Statistik berbasis halaman aktif (bisa diubah ke server-side kalau perlu)
        this.stats.total = this.page.total;
        this.stats.active = this.rows.filter((x) => x.is_active).length;
        this.stats.inactive = this.rows.filter((x) => !x.is_active).length;
        this.stats.withCredit = this.rows.filter((x) => Number(x.credit_limit) > 0).length;
      } catch (e) {
        this.error = "Gagal memuat data pelanggan";
        if (e?.response?.data?.message) this.error += `: ${e.response.data.message}`;
      } finally {
        this.loading = false;
      }
    },

    /* ========= Pagination ========= */
    go(p) {
      this.q.page = Math.max(1, p);
      this.reload();
    },

    /* ========= Create/Edit ========= */
    openCreate() {
      this.modal = { open: true, mode: "create" };
      this.error = "";
      this.fieldErrors = {};
      this.form = {
        id: null,
        code: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        payment_term_id: null,
        credit_limit: 0,
        is_active: true,
      };
    },

    openEdit(row) {
      this.modal = { open: true, mode: "edit" };
      this.error = "";
      this.fieldErrors = {};
      // Ambil hanya field yang relevan ke form (hindari payment_term_name dll.)
      this.form = {
        id: row.id,
        code: row.code || "",
        name: row.name || "",
        email: row.email || "",
        phone: row.phone || "",
        address: row.address || "",
        payment_term_id:
          row.payment_term_id === "" || row.payment_term_id == null
            ? null
            : Number(row.payment_term_id),
        credit_limit: Number(row.credit_limit || 0),
        is_active: row.is_active === true || row.is_active === 1 || row.is_active === "1",
      };
    },

    /* ========= Save (store/update) ========= */
    async save() {
      this.saving = true;
      this.error = "";
      this.fieldErrors = {};

      // Validasi minimal di sisi UI
      if (!String(this.form.code || "").trim() || !String(this.form.name || "").trim()) {
        this.saving = false;
        this.error = "Code dan Name wajib diisi.";
        return;
      }

      try {
        const payload = this.toPayload();
        if (this.modal.mode === "create") {
          await this.api().post("/customers", payload);
        } else {
          await this.api().put(`/customers/${this.form.id}`, payload);
        }
        this.modal.open = false;
        await this.reload();
      } catch (e) {
        // Tampilkan pesan error dari Laravel (422 validation)
        if (e?.response?.status === 422) {
          const errs = e.response.data?.errors || {};
          this.fieldErrors = errs;
          const firstMsg =
            Object.values(errs)[0]?.[0] || e.response.data?.message || "Validasi gagal";
          this.error = firstMsg;
        } else {
          this.error = e?.response?.data?.message || "Gagal menyimpan data";
        }
      } finally {
        this.saving = false;
      }
    },

    /* ========= Delete ========= */
    async confirmDelete(row) {
      if (!confirm(`Yakin ingin menghapus ${row.name}?`)) return;
      try {
        await this.api().delete(`/customers/${row.id}`);
        await this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal menghapus data";
      }
    },
  },
};
</script>