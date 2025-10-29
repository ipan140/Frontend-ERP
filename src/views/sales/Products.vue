<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">sales</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Products</h1>
      </div>

      <div class="flex flex-wrap gap-2">
        <input
          v-model="q.search"
          @keyup.enter="reload()"
          class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search SKU/Name…"
        />
        <button
          @click="reload()"
          class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5"
        >
          Search
        </button>
        <button
          @click="openCreate()"
          class="bg-primary border flex items-center gap-2 text-white hover:bg-primary/80 dark:border-gray-700 rounded py-2.5 px-5"
        >
          <span class="text-xl leading-none">＋</span>
          <span>New Product</span>
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
              <th class="px-6 py-3">SKU</th>
              <th class="px-6 py-3">Name</th>
              <th class="px-6 py-3">UoM</th>
              <th class="px-6 py-3 text-right">Base Price</th>
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
              <td class="px-6 py-3 font-mono">{{ r.sku || ('PRD'+r.id) }}</td>
              <td class="px-6 py-3">{{ r.name }}</td>
              <td class="px-6 py-3">{{ r.uom || '-' }}</td>
              <td class="px-6 py-3 text-right">Rp{{ formatNumber(r.base_price) }}</td>
              <td class="px-6 py-3">
                <span v-if="r.active"
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
              <td colspan="6" class="px-6 py-6 text-center text-gray-400">No data</td>
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

    <!-- View Modal (read-only) -->
    <div v-if="view.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="view.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-xl p-6">
        <div class="flex items-start justify-between">
          <h3 class="text-lg font-semibold dark:text-gray-200">Product Details</h3>
          <button class="px-3 py-1 rounded border dark:border-gray-600" @click="view.open=false">Close</button>
        </div>

        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <div class="text-gray-500 dark:text-gray-400">SKU</div>
            <div class="font-medium">{{ view.row.sku || '-' }}</div>
          </div>
          <div>
            <div class="text-gray-500 dark:text-gray-400">Name</div>
            <div class="font-medium">{{ view.row.name || '-' }}</div>
          </div>
          <div>
            <div class="text-gray-500 dark:text-gray-400">UoM</div>
            <div class="font-medium">{{ view.row.uom || '-' }}</div>
          </div>
          <div>
            <div class="text-gray-500 dark:text-gray-400">Base Price</div>
            <div class="font-medium">Rp{{ formatNumber(view.row.base_price) }}</div>
          </div>
          <div>
            <div class="text-gray-500 dark:text-gray-400">Active</div>
            <div class="font-medium">
              <span v-if="view.row.active" class="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Active</span>
              <span v-else class="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Inactive</span>
            </div>
          </div>
          <div v-if="view.extra.created_at">
            <div class="text-gray-500 dark:text-gray-400">Created</div>
            <div class="font-medium">{{ view.extra.created_at }}</div>
          </div>
          <div v-if="view.extra.updated_at">
            <div class="text-gray-500 dark:text-gray-400">Updated</div>
            <div class="font-medium">{{ view.extra.updated_at }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit/Create Modal -->
    <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>

      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">
          {{ modal.mode === 'create' ? 'New Product' : 'Edit Product' }}
        </h3>

        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">SKU<span class="text-red-500">*</span></label>
            <input v-model="form.sku" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.sku" class="text-xs text-red-500 mt-1">{{ fieldErrors.sku[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Name<span class="text-red-500">*</span></label>
            <input v-model="form.name" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.name" class="text-xs text-red-500 mt-1">{{ fieldErrors.name[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">UoM</label>
            <input v-model="form.uom" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="pcs / botol / paket / kg …" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Base Price (Rp)<span class="text-red-500">*</span></label>
            <input type="number" min="0" step="1" v-model.number="form.base_price" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.base_price" class="text-xs text-red-500 mt-1">{{ fieldErrors.base_price[0] }}</p>
          </div>

          <div class="md:col-span-2 flex items-center gap-2 mt-2">
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

    <!-- Fallback toast -->
    <div v-if="error" class="fixed bottom-4 right-4 bg-red-600 text-white text-sm px-4 py-3 rounded shadow">
      {{ error }}
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Swal from "sweetalert2";

export default {
  name: "Products",
  data() {
    return {
      loading: false,
      rows: [],
      q: { page: 1, perPage: 10, search: "", active: "" },
      page: { current: 1, last: 1, total: 0, from: 0, to: 0, prev: false, next: false },

      /* View state */
      view: { open: false, row: {}, extra: {} },

      /* Edit/Create state */
      modal: { open: false, mode: "create" },
      form: { id: null, sku: "", name: "", uom: "", base_price: 0, active: true },

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
      const T = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
      });
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

    formatNumber(n) { return Number(n || 0).toLocaleString("id-ID"); },
    cleanParams(raw) {
      const p = { ...raw };
      if (p.active !== "0" && p.active !== "1") delete p.active;
      if (!String(p.search || "").trim()) delete p.search;
      return p;
    },

    /* Load */
    async reload() {
      this.loading = true; this.error = ""; this.fieldErrors = {};
      try {
        const params = this.cleanParams({
          page: this.q.page, per_page: this.q.perPage, search: this.q.search, active: this.q.active,
        });
        const { data } = await this.api().get("/products", { params });
        const rows = Array.isArray(data?.data) ? data.data : [];
        this.rows = rows.map((r) => ({
          ...r,
          base_price: Number(r.base_price || 0),
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
        this.error = e?.response?.data?.message || "Gagal memuat data produk";
        this.toast("error", this.error);
      } finally { this.loading = false; }
    },

    /* Pagination */
    go(p) { this.q.page = Math.max(1, p); this.reload(); },

    /* View */
    async openView(row) {
      // kalau ada endpoint show /products/:id, ambil detail/relasi; else tampilkan data row
      try {
        const { data } = await this.api().get(`/products/${row.id}`);
        const r = data?.data || data || row;
        this.view = {
          open: true,
          row: {
            id: r.id,
            sku: r.sku,
            name: r.name,
            uom: r.uom,
            base_price: Number(r.base_price || 0),
            active: r.active === 1 || r.active === "1" || r.active === true,
          },
          extra: {
            created_at: r.created_at || null,
            updated_at: r.updated_at || null,
          },
        };
      } catch {
        // fallback kalau /show tidak ada
        this.view = { open: true, row, extra: {} };
      }
    },

    /* Modal Edit/Create */
    openCreate() {
      this.modal = { open: true, mode: "create" };
      this.error = ""; this.fieldErrors = {};
      this.form = { id: null, sku: "", name: "", uom: "", base_price: 0, active: true };
    },
    openEdit(row) {
      this.modal = { open: true, mode: "edit" };
      this.error = ""; this.fieldErrors = {};
      this.form = {
        id: row.id,
        sku: row.sku || "",
        name: row.name || "",
        uom: row.uom || "",
        base_price: Number(row.base_price || 0),
        active: !!row.active,
      };
    },

    toPayload() {
      return {
        sku: (this.form.sku || "").trim(),
        name: (this.form.name || "").trim(),
        uom: (this.form.uom || "").trim() || null,
        base_price: Number(this.form.base_price || 0),
        active: this.form.active ? 1 : 0,
      };
    },

    /* Save */
    async save() {
      this.saving = true; this.error = ""; this.fieldErrors = {};

      if (!String(this.form.sku || "").trim()) { this.saving = false; this.toast("warning","SKU wajib diisi."); this.error="SKU wajib diisi."; return; }
      if (!String(this.form.name || "").trim()) { this.saving = false; this.toast("warning","Name wajib diisi."); this.error="Name wajib diisi."; return; }
      if (Number(this.form.base_price) < 0) { this.saving = false; this.toast("warning","Base price tidak boleh negatif."); this.error="Base price tidak boleh negatif."; return; }

      try {
        const payload = this.toPayload();
        if (this.modal.mode === "create") {
          await this.api().post("/products", payload);
          this.toast("success", "Product created");
        } else {
          await this.api().put(`/products/${this.form.id}`, payload);
          this.toast("success", "Product updated");
        }
        this.modal.open = false;
        await this.reload();
      } catch (e) {
        if (e?.response?.status === 422) {
          this.fieldErrors = e.response.data?.errors || {};
          const msg = Object.values(this.fieldErrors)[0]?.[0] || e.response.data?.message || "Validasi gagal";
          this.error = msg; this.toast("error", msg);
        } else {
          this.error = e?.response?.data?.message || "Gagal menyimpan produk";
          this.toast("error", this.error);
        }
      } finally { this.saving = false; }
    },

    /* Delete */
    async confirmDelete(row) {
      const res = await Swal.fire({
        title: "Delete product?",
        text: `Hapus produk "${row.name}" permanen.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        confirmButtonColor: "#ef4444",
      });
      if (!res.isConfirmed) return;

      this.saving = true; this.error = "";
      try {
        await this.api().delete(`/products/${row.id}`);
        this.toast("success", "Product deleted");
        await this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal menghapus produk";
        this.toast("error", this.error);
      } finally { this.saving = false; }
    },
  },
};
</script>
