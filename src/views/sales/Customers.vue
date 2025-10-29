<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">master</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Customers</h1>
      </div>

      <div class="flex gap-2 w-full lg:w-auto">
        <input
          v-model="q.search"
          @keyup.enter="reload()"
          class="flex-1 lg:flex-none border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search code/name/email…"
        />
        <button
          @click="reload()"
          class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5"
        >
          Search
        </button>
        <button
          @click="openCreate()"
          class="inline-flex items-center justify-center gap-2 bg-primary text-white rounded py-2.5 px-5 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[.98] transition"
          title="Create new customer"
        >
          <Icon icon="ic:round-add" class="text-xl" />
          <span class="font-medium">New Customer</span>
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
              <th class="px-6 py-3">Code</th>
              <th class="px-6 py-3">Name</th>
              <th class="px-6 py-3">Email</th>
              <th class="px-6 py-3">Phone</th>
              <th class="px-6 py-3">Address</th>
              <th class="px-6 py-3">Payment Term</th>
              <th class="px-6 py-3 text-right">Credit Limit</th>
              <th class="px-6 py-3">Active</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="r in rows"
              :key="r.id"
              class="bg-white dark:bg-gray-800 border-b dark:border-gray-700"
            >
              <td class="px-6 py-3 font-mono">{{ r.code }}</td>
              <td class="px-6 py-3">{{ r.name }}</td>
              <td class="px-6 py-3">{{ r.email || '-' }}</td>
              <td class="px-6 py-3">{{ r.phone || '-' }}</td>
              <td class="px-6 py-3 truncate max-w-[280px]" :title="r.address">{{ r.address || '-' }}</td>
              <td class="px-6 py-3">{{ r.payment_term_name || r.payment_term_id || '-' }}</td>
              <td class="px-6 py-3 text-right">Rp{{ formatNumber(r.credit_limit) }}</td>
              <td class="px-6 py-3">
                <span v-if="r.is_active"
                      class="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Active</span>
                <span v-else
                      class="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Inactive</span>
              </td>
              <td class="px-6 py-3 text-right space-x-2">
                <button
                  @click="openView(r)"
                  class="px-2 py-1 rounded border dark:border-gray-600"
                  title="View"
                >
                  View
                </button>
                <button
                  @click="openEdit(r)"
                  class="px-2 py-1 rounded border dark:border-gray-600"
                  title="Edit"
                >
                  Edit
                </button>
                <button
                  @click="confirmDelete(r)"
                  class="px-2 py-1 rounded border dark:border-gray-600"
                  :disabled="saving"
                  title="Delete"
                >
                  Delete
                </button>
              </td>
            </tr>

            <tr v-if="!loading && !rows.length">
              <td colspan="9" class="px-6 py-6 text-center text-gray-400">No data</td>
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

    <!-- Modal: Create/Edit -->
    <div v-if="modal.open && modal.mode !== 'view'" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">
          {{ modal.mode === 'create' ? 'New Customer' : 'Edit Customer' }}
        </h3>

        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Code<span class="text-red-500">*</span></label>
            <input v-model="form.code" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.code" class="text-xs text-red-500 mt-1">{{ fieldErrors.code[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Name<span class="text-red-500">*</span></label>
            <input v-model="form.name" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.name" class="text-xs text-red-500 mt-1">{{ fieldErrors.name[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Email</label>
            <input v-model="form.email" type="email" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.email" class="text-xs text-red-500 mt-1">{{ fieldErrors.email[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Phone</label>
            <input v-model="form.phone" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Address</label>
            <input v-model="form.address" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Payment Term ID</label>
            <input v-model.number="form.payment_term_id" type="number" min="1"
                   class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
                   placeholder="e.g. 1" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Credit Limit (Rp)</label>
            <input v-model.number="form.credit_limit" type="number" min="0" step="1"
                   class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>

          <div class="md:col-span-2 flex items-center gap-2 mt-2">
            <input id="is_active" type="checkbox" v-model="form.is_active"
                   class="w-4 h-4 rounded border dark:border-gray-600 dark:bg-gray-800" />
            <label for="is_active" class="text-sm dark:text-gray-300">Active</label>
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

    <!-- Modal: View -->
    <div v-if="modal.open && modal.mode === 'view'" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Customer Detail</h3>
        <div class="grid md:grid-cols-2 gap-3 text-sm">
          <p><span class="text-gray-500">Code:</span> {{ form.code }}</p>
          <p><span class="text-gray-500">Name:</span> {{ form.name }}</p>
          <p class="md:col-span-2"><span class="text-gray-500">Email:</span> {{ form.email || '-' }}</p>
          <p class="md:col-span-2"><span class="text-gray-500">Phone:</span> {{ form.phone || '-' }}</p>
          <p class="md:col-span-2"><span class="text-gray-500">Address:</span> {{ form.address || '-' }}</p>
          <p><span class="text-gray-500">Payment Term:</span> {{ form.payment_term_id || '-' }}</p>
          <p><span class="text-gray-500">Credit Limit:</span> Rp{{ formatNumber(form.credit_limit) }}</p>
          <p class="md:col-span-2">
            <span class="text-gray-500">Status:</span>
            <span v-if="form.is_active" class="ml-1 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">Active</span>
            <span v-else class="ml-1 px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">Inactive</span>
          </p>
        </div>
        <div class="mt-5 flex justify-end">
          <button @click="modal.open = false" class="px-4 py-2 rounded border dark:border-gray-600">Close</button>
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
  name: "Customers",
  components: { Icon },

  data() {
    return {
      loading: false,
      rows: [],
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
      fieldErrors: {},
    };
  },

  mounted() {
    this.reload();
  },

  methods: {
    toast(icon, title) {
      const T = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 1500, timerProgressBar: true });
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

    formatNumber(n) {
      return Number(n || 0).toLocaleString("id-ID");
    },
    cleanParams(raw) {
      const p = { ...raw };
      if (p.active !== "0" && p.active !== "1") delete p.active;
      if (!String(p.search || "").trim()) delete p.search;
      return p;
    },
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
        is_active: this.form.is_active ? 1 : 0,
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
        });

        const { data } = await this.api().get("/customers", { params });

        const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.rows = rows.map((r) => ({
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
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal memuat data pelanggan";
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
    openView(row) {
      this.modal = { open: true, mode: "view" };
      this.form = {
        id: row.id,
        code: row.code,
        name: row.name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        payment_term_id: row.payment_term_id,
        credit_limit: Number(row.credit_limit || 0),
        is_active: row.is_active,
      };
    },

    async save() {
      this.saving = true;
      this.error = "";
      this.fieldErrors = {};

      if (!String(this.form.code || "").trim()) {
        this.saving = false;
        this.error = "Code wajib diisi.";
        return;
      }
      if (!String(this.form.name || "").trim()) {
        this.saving = false;
        this.error = "Name wajib diisi.";
        return;
      }
      if (Number(this.form.credit_limit) < 0) {
        this.saving = false;
        this.error = "Credit limit tidak boleh negatif.";
        return;
      }

      try {
        const payload = this.toPayload();
        if (this.modal.mode === "create") {
          await this.api().post("/customers", payload);
          this.toast("success", "Customer created");
        } else {
          await this.api().put(`/customers/${this.form.id}`, payload);
          this.toast("success", "Customer updated");
        }
        this.modal.open = false;
        await this.reload();
      } catch (e) {
        if (e?.response?.status === 422) {
          this.fieldErrors = e.response.data?.errors || {};
          this.error =
            Object.values(this.fieldErrors)[0]?.[0] ||
            e.response.data?.message ||
            "Validasi gagal";
          this.toast("error", this.error);
        } else {
          this.error = e?.response?.data?.message || "Gagal menyimpan customer";
          this.toast("error", this.error);
        }
      } finally {
        this.saving = false;
      }
    },

    async confirmDelete(row) {
      const res = await Swal.fire({
        title: `Hapus "${row.name}"?`,
        text: "Tindakan ini tidak dapat dibatalkan.",
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
        await this.api().delete(`/customers/${row.id}`);
        this.toast("success", "Deleted");
        await this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal menghapus customer";
        this.toast("error", this.error);
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>
