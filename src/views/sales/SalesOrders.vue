<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">sales</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Sales Orders</h1>
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

        <!-- NEW: Create buttons -->
        <button
          @click="openCreateFromQuotation()"
          class="bg-white border dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded py-2 px-4"
          title="Convert a quotation into sales order"
        >
          From Quotation
        </button>
        <button
          @click="openCreateDirect()"
          class="bg-primary border flex gap-2 text-white hover:bg-primary/80 dark:border-gray-700 rounded py-2 px-4"
          title="Create order directly (needs POST /api/orders)"
        >
          + New Order
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
              <td class="px-6 py-3 text-right">Rp{{ formatNumber(r.subtotal) }}</td>
              <td class="px-6 py-3 text-right">Rp{{ formatNumber(r.tax_amount) }}</td>
              <td class="px-6 py-3 text-right font-semibold">Rp{{ formatNumber(r.total) }}</td>
              <td class="px-6 py-3">
                <span :class="badge(r.status)">{{ (r.status || 'draft') }}</span>
              </td>
              <td class="px-6 py-3 text-right">
                <button @click="openShow(r)" class="px-2 py-1 rounded border dark:border-gray-600 mr-2">
                  View
                </button>
                <button
                  v-if="canDeliver(r)"
                  @click="deliver(r)"
                  class="px-2 py-1 rounded border dark:border-gray-600 mr-2"
                  :disabled="acting"
                  title="Deliver"
                >
                  Deliver
                </button>
                <button
                  v-if="canInvoice(r)"
                  @click="makeInvoice(r)"
                  class="px-2 py-1 rounded border dark:border-gray-600 mr-2"
                  :disabled="acting"
                  title="Create Invoice"
                >
                  Make Invoice
                </button>
                <!-- NEW: Delete -->
                <button
                  @click="confirmDelete(r)"
                  class="px-2 py-1 rounded border dark:border-gray-600"
                  :disabled="acting"
                  title="Delete order"
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

    <!-- Drawer / Modal: Show -->
    <div v-if="drawer.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="drawer.open = false"></div>

      <div
        class="absolute right-0 top-0 h-full w-full max-w-3xl bg-white dark:bg-gray-900 border-l dark:border-gray-700 shadow-xl overflow-y-auto"
      >
        <div class="p-5 border-b dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold dark:text-gray-100">
              Sales Order — <span class="font-mono">{{ show.number || ('SO-' + show.id) }}</span>
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400" v-if="show.customer_name || show.customer?.name">
              {{ show.customer_name || show.customer?.name }}
            </p>
          </div>
          <button @click="drawer.open = false" class="px-3 py-2 rounded border dark:border-gray-700">Close</button>
        </div>

        <div class="p-5 grid md:grid-cols-2 gap-4">
          <div class="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-4">
            <h4 class="font-semibold mb-2 dark:text-gray-100">Header</h4>
            <div class="text-sm space-y-1">
              <div><span class="text-gray-500">Order Date:</span> {{ fmtDate(show.order_date) || '—' }}</div>
              <div><span class="text-gray-500">Status:</span> <span :class="badge(show.status)">{{ show.status || 'draft' }}</span></div>
              <div><span class="text-gray-500">Currency:</span> {{ show.currency || 'IDR' }}</div>
              <div v-if="show.notes"><span class="text-gray-500">Notes:</span> {{ show.notes }}</div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-4">
            <h4 class="font-semibold mb-2 dark:text-gray-100">Amounts</h4>
            <div class="text-sm space-y-1">
              <div class="flex justify-between"><span class="text-gray-500">Subtotal</span><span>Rp{{ formatNumber(show.subtotal) }}</span></div>
              <div class="flex justify-between"><span class="text-gray-500">Discount</span><span>Rp{{ formatNumber(show.discount_amount) }}</span></div>
              <div class="flex justify-between"><span class="text-gray-500">Tax</span><span>Rp{{ formatNumber(show.tax_amount) }}</span></div>
              <div class="flex justify-between font-semibold"><span>Total</span><span>Rp{{ formatNumber(show.total) }}</span></div>
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
                  <td class="px-6 py-3">{{ it.product_name || it.product?.name || ('#' + it.product_id) }}</td>
                  <td class="px-6 py-3">{{ it.description || '—' }}</td>
                  <td class="px-6 py-3 text-right">{{ formatNumber(it.qty || it.quantity) }}</td>
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
              v-if="canDeliver(show)"
              @click="deliver(show)"
              :disabled="acting"
              class="px-4 py-2 rounded border dark:border-gray-700"
              title="Deliver"
            >
              Deliver
            </button>
            <button
              v-if="canInvoice(show)"
              @click="makeInvoice(show)"
              :disabled="acting"
              class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80"
              title="Create Invoice"
            >
              Make Invoice
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create FROM QUOTATION Modal -->
    <div v-if="modals.fromQuotation" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modals.fromQuotation = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-md p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Create from Quotation</h3>
        <label class="block text-sm mb-1 dark:text-gray-300">Quotation ID</label>
        <input v-model.number="formFromQuotation.quotation_id" type="number" min="1"
               class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
               placeholder="e.g. 12" />
        <p class="text-xs text-gray-500 mt-2">
          This calls <code>/api/quotations/:id/convert</code> to create a Sales Order.
        </p>
        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>
        <div class="mt-5 flex justify-end gap-2">
          <button @click="modals.fromQuotation = false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="createFromQuotation()" :disabled="acting" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ acting ? 'Converting…' : 'Convert' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create DIRECT Modal (needs POST /api/orders) -->
    <div v-if="modals.directCreate" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modals.directCreate = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">New Sales Order</h3>
        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Customer ID<span class="text-red-500">*</span></label>
            <input v-model.number="formDirect.customer_id" type="number" min="1"
                   class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Order Date<span class="text-red-500">*</span></label>
            <input v-model="formDirect.order_date" type="date"
                   class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Currency</label>
            <select v-model="formDirect.currency"
                    class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option v-for="c in ['IDR','USD','EUR','SGD','JPY']" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Notes</label>
            <textarea v-model="formDirect.notes" rows="3"
                      class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"></textarea>
          </div>
        </div>
        <p class="text-xs text-yellow-600 mt-3">
          Requires backend endpoint: <code>POST /api/orders</code>.
        </p>
        <p v-if="error" class="text-sm text-red-500 mt-2">{{ error }}</p>
        <div class="mt-5 flex justify-end gap-2">
          <button @click="modals.directCreate = false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="createDirect()" :disabled="acting"
                  class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
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
  name: "SalesOrders",
  data() {
    return {
      loading: false,
      acting: false,
      rows: [],
      q: { page: 1, perPage: 10, search: "", status: "" },
      page: { current: 1, last: 1, total: 0, from: 0, to: 0, prev: false, next: false },
      statusOptions: ["draft", "confirmed", "delivered", "invoiced", "cancelled"],

      drawer: { open: false },
      show: {},
      items: [],

      // NEW: create/delete
      modals: { fromQuotation: false, directCreate: false },
      formFromQuotation: { quotation_id: null },
      formDirect: { customer_id: null, order_date: "", currency: "IDR", notes: "" },

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
    formatNumber(n) {
      const num = Number(n || 0);
      return num.toLocaleString("id-ID");
    },
    badge(st) {
      const base = "px-2 py-1 text-xs rounded capitalize";
      const map = {
        draft: "bg-gray-100 text-gray-700",
        confirmed: "bg-blue-100 text-blue-700",
        delivered: "bg-green-100 text-green-700",
        invoiced: "bg-purple-100 text-purple-700",
        cancelled: "bg-red-100 text-red-700",
      };
      return `${base} ${map[st] || "bg-gray-100 text-gray-700"}`;
    },

    canDeliver(row) {
      const st = (row?.status || "draft").toLowerCase();
      return st === "confirmed";
    },
    canInvoice(row) {
      const st = (row?.status || "draft").toLowerCase();
      return st === "confirmed" || st === "delivered";
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

        const { data } = await this.api().get("/orders", { params });

        const rawRows = Array.isArray(data?.data) ? data.data : [];
        this.rows = rawRows.map((r) => ({
          ...r,
          subtotal: Number(r.subtotal || 0),
          tax_amount: Number(r.tax_amount || 0),
          total: Number(r.total || 0),
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
          e?.response?.data?.message || e?.message || "Gagal memuat Sales Orders";
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
        const { data } = await this.api().get(`/orders/${row.id}`);
        const order = data?.order || data || {};
        const items = data?.items || order?.items || [];

        this.show = {
          ...order,
          subtotal: Number(order.subtotal || 0),
          discount_amount: Number(order.discount_amount || 0),
          tax_amount: Number(order.tax_amount || 0),
          total: Number(order.total || 0),
        };
        this.items = Array.isArray(items) ? items : [];
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal memuat detail order";
      }
    },

    /* ========= Create (From Quotation) ========= */
    openCreateFromQuotation() {
      this.error = "";
      this.formFromQuotation = { quotation_id: null };
      this.modals.fromQuotation = true;
    },
    async createFromQuotation() {
      if (!this.formFromQuotation.quotation_id) {
        this.error = "Quotation ID wajib diisi.";
        return;
      }
      this.acting = true; this.error = "";
      try {
        const qid = Number(this.formFromQuotation.quotation_id);
        const { data } = await this.api().post(`/quotations/${qid}/convert`);
        this.modals.fromQuotation = false;
        await this.reload();
        alert(data?.message || "Converted to Sales Order");
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal convert quotation";
      } finally {
        this.acting = false;
      }
    },

    /* ========= Create (Direct) ========= */
    openCreateDirect() {
      this.error = "";
      const today = new Date().toISOString().slice(0, 10);
      this.formDirect = { customer_id: null, order_date: today, currency: "IDR", notes: "" };
      this.modals.directCreate = true;
    },
    async createDirect() {
      if (!this.formDirect.customer_id || !this.formDirect.order_date) {
        this.error = "Customer ID dan Order Date wajib diisi.";
        return;
      }
      this.acting = true; this.error = "";
      try {
        // Requires backend POST /api/orders
        await this.api().post("/orders", {
          customer_id: Number(this.formDirect.customer_id),
          order_date: this.formDirect.order_date,
          currency: this.formDirect.currency,
          notes: (this.formDirect.notes || "").trim() || null,
        });
        this.modals.directCreate = false;
        await this.reload();
      } catch (e) {
        const msg = e?.response?.status === 404
          ? "Endpoint POST /api/orders belum tersedia di backend."
          : (e?.response?.data?.message || "Gagal membuat sales order");
        this.error = msg;
      } finally {
        this.acting = false;
      }
    },

    /* ========= Actions ========= */
    async deliver(row) {
      if (!confirm(`Deliver order ${row.number || ('#' + row.id)}?`)) return;
      this.acting = true; this.error = "";
      try {
        await this.api().post(`/orders/${row.id}/deliver`);
        await this.reload();
        if (this.drawer.open && this.show?.id === row.id) {
          await this.openShow(row);
        }
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal melakukan deliver";
      } finally {
        this.acting = false;
      }
    },

    async makeInvoice(row) {
      if (!confirm(`Create invoice from ${row.number || ('#' + row.id)}?`)) return;
      this.acting = true; this.error = "";
      try {
        const { data } = await this.api().post(`/orders/${row.id}/invoice`);
        await this.reload();
        if (this.drawer.open && this.show?.id === row.id) {
          await this.openShow(row);
        }
        alert(data?.message || "Invoice created");
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal membuat invoice";
      } finally {
        this.acting = false;
      }
    },

    /* ========= Delete ========= */
    async confirmDelete(row) {
      if (!confirm(`Hapus Sales Order ${row.number || ('#' + row.id)}?`)) return;
      this.acting = true; this.error = "";
      try {
        // Requires backend DELETE /api/orders/{id}
        await this.api().delete(`/orders/${row.id}`);
        await this.reload();
        if (this.drawer.open && this.show?.id === row.id) {
          this.drawer.open = false;
        }
      } catch (e) {
        const msg = e?.response?.status === 404
          ? "Endpoint DELETE /api/orders/{id} belum tersedia di backend."
          : (e?.response?.data?.message || "Gagal menghapus sales order");
        this.error = msg;
      } finally {
        this.acting = false;
      }
    },
  },
};
</script>
