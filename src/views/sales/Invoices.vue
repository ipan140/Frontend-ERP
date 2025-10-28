<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">sales</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Invoices</h1>
      </div>

      <div class="flex gap-2">
        <input
          v-model="q.search"
          @keyup.enter="reload()"
          class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search number/customer…"
        />
        <button
          @click="reload()"
          class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5"
        >
          Search
        </button>

        <!-- Create From Order -->
        <button
          @click="openCreateFromOrder()"
          class="bg-primary border flex gap-2 text-white hover:bg-primary/80 dark:border-gray-700 rounded py-2 px-4"
          title="Create invoice from an Order ID"
        >
          + From Order
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

      <!-- Table -->
      <div class="overflow-x-auto">
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
              <td class="px-6 py-3">
                <span class="font-mono">{{ r.order_number || ('SO-' + (r.order_id || '-')) }}</span>
              </td>
              <td class="px-6 py-3 text-right">Rp{{ formatNumber(r.subtotal) }}</td>
              <td class="px-6 py-3 text-right">Rp{{ formatNumber(r.tax_total) }}</td>
              <td class="px-6 py-3 text-right font-semibold">Rp{{ formatNumber(r.grand_total) }}</td>
              <td class="px-6 py-3">
                <span :class="badge(r.status)">{{ (r.status || 'draft') }}</span>
              </td>
              <td class="px-6 py-3 text-right">
                <button @click="openShow(r)" class="px-2 py-1 rounded border dark:border-gray-600 mr-2">
                  View
                </button>
                <button
                  v-if="canPost(r)"
                  @click="postInvoice(r)"
                  class="px-2 py-1 rounded border dark:border-gray-600 mr-2"
                  :disabled="acting"
                  title="Post / Confirm"
                >
                  Post
                </button>
                <button
                  v-if="canMarkPaid(r)"
                  @click="markPaid(r)"
                  class="px-2 py-1 rounded border dark:border-gray-600 mr-2"
                  :disabled="acting"
                  title="Mark as Paid"
                >
                  Mark Paid
                </button>
                <button
                  @click="confirmDelete(r)"
                  class="px-2 py-1 rounded border dark:border-gray-600"
                  :disabled="acting"
                  title="Delete invoice"
                >
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

    <!-- Drawer: Show -->
    <div v-if="drawer.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="drawer.open = false"></div>

      <div
        class="absolute right-0 top-0 h-full w-full max-w-3xl bg-white dark:bg-gray-900 border-l dark:border-gray-700 shadow-xl overflow-y-auto"
      >
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
            <button v-if="show.order_id" @click="openOrder(show.order_id)" class="px-3 py-2 rounded border dark:border-gray-700">
              Open Order
            </button>
            <button @click="drawer.open = false" class="px-3 py-2 rounded border dark:border-gray-700">Close</button>
          </div>
        </div>

        <div class="p-5 grid md:grid-cols-2 gap-4">
          <div class="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-4">
            <h4 class="font-semibold mb-2 dark:text-gray-100">Header</h4>
            <div class="text-sm space-y-1">
              <div><span class="text-gray-500">Order:</span> <span class="font-mono">SO-{{ show.order_id }}</span></div>
              <div><span class="text-gray-500">Status:</span> <span :class="badge(show.status)">{{ show.status || 'draft' }}</span></div>
              <div><span class="text-gray-500">Currency:</span> {{ show.currency || 'IDR' }}</div>
              <div v-if="show.posted_at"><span class="text-gray-500">Posted at:</span> {{ fmtDateTime(show.posted_at) }}</div>
              <div v-if="show.paid_at"><span class="text-gray-500">Paid at:</span> {{ fmtDateTime(show.paid_at) }}</div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-4">
            <h4 class="font-semibold mb-2 dark:text-gray-100">Amounts</h4>
            <div class="text-sm space-y-1">
              <div class="flex justify-between"><span class="text-gray-500">Subtotal</span><span>Rp{{ formatNumber(show.subtotal) }}</span></div>
              <div class="flex justify-between"><span class="text-gray-500">Discount</span><span>Rp{{ formatNumber(show.discount_total) }}</span></div>
              <div class="flex justify-between"><span class="text-gray-500">Tax</span><span>Rp{{ formatNumber(show.tax_total) }}</span></div>
              <div class="flex justify-between font-semibold"><span>Grand Total</span><span>Rp{{ formatNumber(show.grand_total) }}</span></div>
            </div>
          </div>
        </div>

        <div class="px-5 pb-5">
          <div class="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md overflow-hidden">
            <div class="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
              {{ (items || []).length }} item(s)
            </div>
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
                  <td class="px-6 py-3 text-right">{{ formatNumber(it.qty) }}</td>
                  <td class="px-6 py-3">{{ it.uom || 'pcs' }}</td>
                  <td class="px-6 py-3 text-right">Rp{{ formatNumber(it.unit_price) }}</td>
                  <td class="px-6 py-3 text-right">{{ (it.discount_pct ?? 0) }}%</td>
                  <td class="px-6 py-3 text-right">Rp{{ formatNumber(it.line_total) }}</td>
                </tr>
                <tr v-if="!items || !items.length">
                  <td colspan="7" class="px-6 py-6 text-center text-gray-400">No items</td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2 justify-end">
            <button
              v-if="canPost(show)"
              @click="postInvoice(show)"
              :disabled="acting"
              class="px-4 py-2 rounded border dark:border-gray-700"
              title="Post/Confirm"
            >
              Post Invoice
            </button>
            <button
              v-if="canMarkPaid(show)"
              @click="markPaid(show)"
              :disabled="acting"
              class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80"
              title="Mark as Paid"
            >
              Mark Paid
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create FROM ORDER Modal -->
    <div v-if="modals.fromOrder" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modals.fromOrder = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-md p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Create Invoice from Order</h3>
        <label class="block text-sm mb-1 dark:text-gray-300">Order ID</label>
        <input v-model.number="formFromOrder.order_id" type="number" min="1"
               class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
               placeholder="e.g. 1" />
        <p class="text-xs text-gray-500 mt-2">
          Calls <code>POST /api/orders/:id/invoice</code>.
        </p>
        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>
        <div class="mt-5 flex justify-end gap-2">
          <button @click="modals.fromOrder = false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="createFromOrder()" :disabled="acting" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ acting ? 'Creating…' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Error toast -->
    <div v-if="error" class="fixed bottom-4 right-4 bg-red-600 text-white text-sm px-4 py-3 rounded shadow">
      {{ error }}
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "Invoices",
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

      // modal create
      modals: { fromOrder: false },
      formFromOrder: { order_id: null },

      error: "",
    };
  },

  mounted() {
    this.reload();
  },

  methods: {
    /* ========= Base URL & Axios ========= */
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
    fmtDate(d) {
      if (!d) return "";
      return String(d).slice(0, 10);
    },
    fmtDateTime(d) {
      if (!d) return "";
      return String(d).replace('T', ' ').slice(0, 19);
    },
    formatNumber(n) {
      const num = Number(n || 0);
      return num.toLocaleString("id-ID");
    },
    badge(st) {
      const base = "px-2 py-1 text-xs rounded capitalize";
      const map = {
        draft: "bg-gray-100 text-gray-700",
        posted: "bg-blue-100 text-blue-700",
        paid: "bg-green-100 text-green-700",
        cancelled: "bg-red-100 text-red-700",
      };
      return `${base} ${map[st] || "bg-gray-100 text-gray-700"}`;
    },
    canPost(row) {
      const st = (row?.status || "draft").toLowerCase();
      return st === "draft";
    },
    canMarkPaid(row) {
      const st = (row?.status || "draft").toLowerCase();
      return st === "posted";
    },

    /* ========= Load (index) ========= */
    async reload() {
      this.loading = true;
      this.error = "";
      try {
        const params = {
          page: this.q.page,
          per_page: this.q.perPage,
        };
        if (String(this.q.search || "").trim()) params.search = this.q.search.trim();
        if (this.q.status) params.status = this.q.status;

        const { data } = await this.api().get("/invoices", { params });

        const rawRows = Array.isArray(data?.data) ? data.data : [];
        this.rows = rawRows.map((r) => ({
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
        this.error =
          e?.response?.data?.message || e?.message || "Gagal memuat Invoices";
      } finally {
        this.loading = false;
      }
    },

    /* ========= Pagination ========= */
    go(p) {
      this.q.page = Math.max(1, p);
      this.reload();
    },

    /* ========= Show ========= */
    async openShow(row) {
      this.error = "";
      this.drawer.open = true;
      this.show = { id: row.id, number: row.number, status: row.status, customer_name: row.customer_name };
      this.items = [];

      try {
        const { data } = await this.api().get(`/invoices/${row.id}`);
        const inv = data?.invoice || data || {};
        const items = data?.items || inv?.items || [];

        this.show = {
          ...inv,
          subtotal: Number(inv.subtotal || 0),
          discount_total: Number(inv.discount_total || 0),
          tax_total: Number(inv.tax_total || 0),
          grand_total: Number(inv.grand_total || 0),
        };
        this.items = Array.isArray(items) ? items : [];
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal memuat detail invoice";
      }
    },

    /* ========= Create from Order ========= */
    openCreateFromOrder() {
      this.error = "";
      this.formFromOrder = { order_id: null };
      this.modals.fromOrder = true;
    },
    async createFromOrder() {
      if (!this.formFromOrder.order_id) {
        this.error = "Order ID wajib diisi.";
        return;
      }
      this.acting = true; this.error = "";
      try {
        const oid = Number(this.formFromOrder.order_id);
        const { data } = await this.api().post(`/orders/${oid}/invoice`);
        this.modals.fromOrder = false;
        await this.reload();
        if (data?.invoice_id) {
          if (confirm("Invoice created. Open it now?")) {
            this.openShow({ id: data.invoice_id });
          }
        } else {
          alert(data?.message || "Invoice created");
        }
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal membuat invoice dari order";
      } finally {
        this.acting = false;
      }
    },

    /* ========= Actions ========= */
    async postInvoice(row) {
      if (!confirm(`Post invoice ${row.number || ('#' + row.id)}?`)) return;
      this.acting = true; this.error = "";
      try {
        await this.api().post(`/invoices/${row.id}/post`);
        await this.reload();
        if (this.drawer.open && this.show?.id === row.id) {
          await this.openShow(row);
        }
      } catch (e) {
        const msg = e?.response?.status === 404
          ? "Endpoint POST /invoices/{id}/post belum tersedia."
          : (e?.response?.data?.message || "Gagal post invoice");
        this.error = msg;
      } finally {
        this.acting = false;
      }
    },

    async markPaid(row) {
      if (!confirm(`Mark invoice ${row.number || ('#' + row.id)} as PAID?`)) return;
      this.acting = true; this.error = "";
      try {
        await this.api().post(`/invoices/${row.id}/pay`);
        await this.reload();
        if (this.drawer.open && this.show?.id === row.id) {
          await this.openShow(row);
        }
      } catch (e) {
        const msg = e?.response?.status === 404
          ? "Endpoint POST /invoices/{id}/pay belum tersedia."
          : (e?.response?.data?.message || "Gagal mark paid");
        this.error = msg;
      } finally {
        this.acting = false;
      }
    },

    async confirmDelete(row) {
      if (!confirm(`Hapus Invoice ${row.number || ('#' + row.id)}?`)) return;
      this.acting = true; this.error = "";
      try {
        await this.api().delete(`/invoices/${row.id}`);
        await this.reload();
        if (this.drawer.open && this.show?.id === row.id) {
          this.drawer.open = false;
        }
      } catch (e) {
        const msg = e?.response?.status === 404
          ? "Endpoint DELETE /invoices/{id} belum tersedia."
          : (e?.response?.data?.message || "Gagal menghapus invoice");
        this.error = msg;
      } finally {
        this.acting = false;
      }
    },

    /* ========= Nav helper ========= */
    openOrder(orderId) {
      // sesuaikan rute kamu
      this.$router?.push?.(`/orders/${orderId}`);
    },
  },
};
</script>
