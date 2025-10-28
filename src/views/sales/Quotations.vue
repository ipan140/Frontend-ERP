<template>
  <div class="p-4">
    <!-- header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">master</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Quotations</h1>
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
        <button
          @click="openCreate()"
          class="bg-primary border flex gap-2 text-white hover:bg-primary/80 dark:border-gray-700 rounded py-2.5 px-5"
        >
          <span class="text-2xl">
            <Icon icon="ic:twotone-plus" />
          </span>
          <span>New Quotation</span>
        </button>
      </div>
    </div>

    <!-- summary cards -->
    <div class="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-3 mt-5">
      <SummaryCard icon-bg="bg-purple-200" icon-color="text-purple-600" title="Total" :value="stats.total" />
      <SummaryCard icon-bg="bg-gray-200" icon-color="text-gray-700" title="Draft" :value="stats.draft" />
      <SummaryCard icon-bg="bg-blue-200" icon-color="text-blue-600" title="Sent" :value="stats.sent" />
      <SummaryCard icon-bg="bg-green-200" icon-color="text-green-600" title="Approved" :value="stats.approved" />
    </div>

    <!-- filter row -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 flex flex-wrap gap-3 items-center justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <label class="text-sm dark:text-gray-300">Status</label>
          <select
            v-model="q.status"
            @change="reload()"
            class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          >
            <option :value="''">All</option>
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
            <option v-for="n in [10, 20, 50]" :key="n" :value="n">{{ n }}</option>
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

      <!-- table -->
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
              <th class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3 font-mono">{{ r.number }}</td>
              <td class="px-6 py-3">{{ r.customer_name || r.customer_id }}</td>
              <td class="px-6 py-3">{{ r.pricelist_name || r.pricelist_id || '-' }}</td>
              <td class="px-6 py-3">{{ r.valid_until || '-' }}</td>
              <td class="px-6 py-3">
                <span :class="statusBadge(r.status)">{{ r.status }}</span>
              </td>
              <td class="px-6 py-3 text-right">Rp{{ fm(r.subtotal) }}</td>
              <td class="px-6 py-3 text-right">Rp{{ fm(r.discount_amount) }}</td>
              <td class="px-6 py-3 text-right">Rp{{ fm(r.tax_amount) }}</td>
              <td class="px-6 py-3 text-right font-medium">Rp{{ fm(r.total) }}</td>
              <td class="px-6 py-3 truncate max-w-[220px]" :title="r.notes">{{ r.notes || '-' }}</td>
              <td class="px-6 py-3 text-right whitespace-nowrap">
                <button @click="openEdit(r)" class="px-2 py-1 rounded border dark:border-gray-600 mr-2" title="Edit">
                  <Icon icon="mdi:pencil" />
                </button>
                <button @click="goItems(r)" class="px-2 py-1 rounded border dark:border-gray-600 mr-2" title="Manage Items">
                  <Icon icon="mdi:format-list-bulleted" />
                </button>
                <button @click="goLogs(r)" class="px-2 py-1 rounded border dark:border-gray-600 mr-2" title="View Logs">
                  <Icon icon="mdi:history" />
                </button>
                <button @click="confirmDelete(r)" class="px-2 py-1 rounded border dark:border-gray-600" title="Delete">
                  <Icon icon="mdi:trash-can-outline" />
                </button>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="11" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- pagination -->
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

    <!-- modal -->
    <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-3xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">
          {{ modal.mode === 'create' ? 'New Quotation' : 'Edit Quotation' }}
        </h3>

        <div class="grid md:grid-cols-2 gap-3">
          <FormInput v-model="form.number" label="Number" placeholder="Auto or custom (e.g. QO-202510-0001)" />
          <FormInput v-model.number="form.customer_id" label="Customer ID" :required="true" placeholder="e.g. 1" />
          <FormInput v-model.number="form.pricelist_id" label="Pricelist ID" placeholder="e.g. 1" />
          <FormInput v-model="form.valid_until" type="date" label="Valid Until" />

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Status</label>
            <select
              v-model="form.status"
              class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="draft">draft</option>
              <option value="sent">sent</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="expired">expired</option>
            </select>
          </div>

          <FormInput v-model.number="form.subtotal" type="number" label="Subtotal" />
          <FormInput v-model.number="form.discount_amount" type="number" label="Discount Amount" />
          <FormInput v-model.number="form.tax_amount" type="number" label="Tax Amount" />
          <FormInput :model-value="calcTotal" disabled label="Total (auto)" />

          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Notes</label>
            <textarea
              v-model="form.notes"
              rows="3"
              class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
              placeholder="Catatan penawaran…"
            ></textarea>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>
        <div v-if="hasFieldErrors" class="mt-2 text-sm text-red-400 space-y-1">
          <div v-for="(arr, key) in fieldErrors" :key="key">{{ key }}: {{ arr?.[0] }}</div>
        </div>

        <div class="mt-5 flex items-center gap-2">
          <!-- tombol sekunder kiri (khusus edit) -->
          <button
            v-if="modal.mode === 'edit'"
            @click="goItems({ id: form.id, number: form.number })"
            class="px-4 py-2 rounded border dark:border-gray-600 mr-auto"
            title="Kelola items untuk quotation ini"
          >
            Manage Items
          </button>
          <button
            v-if="modal.mode === 'edit'"
            @click="goLogs({ id: form.id, number: form.number })"
            class="px-4 py-2 rounded border dark:border-gray-600"
            title="Lihat riwayat status quotation"
          >
            View Logs
          </button>

          <!-- kanan -->
          <div class="ml-auto flex gap-2">
            <button @click="modal.open = false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
            <button @click="save()" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { Icon } from "@iconify/vue";

