<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">sales</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Quotations</h1>
      </div>

      <div class="flex flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <input
            v-model="q.search"
            @keyup.enter="reload()"
            class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
            placeholder="Search number/customer…"
          />
          <!-- search icon -->
          <button
            @click="reload()"
            class="p-2 rounded border dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Search"
            aria-label="Search"
          >
            <Icon icon="mdi:magnify" class="text-[20px]" />
          </button>
        </div>

        <!-- add icon + text -->
        <button
          @click="openCreate()"
          class="inline-flex items-center gap-2 px-3 py-2 rounded bg-primary text-white hover:bg-primary/80"
          title="New Quotation"
          aria-label="New Quotation"
        >
          <Icon icon="mdi:plus" class="text-[20px]" />
          <span>New Quotation</span>
        </button>
      </div>
    </div>

    <!-- Summary cards (native, tanpa import komponen) -->
    <div class="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-3 mt-5">
      <div class="flex items-center justify-between bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 rounded-md p-4">
        <div>
          <p class="text-sm font-semibold">Total</p>
          <h3 class="text-2xl font-bold">{{ stats.total }}</h3>
        </div>
        <Icon icon="mdi:clipboard-text" class="text-3xl opacity-70" />
      </div>

      <div class="flex items-center justify-between bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md p-4">
        <div>
          <p class="text-sm font-semibold">Draft</p>
          <h3 class="text-2xl font-bold">{{ stats.draft }}</h3>
        </div>
        <Icon icon="mdi:file-document-edit-outline" class="text-3xl opacity-70" />
      </div>

      <div class="flex items-center justify-between bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 rounded-md p-4">
        <div>
          <p class="text-sm font-semibold">Sent</p>
          <h3 class="text-2xl font-bold">{{ stats.sent }}</h3>
        </div>
        <Icon icon="mdi:send" class="text-3xl opacity-70" />
      </div>

      <div class="flex items-center justify-between bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200 rounded-md p-4">
        <div>
          <p class="text-sm font-semibold">Approved</p>
          <h3 class="text-2xl font-bold">{{ stats.approved }}</h3>
        </div>
        <Icon icon="mdi:check-decagram" class="text-3xl opacity-70" />
      </div>
    </div>

    <!-- Filters -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 flex flex-wrap gap-3 items-center justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <label class="text-sm dark:text-gray-300">Status</label>
          <select
            v-model="q.status"
            @change="reload()"
            class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>

          <label class="text-sm ml-3 dark:text-gray-300">Per page</label>
          <select
            v-model.number="q.perPage"
            @change="reload()"
            class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          >
            <option v-for="n in [10,20,50]" :key="n" :value="n">{{ n }}</option>
          </select>

          <label class="text-sm ml-3 dark:text-gray-300">Valid Until</label>
          <input
            type="date"
            v-model="q.validFrom"
            @change="reload()"
            class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          />
          <span class="text-gray-400">–</span>
          <input
            type="date"
            v-model="q.validTo"
            @change="reload()"
            class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          />
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
              <th class="px-6 py-3">Pricelist</th>
              <th class="px-6 py-3">Valid Until</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3 text-right">Subtotal</th>
              <th class="px-6 py-3 text-right">Discount</th>
              <th class="px-6 py-3 text-right">Tax</th>
              <th class="px-6 py-3 text-right">Total</th>
              <th class="px-6 py-3">Notes</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3 font-mono">{{ r.number }}</td>
              <td class="px-6 py-3">{{ r.customer_name || r.customer_id }}</td>
              <td class="px-6 py-3">{{ r.pricelist_name || r.pricelist_id || '-' }}</td>
              <td class="px-6 py-3">{{ r.valid_until || '-' }}</td>
              <td class="px-6 py-3"><span :class="statusBadge(r.status)">{{ r.status }}</span></td>
              <td class="px-6 py-3 text-right">Rp{{ fm(r.subtotal) }}</td>
              <td class="px-6 py-3 text-right">Rp{{ fm(r.discount_amount) }}</td>
              <td class="px-6 py-3 text-right">Rp{{ fm(r.tax_amount) }}</td>
              <td class="px-6 py-3 text-right font-medium">Rp{{ fm(r.total) }}</td>
              <td class="px-6 py-3 truncate max-w-[220px]" :title="r.notes">{{ r.notes || '-' }}</td>

              <!-- Icon-only actions -->
              <td class="px-6 py-3 text-right whitespace-nowrap space-x-1">
                <button class="p-1.5 rounded border dark:border-gray-600" @click="openView(r)" title="View" aria-label="View">
                  <Icon icon="mdi:eye-outline" class="text-[18px]" />
                </button>
                <button class="p-1.5 rounded border dark:border-gray-600" @click="openEdit(r)" title="Edit" aria-label="Edit">
                  <Icon icon="mdi:pencil" class="text-[18px]" />
                </button>
                <button class="p-1.5 rounded border dark:border-gray-600" @click="goItems(r)" title="Items" aria-label="Items">
                  <Icon icon="mdi:format-list-bulleted" class="text-[18px]" />
                </button>
                <button class="p-1.5 rounded border dark:border-gray-600" @click="goLogs(r)" title="Logs" aria-label="Logs">
                  <Icon icon="mdi:history" class="text-[18px]" />
                </button>
                <button class="p-1.5 rounded border dark:border-gray-600" @click="confirmDelete(r)" title="Delete" aria-label="Delete">
                  <Icon icon="mdi:trash-can-outline" class="text-[18px]" />
                </button>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="11" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-5 py-4 flex items-center justify-between">
        <button :disabled="!page.prev" @click="go(page.current - 1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">
          Prev
        </button>
        <div class="text-sm text-gray-500 dark:text-gray-400">Page {{ page.current || 1 }} / {{ page.last || 1 }}</div>
        <button :disabled="!page.next" @click="go(page.current + 1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">
          Next
        </button>
      </div>
    </div>

    <!-- View Modal (read-only) -->
    <div v-if="view.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="view.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-3xl p-6">
        <div class="flex items-start justify-between">
          <h3 class="text-lg font-semibold dark:text-gray-200">Quotation Details</h3>
          <button class="p-1.5 rounded border dark:border-gray-600" @click="view.open=false" aria-label="Close">
            <Icon icon="mdi:close" class="text-[18px]" />
          </button>
        </div>

        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><div class="text-gray-500 dark:text-gray-400">Number</div><div class="font-medium">{{ view.row.number || '-' }}</div></div>
          <div><div class="text-gray-500 dark:text-gray-400">Status</div><div class="font-medium"><span :class="statusBadge(view.row.status)">{{ view.row.status }}</span></div></div>
          <div><div class="text-gray-500 dark:text-gray-400">Customer</div><div class="font-medium">{{ view.row.customer_name || view.row.customer_id || '-' }}</div></div>
          <div><div class="text-gray-500 dark:text-gray-400">Pricelist</div><div class="font-medium">{{ view.row.pricelist_name || view.row.pricelist_id || '-' }}</div></div>
          <div><div class="text-gray-500 dark:text-gray-400">Valid Until</div><div class="font-medium">{{ view.row.valid_until || '-' }}</div></div>
          <div><div class="text-gray-500 dark:text-gray-400">Subtotal</div><div class="font-medium">Rp{{ fm(view.row.subtotal) }}</div></div>
          <div><div class="text-gray-500 dark:text-gray-400">Discount</div><div class="font-medium">Rp{{ fm(view.row.discount_amount) }}</div></div>
          <div><div class="text-gray-500 dark:text-gray-400">Tax</div><div class="font-medium">Rp{{ fm(view.row.tax_amount) }}</div></div>
          <div><div class="text-gray-500 dark:text-gray-400">Total</div><div class="font-medium">Rp{{ fm(view.row.total) }}</div></div>
          <div class="sm:col-span-2"><div class="text-gray-500 dark:text-gray-400">Notes</div><div class="font-medium whitespace-pre-line">{{ view.row.notes || '-' }}</div></div>
          <div v-if="view.extra.created_at"><div class="text-gray-500 dark:text-gray-400">Created</div><div class="font-medium">{{ view.extra.created_at }}</div></div>
          <div v-if="view.extra.updated_at"><div class="text-gray-500 dark:text-gray-400">Updated</div><div class="font-medium">{{ view.extra.updated_at }}</div></div>
        </div>

        <div class="mt-5 flex gap-2">
          <button @click="goItems(view.row)" class="p-2 rounded border dark:border-gray-600" title="Manage Items">
            <Icon icon="mdi:format-list-bulleted" class="text-[18px]" />
          </button>
          <button @click="goLogs(view.row)" class="p-2 rounded border dark:border-gray-600" title="View Logs">
            <Icon icon="mdi:history" class="text-[18px]" />
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-3xl p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold dark:text-gray-200">
            {{ modal.mode === 'create' ? 'New Quotation' : 'Edit Quotation' }}
          </h3>
          <button class="p-1.5 rounded border dark:border-gray-600" @click="modal.open=false" aria-label="Close">
            <Icon icon="mdi:close" class="text-[18px]" />
          </button>
        </div>

        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Number</label>
            <input v-model="form.number" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="Auto or custom (e.g. QO-202510-0001)" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Customer ID<span class="text-red-500">*</span></label>
            <input v-model.number="form.customer_id" type="number" min="1" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="e.g. 1" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Pricelist ID</label>
            <input v-model.number="form.pricelist_id" type="number" min="1" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="e.g. 1" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Valid Until</label>
            <input v-model="form.valid_until" type="date" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Status</label>
            <select v-model="form.status" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option value="draft">draft</option>
              <option value="sent">sent</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="expired">expired</option>
            </select>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Subtotal</label>
            <input v-model.number="form.subtotal" type="number" min="0" step="0.01" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Discount Amount</label>
            <input v-model.number="form.discount_amount" type="number" min="0" step="0.01" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Tax Amount</label>
            <input v-model.number="form.tax_amount" type="number" min="0" step="0.01" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Total (auto)</label>
            <input :value="calcTotal" disabled class="w-full border dark:border-gray-700 rounded px-3 py-2 bg-gray-50 dark:bg-gray-900/50 dark:text-gray-300" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Notes</label>
            <textarea v-model="form.notes" rows="3" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="Catatan penawaran…"></textarea>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>
        <div v-if="hasFieldErrors" class="mt-2 text-sm text-red-400 space-y-1">
          <div v-for="(arr, key) in fieldErrors" :key="key">{{ key }}: {{ arr?.[0] }}</div>
        </div>

        <div class="mt-5 flex items-center gap-2">
          <!-- ikon kiri (khusus edit) -->
          <div class="mr-auto flex gap-2" v-if="modal.mode==='edit'">
            <button @click="goItems({ id: form.id, number: form.number })" class="p-2 rounded border dark:border-gray-600" title="Manage Items">
              <Icon icon="mdi:format-list-bulleted" class="text-[18px]" />
            </button>
            <button @click="goLogs({ id: form.id, number: form.number })" class="p-2 rounded border dark:border-gray-600" title="View Logs">
              <Icon icon="mdi:history" class="text-[18px]" />
            </button>
          </div>

          <div class="ml-auto flex gap-2">
            <button @click="modal.open=false" class="p-2 rounded border dark:border-gray-600" title="Cancel">
              <Icon icon="mdi:close" class="text-[18px]" />
            </button>
            <button @click="save()" :disabled="saving" class="p-2 rounded bg-primary text-white hover:bg-primary/80" title="Save">
              <Icon :icon="saving ? 'mdi:loading' : 'mdi:content-save-outline'" :class="['text-[18px]', saving && 'animate-spin']" />
            </button>
          </div>
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
import { Icon } from "@iconify/vue";

