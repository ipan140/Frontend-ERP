<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">sales</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">
          Quotation Items
          <span v-if="header.number" class="text-gray-400 text-base">— {{ header.number }}</span>
        </h1>
        <p v-if="header.customer" class="text-gray-500 mt-1">Customer: {{ header.customer }}</p>
      </div>
      <div class="flex gap-2">
        <button
          @click="$router.push({ name: 'Quotations' })"
          class="border rounded-md px-4 py-2 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        >
          ← Back to Quotations
        </button>
        <button
          @click="openCreate()"
          class="bg-primary border flex gap-2 items-center text-white hover:bg-primary/80 dark:border-gray-700 rounded-md py-2.5 px-5"
        >
          <span class="text-2xl leading-none">＋</span>
          <span>New Item</span>
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 flex items-center justify-between">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ rows.length }} item(s)
        </div>
        <div class="text-right">
          <div class="text-xs text-gray-400">Grand Total</div>
          <div class="text-lg font-semibold">Rp{{ fm(grandTotal) }}</div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3 w-20">#ID</th>
              <th class="px-6 py-3">Product</th>
              <th class="px-6 py-3">Description</th>
              <th class="px-6 py-3 text-right">Qty</th>
              <th class="px-6 py-3">UoM</th>
              <th class="px-6 py-3 text-right">Unit Price</th>
              <th class="px-6 py-3 text-right">Disc %</th>
              <th class="px-6 py-3 text-right">Line Total</th>
              <th class="px-6 py-3 text-right w-44">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3 font-mono text-xs">#{{ r.id }}</td>
              <td class="px-6 py-3">{{ r.product_name || r.product_id }}</td>
              <td class="px-6 py-3">{{ r.description || '-' }}</td>
              <td class="px-6 py-3 text-right">{{ nf(r.qty) }}</td>
              <td class="px-6 py-3">{{ r.uom || '-' }}</td>
              <td class="px-6 py-3 text-right">Rp{{ fm(r.unit_price) }}</td>
              <td class="px-6 py-3 text-right">{{ nf(r.discount_pct) }}%</td>
              <td class="px-6 py-3 text-right font-medium">Rp{{ fm(r.line_total) }}</td>
              <td class="px-6 py-3 text-right space-x-2">
                <button @click="openView(r)" class="px-3 py-1.5 rounded-md border dark:border-gray-600">View</button>
                <button @click="openEdit(r)" class="px-3 py-1.5 rounded-md border dark:border-gray-600">Edit</button>
                <button @click="confirmDelete(r)" :disabled="saving" class="px-3 py-1.5 rounded-md border dark:border-gray-600">Delete</button>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="9" class="px-6 py-6 text-center text-gray-400">No items</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- View Modal (read-only) -->
    <div v-if="view.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="view.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-xl p-5">
        <div class="flex items-start justify-between">
          <h3 class="text-lg font-semibold dark:text-gray-200">Item Details</h3>
          <button class="px-3 py-1 rounded-md border dark:border-gray-600" @click="view.open=false">Close</button>
        </div>

        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><div class="text-gray-500 dark:text-gray-400">ID</div><div class="font-medium">#{{ view.row.id }}</div></div>
          <div><div class="text-gray-500 dark:text-gray-400">Product</div><div class="font-medium">{{ view.row.product_name || view.row.product_id || '-' }}</div></div>
          <div class="sm:col-span-2"><div class="text-gray-500 dark:text-gray-400">Description</div><div class="font-medium whitespace-pre-line">{{ view.row.description || '-' }}</div></div>
          <div><div class="text-gray-500 dark:text-gray-400">Qty</div><div class="font-medium">{{ nf(view.row.qty) }}</div></div>
          <div><div class="text-gray-500 dark:text-gray-400">UoM</div><div class="font-medium">{{ view.row.uom || '-' }}</div></div>
          <div><div class="text-gray-500 dark:text-gray-400">Unit Price</div><div class="font-medium">Rp{{ fm(view.row.unit_price) }}</div></div>
          <div><div class="text-gray-500 dark:text-gray-400">Discount</div><div class="font-medium">{{ nf(view.row.discount_pct) }}%</div></div>
          <div class="sm:col-span-2"><div class="text-gray-500 dark:text-gray-400">Line Total</div><div class="font-medium">Rp{{ fm(view.row.line_total) }}</div></div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold dark:text-gray-200">
            {{ modal.mode === 'create' ? 'Add Item' : `Edit Item #${form.id}` }}
          </h3>
          <button class="px-3 py-1 rounded-md border dark:border-gray-600" @click="modal.open=false">Close</button>
        </div>

        <!-- Kolom sama persis seperti tabel -->
        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Product ID<span class="text-red-500">*</span></label>
            <input v-model.number="form.product_id" type="number" min="1"
                   class="w-full border dark:border-gray-700 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
                   placeholder="e.g. 1" />
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Description</label>
            <input v-model="form.description"
                   class="w-full border dark:border-gray-700 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
                   placeholder="optional" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Qty</label>
            <input v-model.number="form.qty" type="number" step="0.001" min="0"
                   class="w-full border dark:border-gray-700 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">UoM</label>
            <input v-model="form.uom"
                   class="w-full border dark:border-gray-700 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
                   placeholder="pcs/pack/bag" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Unit Price (Rp)</label>
            <input v-model.number="form.unit_price" type="number" step="0.01" min="0"
                   class="w-full border dark:border-gray-700 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Discount (%)</label>
            <input v-model.number="form.discount_pct" type="number" step="0.01" min="0" max="100"
                   class="w-full border dark:border-gray-700 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Line Total (auto)</label>
            <input :value="calcLineTotal"
                   disabled
                   class="w-full border dark:border-gray-700 rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-900/50 dark:text-gray-300" />
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>
        <div v-if="hasFieldErrors" class="mt-2 text-sm text-red-400 space-y-1">
          <div v-for="(arr, key) in fieldErrors" :key="key">{{ key }}: {{ arr?.[0] }}</div>
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open = false" class="px-4 py-2 rounded-md border dark:border-gray-600">Cancel</button>
          <button @click="save()" :disabled="saving" class="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="fixed left-0 right-0 top-0 h-1 bg-primary animate-pulse"></div>
  </div>
