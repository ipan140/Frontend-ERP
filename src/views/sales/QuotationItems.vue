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
          class="border rounded px-4 py-2 dark:border-gray-700"
        >
          ← Back to Quotations
        </button>
        <button
          @click="openCreate()"
          class="bg-primary border flex gap-2 text-white hover:bg-primary/80 dark:border-gray-700 rounded py-2.5 px-5"
        >
          <span class="text-2xl">+</span>
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
              <th class="px-6 py-3 w-40"></th>
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
              <td class="px-6 py-3 text-right">
                <button @click="openEdit(r)" class="px-2 py-1 rounded border dark:border-gray-600 mr-2">
                  Edit
                </button>
                <button @click="confirmDelete(r)" class="px-2 py-1 rounded border dark:border-gray-600">
                  Delete
                </button>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="9" class="px-6 py-6 text-center text-gray-400">No items</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">
          {{ modal.mode === 'create' ? 'Add Item' : 'Edit Item' }}
        </h3>

        <div class="grid md:grid-cols-2 gap-3">
          <FormInput v-model.number="form.product_id" label="Product ID" :required="true" placeholder="e.g. 1" />
          <FormInput v-model="form.description" label="Description" placeholder="optional" />
          <FormInput v-model.number="form.qty" label="Qty" type="number" step="0.001" />
          <FormInput v-model="form.uom" label="UoM" placeholder="pcs/pack/bag" />
          <FormInput v-model.number="form.unit_price" label="Unit Price" type="number" step="0.01" />
          <FormInput v-model.number="form.discount_pct" label="Discount (%)" type="number" step="0.01" />
          <FormInput :model-value="calcLineTotal" disabled label="Line Total (auto)" />
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>
        <div v-if="hasFieldErrors" class="mt-2 text-sm text-red-400 space-y-1">
          <div v-for="(arr, key) in fieldErrors" :key="key">{{ key }}: {{ arr?.[0] }}</div>
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open = false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="save()" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "QuotationItems",
  data() {
    return {
      qid: Number(this.$route.params.id),
      header: { number: "", customer: "" },
      loading: false,
      rows: [],
      modal: { open: false, mode: "create" },
      form: this.emptyForm(),
      saving: false,
      error: "",
      fieldErrors: {},
    };
  },
  computed: {
    hasFieldErrors() {
      return this.fieldErrors && Object.keys(this.fieldErrors).length > 0;
    },
    calcLineTotal() {
      const qty = Number(this.form.qty || 0);
      const price = Number(this.form.unit_price || 0);
      const disc = Number(this.form.discount_pct || 0);
      const net = qty * price * (1 - disc / 100);
      return net.toFixed(2);
    },
    grandTotal() {
      return this.rows.reduce((s, r) => s + Number(r.line_total || 0), 0);
    },
  },
  watch: {
    calcLineTotal(n) {
      this.form.line_total = Number(n);
    },
  },
  mounted() {
    this.fetchHeader();
    this.reload();
  },
  methods: {
    emptyForm() {
      return {
        id: null,
        quotation_id: this.qid,
        product_id: null,
        description: "",
        qty: 1,
        uom: "pcs",
        unit_price: 0,
        discount_pct: 0,
        line_total: 0,
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
    nf(n) {
      return Number(n || 0).toLocaleString("id-ID", { maximumFractionDigits: 3 });
    },

    async fetchHeader() {
      try {
        // Endpoint fleksibel—silakan sesuaikan salah satu:
        // 1) /api/quotations/:id  (disarankan)
        // 2) /api/quotations?id=:id
        const { data } = await this.api().get(`/quotations/${this.qid}`);
        this.header.number = data?.number || `#${this.qid}`;
        this.header.customer = data?.customer_name || data?.customer?.name || "";
      } catch {
        this.header.number = `#${this.qid}`;
      }
    },

    async reload() {
      this.loading = true;
      this.error = "";
      this.fieldErrors = {};
      try {
        // Pilihan endpoint (pakai salah satu, sesuaikan backend):
        // GET /api/quotation-items?quotation_id=ID
        // atau GET /api/quotations/ID/items
        const { data } = await this.api().get("/quotation-items", {
          params: { quotation_id: this.qid },
        });
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.rows = list.map((r) => ({
          ...r,
          qty: Number(r.qty || 0),
          unit_price: Number(r.unit_price || 0),
          discount_pct: Number(r.discount_pct || 0),
          line_total: Number(r.line_total || 0),
        }));
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal memuat items";
      } finally {
        this.loading = false;
      }
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
        quotation_id: this.qid,
        product_id: row.product_id || null,
        description: row.description || "",
        qty: Number(row.qty || 0),
        uom: row.uom || "pcs",
        unit_price: Number(row.unit_price || 0),
        discount_pct: Number(row.discount_pct || 0),
        line_total: Number(row.line_total || 0),
      };
    },

    toPayload() {
      const t = (v) => (typeof v === "string" ? v.trim() : v);
      return {
        quotation_id: this.qid,
        product_id:
          this.form.product_id === "" || this.form.product_id == null ? null : Number(this.form.product_id),
        description: t(this.form.description) || null,
        qty: Number(this.form.qty || 0),
        uom: t(this.form.uom) || null,
        unit_price: Number(this.form.unit_price || 0),
        discount_pct: Number(this.form.discount_pct || 0),
        line_total: Number(this.calcLineTotal || this.form.line_total || 0),
      };
    },

    async save() {
      this.saving = true;
      this.error = "";
      this.fieldErrors = {};
      if (!this.form.product_id) {
        this.saving = false;
        this.error = "Product ID wajib diisi.";
        return;
      }
      try {
        const payload = this.toPayload();
        if (this.modal.mode === "create") {
          // POST /api/quotation-items
          await this.api().post("/quotation-items", payload);
        } else {
          // PUT /api/quotation-items/:id
          await this.api().put(`/quotation-items/${this.form.id}`, payload);
        }
        this.modal.open = false;
        await this.reload();
      } catch (e) {
        if (e?.response?.status === 422) {
          this.fieldErrors = e.response.data?.errors || {};
          this.error = Object.values(this.fieldErrors)[0]?.[0] || "Validasi gagal";
        } else {
          this.error = e?.response?.data?.message || "Gagal menyimpan item";
        }
      } finally {
        this.saving = false;
      }
    },

    async confirmDelete(row) {
      if (!confirm(`Hapus item #${row.id}?`)) return;
      try {
        await this.api().delete(`/quotation-items/${row.id}`);
        await this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal menghapus item";
      }
    },
  },
};
</script>