export default {
  name: "Quotations",
  components: { Icon },

  data() {
    return {
      loading: false,
      rows: [],
      q: { page: 1, perPage: 10, search: "", status: "", validFrom: "", validTo: "" },
      page: { current: 1, last: 1, total: 0, from: 0, to: 0, prev: false, next: false },
      stats: { total: 0, draft: 0, sent: 0, approved: 0 },

      view: { open: false, row: {}, extra: {} },

      modal: { open: false, mode: "create" },
      form: {
        id: null,
        number: "",
        customer_id: null,
        pricelist_id: null,
        valid_until: "",
        status: "draft",
        subtotal: 0,
        discount_amount: 0,
        tax_amount: 0,
        total: 0,
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
      const d = Number(this.form.discount_amount || 0);
      const t = Number(this.form.tax_amount || 0);
      return (s - d + t).toFixed(2);
    },
    hasFieldErrors() {
      return this.fieldErrors && Object.keys(this.fieldErrors).length > 0;
    },
  },

  watch: {
    calcTotal(n) {
      this.form.total = Number(n);
    },
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

    fm(n) {
      return Number(n || 0).toLocaleString("id-ID");
    },
    statusBadge(st) {
      const base = "px-2 py-1 text-xs rounded";
      const map = {
        draft: "bg-gray-100 text-gray-700",
        sent: "bg-blue-100 text-blue-700",
        approved: "bg-green-100 text-green-700",
        rejected: "bg-red-100 text-red-700",
        expired: "bg-orange-100 text-orange-700",
      };
      return `${base} ${map[st] || "bg-gray-100 text-gray-700"}`;
    },

    cleanParams(p) {
      const out = { ...p };
      if (!String(out.search || "").trim()) delete out.search;
      if (!String(out.status || "").trim()) delete out.status;
      if (!String(out.validFrom || "").trim()) delete out.validFrom;
      if (!String(out.validTo || "").trim()) delete out.validTo;
      return out;
    },

    toPayload() {
      const t = (v) => (typeof v === "string" ? v.trim() : v);
      return {
        number: t(this.form.number) || null,
        customer_id:
          this.form.customer_id == null || this.form.customer_id === ""
            ? null
            : Number(this.form.customer_id),
        pricelist_id:
          this.form.pricelist_id == null || this.form.pricelist_id === ""
            ? null
            : Number(this.form.pricelist_id),
        valid_until: t(this.form.valid_until) || null,
        status: t(this.form.status) || "draft",
        subtotal: Number(this.form.subtotal || 0),
        discount_amount: Number(this.form.discount_amount || 0),
        tax_amount: Number(this.form.tax_amount || 0),
        total: Number(this.calcTotal || this.form.total || 0),
        notes: t(this.form.notes) || null,
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
          status: this.q.status,
          valid_from: this.q.validFrom,
          valid_to: this.q.validTo,
        });

        const { data } = await this.api().get("/quotations", { params });

        const rawRows = Array.isArray(data?.data) ? data.data : [];
        this.rows = rawRows.map((r) => ({
          ...r,
          subtotal: Number(r.subtotal || 0),
          discount_amount: Number(r.discount_amount || 0),
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

        this.stats.total = this.page.total;
        this.stats.draft = this.rows.filter((x) => x.status === "draft").length;
        this.stats.sent = this.rows.filter((x) => x.status === "sent").length;
        this.stats.approved = this.rows.filter((x) => x.status === "approved").length;
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal memuat data quotations";
        this.toast("error", this.error);
      } finally {
        this.loading = false;
      }
    },

    go(p) {
      this.q.page = Math.max(1, p);
      this.reload();
    },

    /* View (read-only) */
    async openView(row) {
      try {
        const { data } = await this.api().get(`/quotations/${row.id}`);
        const r = data?.quotation || data?.data || data || row;
        this.view = { open: true, row: r, extra: { created_at: r.created_at, updated_at: r.updated_at } };
      } catch {
        this.view = { open: true, row, extra: {} };
      }
    },

    /* Create/Edit */
    openCreate() {
      this.modal = { open: true, mode: "create" };
      this.error = "";
      this.fieldErrors = {};
      this.form = {
        id: null,
        number: "",
        customer_id: null,
        pricelist_id: null,
        valid_until: "",
        status: "draft",
        subtotal: 0,
        discount_amount: 0,
        tax_amount: 0,
        total: 0,
        notes: "",
      };
    },
    openEdit(row) {
      this.modal = { open: true, mode: "edit" };
      this.error = "";
      this.fieldErrors = {};
      this.form = {
        id: row.id,
        number: row.number || "",
        customer_id:
          row.customer_id == null || row.customer_id === "" ? null : Number(row.customer_id),
        pricelist_id:
          row.pricelist_id == null || row.pricelist_id === "" ? null : Number(row.pricelist_id),
        valid_until: row.valid_until || "",
        status: row.status || "draft",
        subtotal: Number(row.subtotal || 0),
        discount_amount: Number(row.discount_amount || 0),
        tax_amount: Number(row.tax_amount || 0),
        total: Number(row.total || 0),
        notes: row.notes || "",
      };
    },

    async save() {
      this.saving = true;
      this.error = "";
      this.fieldErrors = {};

      if (!this.form.customer_id) {
        this.saving = false;
        this.toast("warning", "Customer ID wajib diisi.");
        this.error = "Customer ID wajib diisi.";
        return;
      }

      try {
        const payload = this.toPayload();
        if (this.modal.mode === "create") {
          await this.api().post("/quotations", payload);
          this.toast("success", "Quotation created");
        } else {
          await this.api().put(`/quotations/${this.form.id}`, payload);
          this.toast("success", "Quotation updated");
        }
        this.modal.open = false;
        await this.reload();
      } catch (e) {
        if (e?.response?.status === 422) {
          const errs = e.response.data?.errors || {};
          this.fieldErrors = errs;
          const msg =
            Object.values(errs)[0]?.[0] || e.response.data?.message || "Validasi gagal";
          this.error = msg;
          this.toast("error", msg);
        } else {
          this.error = e?.response?.data?.message || "Gagal menyimpan data";
          this.toast("error", this.error);
        }
      } finally {
        this.saving = false;
      }
    },

    async confirmDelete(row) {
      const res = await Swal.fire({
        title: "Delete quotation?",
        text: `Hapus quotation ${row.number || row.id} permanen.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        confirmButtonColor: "#ef4444",
      });
      if (!res.isConfirmed) return;

      try {
        await this.api().delete(`/quotations/${row.id}`);
        this.toast("success", "Quotation deleted");
        await this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal menghapus data";
        this.toast("error", this.error);
      }
    },

    /* Navigation */
    goItems(row) {
      if (row?.id) this.$router.push({ name: "QuotationItems", params: { id: row.id } });
    },
    goLogs(row) {
      if (row?.id) this.$router.push({ name: "QuotationLogs", params: { id: row.id } });
    },
  },
};
</script>