</template>

<script>
import axios from "axios";
import Swal from "sweetalert2";

export default {
  name: "QuotationItems",
  data() {
    return {
      qid: Number(this.$route.params.id),
      header: { number: "", customer: "" },
      loading: false,
      rows: [],
      view: { open: false, row: {} },
      modal: { open: false, mode: "create" },
      form: this.emptyForm(),
      saving: false,
      error: "",
      fieldErrors: {},
    };
  },
  computed: {
    hasFieldErrors() { return this.fieldErrors && Object.keys(this.fieldErrors).length > 0; },
    calcLineTotal() {
      const qty = Number(this.form.qty || 0);
      const price = Number(this.form.unit_price || 0);
      const disc = Number(this.form.discount_pct || 0);
      return (qty * price * (1 - disc / 100)).toFixed(2);
    },
    grandTotal() {
      return this.rows.reduce((s, r) => s + Number(r.line_total || 0), 0);
    },
  },
  watch: {
    calcLineTotal(n) { this.form.line_total = Number(n); },
  },
  mounted() {
    this.fetchHeader();
    this.reload();
  },
  methods: {
    toast(icon, title) {
      const T = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 1700, timerProgressBar: true });
      T.fire({ icon, title });
    },

    emptyForm() {
      return { id:null, quotation_id:this.qid, product_id:null, description:"", qty:1, uom:"pcs", unit_price:0, discount_pct:0, line_total:0 };
    },

    resolveBaseUrl() {
      const raw = import.meta?.env?.VITE_API_BASE || process?.env?.VUE_APP_API_BASE || "http://localhost:8000";
      return String(raw).trim().replace(/\/+$/, "");
    },

    api() {
      const token = localStorage.getItem("token");
      const API_BASE = this.resolveBaseUrl();
      const instance = axios.create({
        baseURL: `${API_BASE}/api`,
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      // Auto prefix ke /sales/*
      instance.interceptors.request.use((cfg) => {
        if (typeof cfg.url === "string") {
          if (cfg.url.startsWith("/quotations")) cfg.url = "/sales" + cfg.url;
          if (cfg.url.startsWith("/quotation-items")) cfg.url = "/sales" + cfg.url;
        }
        return cfg;
      });
      instance.interceptors.response.use(
        (res) => res,
        (err) => {
          if (err?.response?.status === 401) {
            localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/auth/login";
          }
          return Promise.reject(err);
        }
      );
      return instance;
    },

    fm(n) { return Number(n || 0).toLocaleString("id-ID"); },
    nf(n) { return Number(n || 0).toLocaleString("id-ID", { maximumFractionDigits: 3 }); },

    async fetchHeader() {
      try {
        const { data } = await this.api().get(`/quotations/${this.qid}`);
        const d = data?.data || data || {};
        this.header.number = d.number || `#${this.qid}`;
        this.header.customer = d.customer_name || d?.customer?.name || "";
      } catch { this.header.number = `#${this.qid}`; }
    },

    async reload() {
      this.loading = true; this.error = ""; this.fieldErrors = {};
      try {
        const { data } = await this.api().get("/quotation-items", { params: { quotation_id: this.qid } });
        const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        this.rows = list.map((r) => ({
          ...r,
          qty: Number(r.qty || 0),
          unit_price: Number(r.unit_price || 0),
          discount_pct: Number(r.discount_pct || 0),
          line_total: Number(r.line_total || 0),
        }));
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal memuat items";
        this.toast("error", this.error);
      } finally { this.loading = false; }
    },

    openCreate() {
      this.modal = { open: true, mode: "create" };
      this.error = ""; this.fieldErrors = {}; this.form = this.emptyForm();
    },
    openEdit(row) {
      this.modal = { open: true, mode: "edit" };
      this.error = ""; this.fieldErrors = {};
      this.form = {
        id: row.id, quotation_id: this.qid,
        product_id: row.product_id || null, description: row.description || "",
        qty: Number(row.qty || 0), uom: row.uom || "pcs",
        unit_price: Number(row.unit_price || 0), discount_pct: Number(row.discount_pct || 0),
        line_total: Number(row.line_total || 0),
      };
    },
    async openView(row) {
      try {
        const { data } = await this.api().get(`/quotation-items/${row.id}`);
        const r = data?.data || data || row;
        this.view = { open: true, row: {
          id: r.id,
          product_id: r.product_id,
          product_name: r.product_name,
          description: r.description,
          qty: Number(r.qty || 0),
          uom: r.uom || "pcs",
          unit_price: Number(r.unit_price || 0),
          discount_pct: Number(r.discount_pct || 0),
          line_total: Number(r.line_total || 0),
        }};
      } catch { this.view = { open: true, row }; }
    },

    toPayload() {
      const t = (v) => (typeof v === "string" ? v.trim() : v);
      return {
        quotation_id: this.qid,
        product_id: this.form.product_id === "" || this.form.product_id == null ? null : Number(this.form.product_id),
        description: t(this.form.description) || null,
        qty: Number(this.form.qty || 0),
        uom: t(this.form.uom) || null,
        unit_price: Number(this.form.unit_price || 0),
        discount_pct: Number(this.form.discount_pct || 0),
        line_total: Number(this.calcLineTotal || this.form.line_total || 0),
      };
    },

    async save() {
      if (this.saving) return;
      this.saving = true; this.error = ""; this.fieldErrors = {};

      // Validasi ringan
      if (!this.form.product_id) { this.saving = false; this.toast("warning","Product ID wajib diisi."); this.error="Product ID wajib diisi."; return; }
      if (Number(this.form.qty) <= 0) { this.saving = false; this.toast("warning","Qty harus > 0."); this.error="Qty harus > 0."; return; }
      if (Number(this.form.unit_price) < 0) { this.saving = false; this.toast("warning","Unit price tidak boleh negatif."); this.error="Unit price tidak boleh negatif."; return; }
      if (Number(this.form.discount_pct) < 0 || Number(this.form.discount_pct) > 100) { this.saving = false; this.toast("warning","Discount harus 0–100%."); this.error="Discount harus 0–100%."; return; }

      try {
        const payload = this.toPayload();
        if (this.modal.mode === "create") {
          await this.api().post("/quotation-items", payload);
          this.toast("success", "Item added");
        } else {
          await this.api().put(`/quotation-items/${this.form.id}`, payload);
          this.toast("success", "Item updated");
        }
        this.modal.open = false;
        await this.reload();
      } catch (e) {
        if (e?.response?.status === 422) {
          this.fieldErrors = e.response.data?.errors || {};
          this.error = Object.values(this.fieldErrors)?.[0]?.[0] || e.response.data?.message || "Validasi gagal";
        } else {
          this.error = e?.response?.data?.message || "Gagal menyimpan item";
        }
        this.toast("error", this.error);
      } finally { this.saving = false; }
    },

    async confirmDelete(row) {
      const res = await Swal.fire({
        title: "Delete item?",
        text: `Hapus item #${row.id} permanen.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        buttonsStyling: false,
        customClass: {
          popup: "rounded-md",
          confirmButton: "rounded-md bg-red-500 text-white px-4 py-2 hover:bg-red-600 focus:ring-2 focus:ring-red-400",
          cancelButton: "rounded-md border border-gray-300 px-4 py-2 ml-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50",
        },
      });
      if (!res.isConfirmed) return;

      try {
        await this.api().delete(`/quotation-items/${row.id}`);
        this.toast("success", "Item deleted");
        await this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal menghapus item";
        this.toast("error", this.error);
      }
    },
  },
};
</script>