/**
 * Endpoint (sesuaikan Laravel):
 * GET    /api/quotations
 * POST   /api/quotations
 * PUT    /api/quotations/{id}
 * DELETE /api/quotations/{id}
 */

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
      modal: { open: false, mode: "create" },
      form: this.emptyForm(),
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
    emptyForm() {
      return {
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

    toPayload() {
      const t = (v) => (typeof v === "string" ? v.trim() : v);
      return {
        number: t(this.form.number) || null,
        customer_id:
          this.form.customer_id === "" || this.form.customer_id == null ? null : Number(this.form.customer_id),
        pricelist_id:
          this.form.pricelist_id === "" || this.form.pricelist_id == null ? null : Number(this.form.pricelist_id),
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
        const paramsRaw = {
          page: this.q.page,
          per_page: this.q.perPage,
          search: this.q.search,
          status: this.q.status,
          valid_from: this.q.validFrom,
          valid_to: this.q.validTo,
        };
        const params = Object.fromEntries(
          Object.entries(paramsRaw).filter(([k, v]) => {
            if (v === null || v === undefined) return false;
            if (k === "search") return String(v).trim().length > 0;
            if (k === "status") return String(v).trim().length > 0;
            if (k === "valid_from" || k === "valid_to") return String(v).trim().length > 0;
            return true;
          })
        );

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
        this.error = "Gagal memuat data quotations";
        if (e?.response?.data?.message) this.error += `: ${e.response.data.message}`;
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
      this.form = this.emptyForm();
    },

    openEdit(row) {
      this.modal = { open: true, mode: "edit" };
      this.error = "";
      this.fieldErrors = {};
      this.form = {
        id: row.id,
        number: row.number || "",
        customer_id: row.customer_id === "" || row.customer_id == null ? null : Number(row.customer_id),
        pricelist_id: row.pricelist_id === "" || row.pricelist_id == null ? null : Number(row.pricelist_id),
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
        this.error = "Customer ID wajib diisi.";
        return;
      }
      try {
        const payload = this.toPayload();
        if (this.modal.mode === "create") {
          await this.api().post("/quotations", payload);
        } else {
          await this.api().put(`/quotations/${this.form.id}`, payload);
        }
        this.modal.open = false;
        await this.reload();
      } catch (e) {
        if (e?.response?.status === 422) {
          const errs = e.response.data?.errors || {};
          this.fieldErrors = errs;
          const firstMsg = Object.values(errs)[0]?.[0] || e.response.data?.message || "Validasi gagal";
          this.error = firstMsg;
        } else {
          this.error = e?.response?.data?.message || "Gagal menyimpan data";
        }
      } finally {
        this.saving = false;
      }
    },

    async confirmDelete(row) {
      if (!confirm(`Yakin ingin menghapus quotation ${row.number || row.id}?`)) return;
      try {
        await this.api().delete(`/quotations/${row.id}`);
        await this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal menghapus data";
      }
    },

    /* ====== NEW: navigation to items & logs ====== */
    goItems(row) {
      if (!row?.id) return;
      this.$router.push({ name: "QuotationItems", params: { id: row.id } });
    },
    goLogs(row) {
      if (!row?.id) return;
      this.$router.push({ name: "QuotationLogs", params: { id: row.id } });
    },
  },
};
</script>
