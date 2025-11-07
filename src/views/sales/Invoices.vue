<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">sales</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Invoices</h1>
      </div>

      <div class="flex flex-wrap gap-2">
        <!-- Search -->
        <div class="flex items-center gap-2">
          <input
            v-model="q.search"
            @keyup.enter="reload()"
            class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
            placeholder="Search number/customer…"
          />
          <button
            @click="reload()"
            class="p-2 rounded border dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Search"
            aria-label="Search"
          >
            <Icon icon="mdi:magnify" class="text-[20px]" />
          </button>
        </div>

        <!-- New Invoice ONLY -->
        <button
          @click="openCreate()"
          class="flex items-center gap-2 p-2 rounded bg-primary text-white hover:bg-primary/80"
          title="Create new invoice"
        >
          <Icon icon="mdi:plus" class="text-[20px]" />
          <span class="hidden sm:inline">New Invoice</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 flex flex-wrap gap-3 items-center justify-between">
        <div class="flex flex-wrap gap-3 items-center">
          <div class="flex items-center gap-2">
            <label class="text-sm dark:text-gray-300">Status</label>
            <select
              v-model="q.status"
              @change="reload()"
              class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">All</option>
              <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
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

      <!-- Desktop Table -->
      <div class="overflow-x-auto hidden md:block">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">Number</th>
              <th class="px-6 py-3">Customer</th>
              <th class="px-6 py-3">Order #</th>
              <th class="px-6 py-3 text-right">Subtotal</th>
              <th class="px-6 py-3 text-right">Tax</th>
              <th class="px-6 py-3 text-right">Grand Total</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3 font-mono">{{ r.number || ('INV-' + r.id) }}</td>
              <td class="px-6 py-3">{{ r.customer_name || r.customer?.name || ('#' + r.customer_id) }}</td>
              <td class="px-6 py-3"><span class="font-mono">{{ r.order_number || ('SO-' + (r.order_id ?? '-')) }}</span></td>
              <td class="px-6 py-3 text-right">Rp{{ fm(r.subtotal) }}</td>
              <td class="px-6 py-3 text-right">Rp{{ fm(r.tax_total) }}</td>
              <td class="px-6 py-3 text-right font-semibold">Rp{{ fm(r.grand_total) }}</td>
              <td class="px-6 py-3"><span :class="statusBadge(r.status)">{{ titleCase(r.status || 'draft') }}</span></td>
              <td class="px-6 py-3 text-right whitespace-nowrap space-x-1">
                <button class="p-1.5 rounded border dark:border-gray-600" @click="openShow(r)" title="View" aria-label="View">
                  <Icon icon="mdi:eye-outline" class="text-[18px]" />
                </button>
                <button v-if="canPost(r)" @click="confirmPost(r)" class="p-1.5 rounded border dark:border-gray-600" :disabled="acting" title="Post" aria-label="Post">
                  <Icon icon="mdi:send" class="text-[18px]" />
                </button>
                <button v-if="canMarkPaid(r)" @click="confirmMarkPaid(r)" class="p-1.5 rounded border dark:border-gray-600" :disabled="acting" title="Mark Paid" aria-label="Mark Paid">
                  <Icon icon="mdi:cash-check" class="text-[18px]" />
                </button>
                <button @click="confirmDelete(r)" class="p-1.5 rounded border dark:border-gray-600" :disabled="acting" title="Delete" aria-label="Delete">
                  <Icon icon="mdi:trash-can-outline" class="text-[18px]" />
                </button>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="8" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
        <div v-for="r in rows" :key="r.id" class="bg-white dark:bg-gray-800 px-4 py-3">
          <div class="flex items-center justify-between">
            <div class="font-mono text-sm">{{ r.number || ('INV-' + r.id) }}</div>
            <span :class="statusBadge(r.status)">{{ titleCase(r.status || 'draft') }}</span>
          </div>
          <div class="mt-2 text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <div class="flex justify-between"><span class="text-gray-500">Customer</span><span class="text-right truncate max-w-[55%]">{{ r.customer_name || r.customer?.name || ('#' + r.customer_id) }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Order #</span><span class="font-mono">{{ r.order_number || ('SO-' + (r.order_id ?? '-')) }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Subtotal</span><span>Rp{{ fm(r.subtotal) }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Tax</span><span>Rp{{ fm(r.tax_total) }}</span></div>
            <div class="flex justify-between font-semibold"><span>Grand Total</span><span>Rp{{ fm(r.grand_total) }}</span></div>
          </div>
          <div class="mt-3 flex justify-end gap-2">
            <button class="p-2 rounded border dark:border-gray-600" @click="openShow(r)" title="View" aria-label="View"><Icon icon="mdi:eye-outline" class="text-[18px]" /></button>
            <button v-if="canPost(r)" @click="confirmPost(r)" class="p-2 rounded border dark:border-gray-600" :disabled="acting" title="Post" aria-label="Post"><Icon icon="mdi:send" class="text-[18px]" /></button>
            <button v-if="canMarkPaid(r)" @click="confirmMarkPaid(r)" class="p-2 rounded border dark:border-gray-600" :disabled="acting" title="Mark Paid" aria-label="Mark Paid"><Icon icon="mdi:cash-check" class="text-[18px]" /></button>
            <button @click="confirmDelete(r)" class="p-2 rounded border dark:border-gray-600" :disabled="acting" title="Delete" aria-label="Delete"><Icon icon="mdi:trash-can-outline" class="text-[18px]" /></button>
          </div>
        </div>
        <div v-if="!loading && !rows.length" class="px-4 py-6 text-center text-gray-400">No data</div>
      </div>

      <!-- Pagination -->
      <div class="px-5 py-4 flex items-center justify-between">
        <button :disabled="!page.prev" @click="go(page.current - 1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">Prev</button>
        <div class="text-sm text-gray-500 dark:text-gray-400">Page {{ page.current || 1 }} / {{ page.last || 1 }}</div>
        <button :disabled="!page.next" @click="go(page.current + 1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">Next</button>
      </div>
    </div>

    <!-- Drawer: Show -->
    <div v-if="drawer.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="drawer.open = false"></div>
      <div class="absolute right-0 top-0 h-full w-full max-w-3xl bg-white dark:bg-gray-900 border-l dark:border-gray-700 shadow-xl overflow-y-auto">
        <div class="p-5 border-b dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold dark:text-gray-100">
              Invoice — <span class="font-mono">{{ show.number || ('INV-' + show.id) }}</span>
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400" v-if="show.customer_name || show.customer?.name">
              {{ show.customer_name || show.customer?.name }}
            </p>
          </div>
          <div class="flex gap-2">
            <button v-if="show.order_id" @click="openOrder(show.order_id)" class="px-3 py-2 rounded border dark:border-gray-700">Open Order</button>
            <button @click="drawer.open = false" class="px-3 py-2 rounded border dark:border-gray-700">Close</button>
          </div>
        </div>

        <div class="p-5 grid md:grid-cols-2 gap-4">
          <div class="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-4">
            <h4 class="font-semibold mb-2 dark:text-gray-100">Header</h4>
            <div class="text-sm space-y-1">
              <div><span class="text-gray-500">Order:</span> <span class="font-mono">SO-{{ show.order_id }}</span></div>
              <div><span class="text-gray-500">Status:</span> <span :class="statusBadge(show.status)">{{ titleCase(show.status || 'draft') }}</span></div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-4">
            <h4 class="font-semibold mb-2 dark:text-gray-100">Amounts</h4>
            <div class="text-sm space-y-1">
              <div class="flex justify-between"><span class="text-gray-500">Subtotal</span><span>Rp{{ fm(show.subtotal) }}</span></div>
              <div class="flex justify-between"><span class="text-gray-500">Tax</span><span>Rp{{ fm(show.tax_total) }}</span></div>
              <div class="flex justify-between font-semibold"><span>Grand Total</span><span>Rp{{ fm(show.grand_total) }}</span></div>
            </div>
          </div>
        </div>

        <!-- Items table -->
        <div class="px-5 pb-5">
          <div class="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md overflow-hidden">
            <div class="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{{ (items || []).length }} item(s)</div>
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
                <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th class="px-6 py-3">Product</th>
                    <th class="px-6 py-3">Description</th>
                    <th class="px-6 py-3 text-right">Qty</th>
                    <th class="px-6 py-3">UoM</th>
                    <th class="px-6 py-3 text-right">Unit Price</th>
                    <th class="px-6 py-3 text-right">Disc %</th>
                    <th class="px-6 py-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="it in items" :key="it.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                    <td class="px-6 py-3">{{ it.product_name || ('#' + it.product_id) }}</td>
                    <td class="px-6 py-3">{{ it.description || '—' }}</td>
                    <td class="px-6 py-3 text-right">{{ fm(it.qty) }}</td>
                    <td class="px-6 py-3">{{ it.uom || 'pcs' }}</td>
                    <td class="px-6 py-3 text-right">Rp{{ fm(it.unit_price) }}</td>
                    <td class="px-6 py-3 text-right">{{ (it.discount_pct ?? 0) }}%</td>
                    <td class="px-6 py-3 text-right">Rp{{ fm(it.line_total) }}</td>
                  </tr>
                  <tr v-if="!items || !items.length">
                    <td colspan="7" class="px-6 py-6 text-center text-gray-400">No items</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2 justify-end">
            <button v-if="canPost(show)" @click="confirmPost(show)" :disabled="acting" class="px-4 py-2 rounded border dark:border-gray-700">Post Invoice</button>
            <button v-if="canMarkPaid(show)" @click="confirmMarkPaid(show)" :disabled="acting" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">Mark Paid</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Invoice Modal (fields = columns) -->
    <div v-if="modals.create" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modals.create = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold dark:text-gray-200">New Invoice</h3>
          <button class="p-1.5 rounded border dark:border-gray-600" @click="modals.create=false" aria-label="Close">
            <Icon icon="mdi:close" class="text-[18px]" />
          </button>
        </div>

        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Number</label>
            <input v-model="form.number" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="Auto/Custom e.g. INV-2025..." />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Customer ID<span class="text-red-500">*</span></label>
            <input v-model.number="form.customer_id" type="number" min="1" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="e.g. 1" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Order ID</label>
            <input v-model.number="form.order_id" type="number" min="1" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="optional" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Status</label>
            <select v-model="form.status" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Subtotal</label>
            <input v-model.number="form.subtotal" type="number" min="0" step="0.01" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Tax Total</label>
            <input v-model.number="form.tax_total" type="number" min="0" step="0.01" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Grand Total (auto)</label>
            <input :value="calcGrand" disabled class="w-full border dark:border-gray-700 rounded px-3 py-2 bg-gray-50 dark:bg-gray-900/50 dark:text-gray-300" />
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>
        <div v-if="hasFieldErrors" class="mt-2 text-sm text-red-400 space-y-1">
          <div v-for="(arr, key) in fieldErrors" :key="key">{{ key }}: {{ arr?.[0] }}</div>
        </div>

        <div class="mt-5 flex items-center justify-end gap-2">
          <button @click="modals.create=false" class="p-2 rounded border dark:border-gray-600" title="Cancel">
            <Icon icon="mdi:close" class="text-[18px]" />
          </button>
          <button @click="saveCreate()" :disabled="acting" class="p-2 rounded bg-primary text-white hover:bg-primary/80" title="Save">
            <Icon :icon="acting ? 'mdi:loading' : 'mdi:content-save-outline'" :class="['text-[18px]', acting && 'animate-spin']" />
          </button>
        </div>
      </div>
    </div>

    <!-- Fallback error toast -->
    <div v-if="error" class="fixed bottom-4 right-4 bg-red-600 text-white text-sm px-4 py-3 rounded shadow">
      {{ error }}
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Swal from "sweetalert2";
import { Icon } from "@iconify/vue";

