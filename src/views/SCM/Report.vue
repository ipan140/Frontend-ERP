<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">scm</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Reports</h1>
      </div>
      <div class="flex gap-2 w-full lg:w-auto">
        <input
          v-model="q.search"
          @keyup.enter="reload()"
          class="flex-1 lg:flex-none border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search item/warehouse…"
        />
        <button @click="reload()" class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5">
          Search
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mt-4">
      <div class="flex gap-2 border-b dark:border-gray-700 overflow-x-auto">
        <button
          v-for="t in tabs"
          :key="t.key"
          @click="switchTab(t.key)"
          class="px-4 py-2 -mb-[1px] border-b-2 whitespace-nowrap"
          :class="activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500'"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md p-4">
      <div class="grid md:grid-cols-5 gap-3">
        <div class="md:col-span-2">
          <label class="block text-sm mb-1 dark:text-gray-300">Date From</label>
          <input type="date" v-model="q.date_from" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm mb-1 dark:text-gray-300">Date To</label>
          <input type="date" v-model="q.date_to" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" />
        </div>
        <div class="md:col-span-1">
          <label class="block text-sm mb-1 dark:text-gray-300">Warehouse (optional)</label>
          <input v-model.number="q.warehouse_id" type="number" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" />
        </div>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <button @click="reload()" class="px-4 py-2 rounded border dark:border-gray-700">Apply</button>
        <button @click="resetFilters()" class="px-4 py-2 rounded border dark:border-gray-700">Reset</button>
        <div class="ml-auto"></div>
        <button :disabled="!rows.length" @click="exportCsv()" class="px-4 py-2 rounded bg-primary text-white disabled:opacity-50">Export CSV</button>
      </div>
    </div>

    <!-- Result -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 flex items-center justify-between">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ rows.length }} rows
          <span v-if="meta.total"> • total {{ nf(meta.total) }}</span>
        </div>
        <div class="flex gap-2">
          <button @click="reload()" class="px-3 py-2 rounded border dark:border-gray-700">Reload</button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th v-for="c in columns" :key="c.key" class="px-6 py-3">{{ c.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in rows" :key="r.id ?? i" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td v-for="c in columns" :key="c.key" class="px-6 py-3">
                <span v-if="c.render" v-html="c.render(r)"></span>
                <span v-else>{{ get(r, c.key) }}</span>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td :colspan="columns.length" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="meta.last_page && meta.last_page > 1" class="p-4 flex items-center justify-between text-sm">
        <div>Page {{ meta.current_page }} / {{ meta.last_page }}</div>
        <div class="flex gap-2">
          <button :disabled="meta.current_page<=1" @click="reload(meta.current_page-1)" class="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <button :disabled="meta.current_page>=meta.last_page" @click="reload(meta.current_page+1)" class="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="fixed left-0 right-0 top-0 h-1 bg-primary animate-pulse"></div>
  </div>
</template>

<script>
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { scmApi } from "@/lib/_scmApi";

export default {
  name: "ScmReports",
  data() {
    return {
      loading: false,
      // ⬇️ Keys DISESUAIKAN dengan backend
      tabs: [
        { key: "stock-levels",   label: "Stock Levels" },
        { key: "stock-movements",label: "Stock Movements" },
        { key: "purchases",      label: "Purchases" },
        { key: "shipments",      label: "Shipments" },
        { key: "workorders",     label: "Work Orders" },
      ],
      activeTab: "stock-levels",
      q: {
        search: "",
        date_from: "",
        date_to: "",
        warehouse_id: null,
        page: 1,
        per_page: 20,
      },
      rows: [],
      columns: [],
      meta: { current_page: 1, last_page: 1, total: 0 },
    };
  },
  mounted() {
    this.applyPresetColumns();
    this.reload();
  },
  methods: {
    api() { return scmApi(); },
    alert(icon, title, text) { return Swal.fire({ icon, title, text }); },
    toast(icon, title) {
      const T = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 1600, timerProgressBar: true });
      T.fire({ icon, title });
    },
    nf(v) { try { return new Intl.NumberFormat().format(v ?? 0); } catch { return v; } },
    get(obj, path) {
      if (!path) return "";
      return path.split(".").reduce((o, k) => (o && o[k] != null ? o[k] : ""), obj);
    },

    switchTab(key) {
      this.activeTab = key;
      this.q.page = 1;
      this.applyPresetColumns();
      this.reload();
    },

    applyPresetColumns() {
      const t = this.activeTab;

      if (t === "stock-levels") {
        // Backend: StockLevel::with(['item','location','location.warehouse'])
        this.columns = [
          { key: "item.sku", label: "SKU" },
          { key: "item.name", label: "Item" },
          { key: "location.warehouse.name", label: "Warehouse" },
          { key: "qty", label: "Qty" },
          { key: "item.uom", label: "UoM" },
        ];
      }

      if (t === "stock-movements") {
        // Backend: StockMove::with(['item','fromLocation','toLocation'])
        this.columns = [
          { key: "moved_at", label: "Date" },
          { key: "ref", label: "Reference" },
          { key: "type", label: "Type" },
          { key: "item.name", label: "Item" },
          { key: "fromLocation.code", label: "From" },
          { key: "toLocation.code", label: "To" },
          { key: "qty", label: "Qty" },
        ];
      }

      if (t === "purchases") {
        this.columns = [
          { key: "id", label: "#" },
          { key: "vendor.name", label: "Vendor" },
          { key: "status", label: "Status" },
          { key: "total", label: "Total" },
          { key: "ordered_at", label: "Ordered At" },
        ];
      }

      if (t === "shipments") {
        this.columns = [
          { key: "id", label: "#" },
          { key: "vendor.name", label: "Vendor" },
          { key: "status", label: "Status" },
          { key: "shipped_at", label: "Shipped At" },
        ];
      }

      if (t === "workorders") {
        this.columns = [
          { key: "id", label: "#" },
          { key: "code", label: "Code" },
          { key: "status", label: "Status" },
          { key: "planned_start", label: "Planned Start" },
          { key: "planned_finish", label: "Planned Finish" },
        ];
      }
    },

    unpackRows(payload) {
      if (!payload) return [];
      if (Array.isArray(payload.data)) return payload.data;
      if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
      return [];
    },
    unpackMeta(payload) {
      const p = payload?.data;
      return {
        current_page: p?.current_page ?? 1,
        last_page: p?.last_page ?? 1,
        total: p?.total ?? (Array.isArray(p) ? p.length : 0),
      };
    },

    async reload(page) {
      if (page) this.q.page = page;
      this.loading = true;
      try {
        // Base URL scmApi() sudah /api/scm
        const { data } = await this.api().get(`/reports/${this.activeTab}`, {
          params: {
            date_from: this.q.date_from || undefined,
            date_to: this.q.date_to || undefined,
            warehouse_id: this.q.warehouse_id || undefined,
            search: (this.q.search || "").trim() || undefined,
            page: this.q.page,
            per_page: this.q.per_page,
          },
        });

        this.rows = this.unpackRows(data);
        this.meta = this.unpackMeta(data);

        // Jika server memberi definisi kolom dinamis, pakai itu
        const serverCols = data?.columns;
        if (Array.isArray(serverCols) && serverCols.length) {
          this.columns = serverCols.map(c => ({ key: c.key, label: c.label, render: c.render || null }));
        } else if (!this.columns.length) {
          this.applyPresetColumns();
        }
      } catch (e) {
        this.alert("error", "Load report gagal", e?.response?.data?.message || e.message);
      } finally {
        this.loading = false;
      }
    },

    resetFilters() {
      this.q = { ...this.q, search: "", date_from: "", date_to: "", warehouse_id: null, page: 1 };
      this.reload();
    },

    exportCsv() {
      if (!this.rows.length) return;
      const headers = this.columns.map(c => c.label);
      const lines = [headers.join(",")];

      for (const r of this.rows) {
        const row = this.columns.map(c => {
          const val = c.render ? this.stripHtml(c.render(r)) : this.get(r, c.key);
          return this.csvCell(val);
        });
        lines.push(row.join(","));
      }

      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scm_${this.activeTab}_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.toast("success", "CSV exported");
    },

    stripHtml(html) {
      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
    },

    csvCell(v) {
      if (v == null) return "";
      const s = String(v);
      if (/[",\n]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    },
  },
};
</script>
