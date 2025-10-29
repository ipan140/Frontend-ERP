<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">sales</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Sales Orders</h1>
      </div>

      <div class="flex gap-2 w-full lg:w-auto">
        <input
          v-model="q.search"
          @keyup.enter="reload"
          class="flex-1 lg:flex-none border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search number/customer…"
        />
        <button @click="reload" class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5">
          Search
        </button>

        <!-- From Quotation -->
        <button
          @click="openFromQuotation"
          class="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded py-2.5 px-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          title="Convert a quotation into Sales Order"
        >
          <Icon icon="mdi:file-convert-outline" class="text-xl" />
          <span class="font-medium">From Quotation</span>
        </button>

        <!-- New Order -->
        <button
          @click="openCreate"
          class="inline-flex items-center justify-center gap-2 bg-primary text-white rounded py-2.5 px-5 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[.98] transition"
          title="Create new sales order"
        >
          <Icon icon="ic:round-add" class="text-xl" />
          <span class="font-medium">New Order</span>
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
              @change="reload"
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
              @change="reload"
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
              <th class="px-6 py-3">Number</th>
              <th class="px-6 py-3">Customer</th>
              <th class="px-6 py-3">Order Date</th>
              <th class="px-6 py-3 text-right">Subtotal</th>
              <th class="px-6 py-3 text-right">Tax</th>
              <th class="px-6 py-3 text-right">Total</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="r in rows" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3 font-mono">{{ r.number || ('SO-' + r.id) }}</td>
              <td class="px-6 py-3">{{ r.customer_name || r.customer?.name || '-' }}</td>
              <td class="px-6 py-3">{{ fmtDate(r.order_date) || '—' }}</td>
              <td class="px-6 py-3 text-right">Rp{{ money(r.subtotal) }}</td>
              <td class="px-6 py-3 text-right">Rp{{ money(r.tax_amount) }}</td>
              <td class="px-6 py-3 text-right font-semibold">Rp{{ money(r.total) }}</td>
              <td class="px-6 py-3">
                <span :class="badge(r.status)">{{ (r.status || 'draft') }}</span>
              </td>
              <td class="px-6 py-3 text-right space-x-2 whitespace-nowrap">
                <button @click="openView(r)" class="px-2 py-1 rounded border dark:border-gray-600" title="View">View</button>
                <button v-if="canDeliver(r)" @click="deliver(r)" :disabled="saving" class="px-2 py-1 rounded border dark:border-gray-600" title="Deliver">Deliver</button>
                <button v-if="canInvoice(r)" @click="makeInvoice(r)" :disabled="saving" class="px-2 py-1 rounded border dark:border-gray-600" title="Make Invoice">Make Invoice</button>
                <button @click="openEdit(r)" class="px-2 py-1 rounded border dark:border-gray-600" title="Edit">Edit</button>
                <button @click="confirmDelete(r)" :disabled="saving" class="px-2 py-1 rounded border dark:border-gray-600" title="Delete">Delete</button>
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
        <button :disabled="!page.prev" @click="go(page.current - 1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">Prev</button>
        <div class="text-sm text-gray-500 dark:text-gray-400">Page {{ page.current || 1 }} / {{ page.last || 1 }}</div>
        <button :disabled="!page.next" @click="go(page.current + 1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">Next</button>
      </div>
    </div>

    <!-- Modal: Create/Edit -->
    <div
      v-if="modal.open && modal.mode !== 'view'"
      class="fixed inset-0 z-50 grid place-items-start md:place-items-center pt-6 md:pt-0"
    >
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5 max-h-[90vh] overflow-auto">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">{{ modal.mode === 'create' ? 'New Sales Order' : 'Edit Sales Order' }}</h3>

        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Number</label>
            <input v-model="form.number" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="Auto/Custom e.g. SO-202510-0001" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Customer ID<span class="text-red-500">*</span></label>
            <input v-model.number="form.customer_id" type="number" min="1" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="e.g. 1" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Order Date<span class="text-red-500">*</span></label>
            <input v-model="form.order_date" type="date" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Currency</label>
            <select v-model="form.currency" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option v-for="c in ['IDR','USD','EUR','SGD','JPY']" :key="c" :value="c">{{ c }}</option>
            </select>
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
            <input v-model.number="form.tax_amount" type="number" min="0" step="0.01" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Total (auto)</label>
            <input :value="moneyNumber(calcTotal)" disabled class="w-full border dark:border-gray-700 rounded px-3 py-2 bg-gray-50 dark:bg-gray-900/50 dark:text-gray-300" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Notes</label>
            <textarea v-model="form.notes" rows="3" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"></textarea>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open = false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="save" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">{{ saving ? 'Saving…' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <!-- Modal: View -->
    <div
      v-if="modal.open && modal.mode === 'view'"
      class="fixed inset-0 z-50 grid place-items-start md:place-items-center pt-6 md:pt-0"
    >
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-3xl p-5 max-h-[90vh] overflow-auto">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Sales Order Detail</h3>

        <div class="grid md:grid-cols-2 gap-3 text-sm">
          <div class="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded p-3">
            <p><span class="text-gray-500">Number:</span> {{ form.number || ('SO-' + form.id) }}</p>
            <p><span class="text-gray-500">Customer ID:</span> {{ form.customer_id }}</p>
            <p><span class="text-gray-500">Order Date:</span> {{ fmtDate(form.order_date) || '—' }}</p>
            <p><span class="text-gray-500">Currency:</span> {{ form.currency || 'IDR' }}</p>
            <p>
              <span class="text-gray-500">Status:</span>
              <span :class="badge(form.status)" class="ml-1 capitalize">{{ form.status || 'draft' }}</span>
            </p>
            <p v-if="form.notes" class="md:col-span-2"><span class="text-gray-500">Notes:</span> {{ form.notes }}</p>
          </div>

          <div class="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded p-3">
            <p class="flex justify-between"><span class="text-gray-500">Subtotal</span><span>Rp{{ money(form.subtotal) }}</span></p>
            <p class="flex justify-between"><span class="text-gray-500">Tax</span><span>Rp{{ money(form.tax_amount) }}</span></p>
            <p class="flex justify-between font-semibold"><span>Total</span><span>Rp{{ money(calcTotal) }}</span></p>
          </div>
        </div>

        <div class="mt-5 flex flex-wrap gap-2 justify-end">
          <button v-if="canDeliver(form)" @click="deliver(form)" :disabled="saving" class="px-4 py-2 rounded border dark:border-gray-700">Deliver</button>
          <button v-if="canInvoice(form)" @click="makeInvoice(form)" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">Make Invoice</button>
          <button @click="modal.open = false" class="px-4 py-2 rounded border dark:border-gray-600">Close</button>
        </div>
      </div>
    </div>

    <!-- Modal: From Quotation -->
    <div
      v-if="modalQuotation"
      class="fixed inset-0 z-50 grid place-items-start md:place-items-center pt-6 md:pt-0"
    >
      <div class="absolute inset-0 bg-black/40" @click="modalQuotation = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-md p-5 max-h-[90vh] overflow-auto">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Create from Quotation</h3>
        <label class="block text-sm mb-1 dark:text-gray-300">Quotation ID</label>
        <input v-model.number="quotationId" type="number" min="1" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="e.g. 12" @keyup.enter="convertFromQuotation" />
        <p class="text-xs text-gray-500 mt-2">Calls <code>POST /api/quotations/:id/convert</code>.</p>
        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>
        <div class="mt-5 flex justify-end gap-2">
          <button @click="modalQuotation = false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="convertFromQuotation" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Converting…' : 'Convert' }}
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
  name: "SalesOrders",
  components: { Icon },

  data() {
    return {
      loading: false,
      rows: [],
      q: { page: 1, perPage: 10, search: "", status: "" },
      page: { current: 1, last: 1, total: 0, from: 0, to: 0, prev: false, next: false },

      statusOptions: ["draft", "confirmed", "delivered", "invoiced", "cancelled"],

      modal: { open: false, mode: "create" }, // create | edit | view
      modalQuotation: false,
      quotationId: null,

      form: {
        id: null,
        number: "",
        customer_id: null,
        order_date: "",
        currency: "IDR",
        status: "draft",
        subtotal: 0,
        tax_amount: 0,
        notes: "",
      },

      saving: false,
      error: "",
      fieldErrors: {},
    };
  },

  computed: {
    calcTotal() {
      const s = Number(this.form.subtotal || 0);
      const t = Number(this.form.tax_amount || 0);
      return s + t;
    },
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
    money(n) { return Number(n || 0).toLocaleString("id-ID"); },
    moneyNumber(n) { return Number(n || 0).toLocaleString("id-ID", { minimumFractionDigits: 0 }); },
    fmtDate(d) {
      if (!d) return "";
      try {
        const x = new Date(d);
        return isNaN(+x) ? String(d).slice(0, 10) : x.toLocaleDateString("id-ID");
      } catch { return String(d).slice(0, 10); }
    },
    badge(st) {
      const base = "px-2 py-1 text-xs rounded capitalize";
      const s = String(st || "draft").toLowerCase();
      const map = {
        draft: "bg-gray-100 text-gray-700",
        confirmed: "bg-blue-100 text-blue-700",
        delivered: "bg-green-100 text-green-700",
        invoiced: "bg-purple-100 text-purple-700",
        cancelled: "bg-red-100 text-red-700",
      };
      return `${base} ${map[s] || map.draft}`;
    },
    canDeliver(r) { return String(r?.status || "").toLowerCase() === "confirmed"; },
    canInvoice(r) {
      const s = String(r?.status || "").toLowerCase();
      return s === "confirmed" || s === "delivered";
    },
    cleanParams(raw) {
      const p = { ...raw };
      if (!String(p.search || "").trim()) delete p.search;
      if (!String(p.status || "").trim()) delete p.status;
      return p;
    },

    async reload() {
      this.loading = true;
      this.error = "";
      try {
        const params = this.cleanParams({
          page: this.q.page,
          per_page: this.q.perPage,
          search: this.q.search,
          status: this.q.status,
        });

        // prefer /sales-orders, fallback /orders jika 404
        let data;
        try {
          ({ data } = await this.api().get("/sales-orders", { params }));
        } catch (e) {
          if (e?.response?.status === 404) {
            ({ data } = await this.api().get("/orders", { params }));
          } else {
            throw e;
          }
        }

        const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.rows = rows.map((r) => ({
          ...r,
          status: String(r.status || "draft").toLowerCase(),
          subtotal: Number(r.subtotal || 0),
          tax_amount: Number(r.tax_amount ?? r.tax ?? 0),
          total: Number(r.total ?? (Number(r.subtotal || 0) + Number(r.tax_amount ?? r.tax ?? 0))),
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
        this.error = e?.response?.data?.message || "Gagal memuat Sales Orders";
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
      this.error = ""; this.fieldErrors = {};
      const today = new Date().toISOString().slice(0, 10);
      this.form = {
        id: null, number: "", customer_id: null, order_date: today, currency: "IDR",
        status: "draft", subtotal: 0, tax_amount: 0, notes: ""
      };
    },
    openEdit(row) {
      this.modal = { open: true, mode: "edit" };
      this.error = ""; this.fieldErrors = {};
      this.form = {
        id: row.id,
        number: row.number || "",
        customer_id: row.customer_id || null,
        order_date: row.order_date || "",
        currency: row.currency || "IDR",
        status: String(row.status || "draft").toLowerCase(),
        subtotal: Number(row.subtotal || 0),
        tax_amount: Number(row.tax_amount ?? row.tax ?? 0),
        notes: row.notes || "",
      };
    },
    openView(row) {
      this.modal = { open: true, mode: "view" };
      this.form = {
        id: row.id,
        number: row.number,
        customer_id: row.customer_id,
        order_date: row.order_date,
        currency: row.currency,
        status: String(row.status || "draft").toLowerCase(),
        subtotal: Number(row.subtotal || 0),
        tax_amount: Number(row.tax_amount ?? row.tax ?? 0),
        notes: row.notes,
      };
    },
    openFromQuotation() {
      this.error = "";
      this.quotationId = null;
      this.modalQuotation = true;
    },

    toPayload() {
      const t = (v) => (typeof v === "string" ? v.trim() : v);
      return {
        number: t(this.form.number) || null,
        customer_id: this.form.customer_id == null || this.form.customer_id === "" ? null : Number(this.form.customer_id),
        order_date: t(this.form.order_date) || null,
        currency: t(this.form.currency) || "IDR",
        status: t(this.form.status || "draft").toLowerCase(),
        subtotal: Number(this.form.subtotal || 0),
        tax_amount: Number(this.form.tax_amount || 0),
        total: Number(this.calcTotal || 0),
        notes: t(this.form.notes) || null,
      };
    },

    async save() {
      this.saving = true;
      this.error = "";
      this.fieldErrors = {};

      if (!this.form.customer_id) { this.saving = false; this.error = "Customer ID wajib diisi."; return; }
      if (!this.form.order_date) { this.saving = false; this.error = "Order Date wajib diisi."; return; }

      try {
        const payload = this.toPayload();
        if (this.modal.mode === "create") {
          await this.tryPost("/sales-orders", "/orders", payload);
          this.toast("success", "Order created");
        } else {
          const id = this.form.id;
          await this.tryPut(`/sales-orders/${id}`, `/orders/${id}`, payload);
          this.toast("success", "Order updated");
        }
        this.modal.open = false;
        await this.reload();
      } catch (e) {
        if (e?.response?.status === 422) {
          this.fieldErrors = e.response.data?.errors || {};
          this.error = Object.values(this.fieldErrors)[0]?.[0] || e.response.data?.message || "Validasi gagal";
          this.toast("error", this.error);
        } else {
          this.error = e?.response?.data?.message || "Gagal menyimpan order";
          this.toast("error", this.error);
        }
      } finally { this.saving = false; }
    },

    async convertFromQuotation() {
      if (!this.quotationId) { this.error = "Quotation ID wajib diisi."; return; }
      this.saving = true; this.error = "";
      try {
        const qid = Number(this.quotationId);
        await this.api().post(`/quotations/${qid}/convert`);
        this.modalQuotation = false;
        this.toast("success", "Converted");
        await this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal convert quotation";
        this.toast("error", this.error);
      } finally { this.saving = false; }
    },

    async deliver(row) {
      if (!this.canDeliver(row)) return;
      const res = await Swal.fire({ title: `Deliver ${row.number || ('#' + row.id)}?`, icon: "question", showCancelButton: true, confirmButtonText: "Yes", cancelButtonText: "Cancel" });
      if (!res.isConfirmed) return;
      this.saving = true; this.error = "";
      try {
        await this.tryPost(`/sales-orders/${row.id}/deliver`, `/orders/${row.id}/deliver`);
        this.toast("success", "Delivered");
        await this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal melakukan deliver";
        this.toast("error", this.error);
      } finally { this.saving = false; }
    },

    async makeInvoice(row) {
      if (!this.canInvoice(row)) return;
      const res = await Swal.fire({ title: `Create invoice from ${row.number || ('#' + row.id)}?`, icon: "question", showCancelButton: true, confirmButtonText: "Yes", cancelButtonText: "Cancel" });
      if (!res.isConfirmed) return;
      this.saving = true; this.error = "";
      try {
        await this.tryPost(`/sales-orders/${row.id}/invoice`, `/orders/${row.id}/invoice`);
        this.toast("success", "Invoice created");
        await this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal membuat invoice";
        this.toast("error", this.error);
      } finally { this.saving = false; }
    },

    async confirmDelete(row) {
      const res = await Swal.fire({
        title: `Hapus "${row.number || ('#'+row.id)}"?`,
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
        await this.tryDelete(`/sales-orders/${row.id}`, `/orders/${row.id}`);
        this.toast("success", "Deleted");
        await this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal menghapus order";
        this.toast("error", this.error);
      } finally { this.saving = false; }
    },

    async tryPost(primary, fallback, payload = undefined) {
      try { return await this.api().post(primary, payload); }
      catch (e) { if (e?.response?.status === 404 && fallback) return this.api().post(fallback, payload); throw e; }
    },
    async tryPut(primary, fallback, payload = undefined) {
      try { return await this.api().put(primary, payload); }
      catch (e) { if (e?.response?.status === 404 && fallback) return this.api().put(fallback, payload); throw e; }
    },
    async tryDelete(primary, fallback) {
      try { return await this.api().delete(primary); }
      catch (e) { if (e?.response?.status === 404 && fallback) return this.api().delete(fallback); throw e; }
    },
  },
};
</script>

<style scoped>
.bg-primary { background-color: #635bff; }
</style>