export default {
  name: "Invoices",
  components: { Icon },
  data() {
    return {
      loading: false,
      acting: false,
      rows: [],
      q: { page: 1, perPage: 10, search: "", status: "" },
      page: { current: 1, last: 1, total: 0, from: 0, to: 0, prev: false, next: false },
      statusOptions: ["draft", "posted", "paid", "cancelled"],

      drawer: { open: false },
      show: {},
      items: [],

      // hanya modal create
      modals: { create: false },

      form: {
        number: "",
        customer_id: null,
        order_id: null,
        status: "draft",
        subtotal: 0,
        tax_total: 0,
        grand_total: 0,
      },

      error: "",
      fieldErrors: {},
    };
  },

  computed: {
    calcGrand() {
      const s = Number(this.form.subtotal || 0);
      const t = Number(this.form.tax_total || 0);
      return (s + t).toFixed(2);
    },
    hasFieldErrors() {
      return this.fieldErrors && Object.keys(this.fieldErrors).length > 0;
    },
  },

  watch: {
    calcGrand(n) {
      this.form.grand_total = Number(n);
    },
  },

  mounted() {
    this.reload();
  },

  methods: {
    toast(icon, title) {
      const T = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 1800, timerProgressBar: true });
      T.fire({ icon, title });
    },

    resolveBaseUrl() {
      const raw = import.meta?.env?.VITE_API_BASE || process?.env?.VUE_APP_API_BASE || "http://localhost:8000";
      return String(raw).trim().replace(/\/+$/, "");
    },
    // ===== Axios ke /api/sales =====
    api() {
      const token = localStorage.getItem("token");
      const instance = axios.create({
        baseURL: `${this.resolveBaseUrl()}/api/sales`,
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      instance.interceptors.response.use(
        (r) => r,
        (e) => {
          if (e?.response?.status === 401) {
            localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/auth/login";
          }
          return Promise.reject(e);
        }
      );
      return instance;
    },

    fm(n) { return Number(n || 0).toLocaleString("id-ID"); },
    titleCase(s) { return String(s || "").toLowerCase().replace(/\b\w/g, m => m.toUpperCase()); },
    statusBadge(st) {
      const base = "px-2 py-1 text-xs rounded capitalize";
      const map = {
        draft: "bg-gray-100 text-gray-700",
        posted: "bg-blue-100 text-blue-700",
        paid: "bg-green-100 text-green-700",
        cancelled: "bg-red-100 text-red-700",
      };
      const k = String(st || "draft").toLowerCase();
      return `${base} ${map[k] || map.draft}`;
    },
    canPost(r) { return (r?.status || "draft").toLowerCase() === "draft"; },
    canMarkPaid(r) { return (r?.status || "draft").toLowerCase() === "posted"; },

    async reload() {
      this.loading = true; this.error = "";
      try {
        const params = { page: this.q.page, per_page: this.q.perPage };
        if ((this.q.search || "").trim()) params.search = this.q.search.trim();
        if (this.q.status) params.status = this.q.status;

        const { data } = await this.api().get("/invoices", { params });
        const rawRows = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        this.rows = rawRows.map(r => ({
          ...r,
          subtotal: Number(r.subtotal || 0),
          tax_total: Number(r.tax_total || 0),
          grand_total: Number(r.grand_total || 0),
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
        this.error = e?.response?.data?.message || e?.message || "Gagal memuat Invoices";
        this.toast("error", this.error);
      } finally { this.loading = false; }
    },

    go(p) { this.q.page = Math.max(1, p); this.reload(); },

    async openShow(row) {
      this.error = ""; this.drawer.open = true;
      this.show = { id: row.id, number: row.number, status: row.status, customer_name: row.customer_name, order_id: row.order_id };
      this.items = [];
      try {
        const { data } = await this.api().get(`/invoices/${row.id}`);
        const inv = data?.invoice || data || {};
        this.show = {
          ...inv,
          subtotal: Number(inv.subtotal || 0),
          tax_total: Number(inv.tax_total || 0),
          grand_total: Number(inv.grand_total || 0),
        };
        this.items = Array.isArray(data?.items || inv?.items) ? (data.items || inv.items) : [];
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal memuat detail invoice";
        this.toast("error", this.error);
      }
    },

    openCreate() {
      this.error = ""; this.fieldErrors = {};
      this.form = { number: "", customer_id: null, order_id: null, status: "draft", subtotal: 0, tax_total: 0, grand_total: 0 };
      this.modals.create = true;
    },
    toCreatePayload() {
      const t = (v) => (typeof v === "string" ? v.trim() : v);
      return {
        number: t(this.form.number) || null,
        customer_id: this.form.customer_id == null || this.form.customer_id === "" ? null : Number(this.form.customer_id),
        order_id: this.form.order_id == null || this.form.order_id === "" ? null : Number(this.form.order_id),
        status: t(this.form.status) || "draft",
        subtotal: Number(this.form.subtotal || 0),
        tax_total: Number(this.form.tax_total || 0),
        grand_total: Number(this.calcGrand || this.form.grand_total || 0),
      };
    },
    async saveCreate() {
      if (!this.form.customer_id) { this.toast("warning", "Customer ID wajib diisi."); this.error = "Customer ID wajib diisi."; return; }
      this.acting = true; this.error = ""; this.fieldErrors = {};
      try {
        const payload = this.toCreatePayload();
        await this.api().post("/invoices", payload);
        this.toast("success", "Invoice created");
        this.modals.create = false;
        await this.reload();
      } catch (e) {
        if (e?.response?.status === 422) {
          const errs = e.response.data?.errors || {}; this.fieldErrors = errs;
          const msg = Object.values(errs)[0]?.[0] || e.response.data?.message || "Validasi gagal";
          this.error = msg; this.toast("error", msg);
        } else {
          const msg = e?.response?.data?.message || "Gagal menyimpan invoice";
          this.error = msg; this.toast("error", msg);
        }
      } finally { this.acting = false; }
    },

    async confirmPost(row) {
      const res = await Swal.fire({ title: "Post invoice?", text: `Post invoice ${row.number || ('#' + row.id)} (ubah status ke "posted").`, icon: "warning", showCancelButton: true, confirmButtonText: "Yes, post", cancelButtonText: "Cancel", reverseButtons: true });
      if (res.isConfirmed) this.postInvoice(row);
    },
    async confirmMarkPaid(row) {
      const res = await Swal.fire({ title: "Mark as PAID?", text: `Tandai invoice ${row.number || ('#' + row.id)} sebagai "paid".`, icon: "question", showCancelButton: true, confirmButtonText: "Yes, mark paid", cancelButtonText: "Cancel", reverseButtons: true });
      if (res.isConfirmed) this.markPaid(row);
    },
    async confirmDelete(row) {
      const res = await Swal.fire({ title: "Delete invoice?", text: `Hapus invoice ${row.number || ('#' + row.id)} permanen.`, icon: "error", showCancelButton: true, confirmButtonText: "Yes, delete", cancelButtonText: "Cancel", reverseButtons: true, confirmButtonColor: "#ef4444" });
      if (res.isConfirmed) this.deleteInvoice(row);
    },

    async postInvoice(row) {
      this.acting = true; this.error = "";
      try {
        await this.api().post(`/invoices/${row.id}/post`);
        this.toast("success", "Invoice posted"); await this.reload();
        if (this.drawer.open && this.show?.id === row.id) await this.openShow(row);
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal post invoice"; this.toast("error", this.error);
      } finally { this.acting = false; }
    },

    async markPaid(row) {
      this.acting = true; this.error = "";
      try {
        await this.api().post(`/invoices/${row.id}/pay`);
        this.toast("success", "Invoice marked as PAID"); await this.reload();
        if (this.drawer.open && this.show?.id === row.id) await this.openShow(row);
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal mark paid"; this.toast("error", this.error);
      } finally { this.acting = false; }
    },

    async deleteInvoice(row) {
      this.acting = true; this.error = "";
      try {
        await this.api().delete(`/invoices/${row.id}`);
        this.toast("success", "Invoice deleted"); await this.reload();
        if (this.drawer.open && this.show?.id === row.id) this.drawer.open = false;
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal menghapus invoice"; this.toast("error", this.error);
      } finally { this.acting = false; }
    },

    openOrder(orderId) {
      this.$router?.push?.({ name: "OrderShow", params: { id: orderId } }) || this.$router?.push?.(`/orders/${orderId}`);
    },
  },
};
</script>
