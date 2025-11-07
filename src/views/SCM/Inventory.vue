<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">scm</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Inventory</h1>
      </div>
      <div class="flex gap-2 w-full lg:w-auto">
        <input
          v-model="search"
          @keyup.enter="loadStocks(1)"
          class="flex-1 lg:flex-none border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search item/location…"
        />
        <button
          @click="loadStocks(1)"
          class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5"
        >
          Search
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mt-4">
      <div class="flex gap-2 border-b dark:border-gray-700">
        <button
          v-for="t in tabs"
          :key="t.key"
          @click="switchTab(t.key)"
          class="px-4 py-2 -mb-[1px] border-b-2"
          :class="activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500'"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <!-- Tab: Stocks -->
    <div v-if="activeTab==='stocks'" class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 flex items-center justify-between">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ stocks.length }} rows
          <span v-if="stocksMeta.total"> • total {{ nf(stocksMeta.total) }}</span>
        </div>
        <div class="flex gap-2">
          <button @click="loadStocks(stocksMeta.current_page)" class="px-3 py-2 rounded border dark:border-gray-700">Reload</button>
          <button @click="openReceipt" class="px-3 py-2 rounded bg-primary text-white">Post Receipt</button>
          <button @click="openTransfer" class="px-3 py-2 rounded bg-primary text-white">Internal Transfer</button>
          <button @click="openAdjust" class="px-3 py-2 rounded bg-primary text-white">Adjust</button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">Item</th>
              <th class="px-6 py-3">Location</th>
              <th class="px-6 py-3">Warehouse</th>
              <th class="px-6 py-3 text-right">Qty</th>
              <th class="px-6 py-3">UoM</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in stocks" :key="r.id ?? `${r.item_id}-${r.location_id}`" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3">
                <div class="font-medium">{{ r.item?.name || ('#'+r.item_id) }}</div>
                <div class="text-xs text-gray-500">SKU: {{ r.item?.sku || '-' }}</div>
              </td>
              <td class="px-6 py-3">
                <div class="font-mono">{{ r.location?.code || ('L'+r.location_id) }}</div>
                <div class="text-xs text-gray-500">{{ r.location?.name || '-' }}</div>
              </td>
              <td class="px-6 py-3">{{ r.location?.warehouse?.name || '-' }}</td>
              <td class="px-6 py-3 text-right">{{ nf(r.qty) }}</td>
              <td class="px-6 py-3">{{ r.item?.uom || '-' }}</td>
            </tr>
            <tr v-if="!loading && !stocks.length">
              <td colspan="5" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="stocksMeta.last_page && stocksMeta.last_page > 1" class="p-4 flex items-center justify-between text-sm">
        <div>Page {{ stocksMeta.current_page }} / {{ stocksMeta.last_page }}</div>
        <div class="flex gap-2">
          <button :disabled="stocksMeta.current_page<=1" @click="loadStocks(stocksMeta.current_page-1)" class="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <button :disabled="stocksMeta.current_page>=stocksMeta.last_page" @click="loadStocks(stocksMeta.current_page+1)" class="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>

    <!-- Tab: Lots -->
    <div v-if="activeTab==='lots'" class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 flex items-center justify-between">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ lots.length }} rows
          <span v-if="lotsMeta.total"> • total {{ nf(lotsMeta.total) }}</span>
        </div>
        <div class="flex gap-2">
          <button @click="loadLots(lotsMeta.current_page)" class="px-3 py-2 rounded border dark:border-gray-700">Reload</button>
          <button @click="openCreateLot" class="px-3 py-2 rounded bg-primary text-white">Create Lot</button>
          <button @click="loadExpiryAlerts" class="px-3 py-2 rounded border dark:border-gray-700">Expiry Alerts</button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">Lot No</th>
              <th class="px-6 py-3">Item</th>
              <th class="px-6 py-3">MFG</th>
              <th class="px-6 py-3">Expiry</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in lots" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3 font-mono">{{ r.number }}</td>
              <td class="px-6 py-3">{{ r.item?.name || ('#'+r.item_id) }}</td>
              <td class="px-6 py-3">{{ r.mfg_date || '-' }}</td>
              <td class="px-6 py-3">{{ r.expiry_date || '-' }}</td>
            </tr>
            <tr v-if="!loading && !lots.length">
              <td colspan="4" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="lotsMeta.last_page && lotsMeta.last_page > 1" class="p-4 flex items-center justify-between text-sm">
        <div>Page {{ lotsMeta.current_page }} / {{ lotsMeta.last_page }}</div>
        <div class="flex gap-2">
          <button :disabled="lotsMeta.current_page<=1" @click="loadLots(lotsMeta.current_page-1)" class="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <button :disabled="lotsMeta.current_page>=lotsMeta.last_page" @click="loadLots(lotsMeta.current_page+1)" class="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>

      <!-- Expiry alert result -->
      <div v-if="expiryAlerts.length" class="p-5">
        <h3 class="font-semibold mb-2 dark:text-gray-200">Expiry Alerts</h3>
        <pre class="text-xs overflow-auto p-3 bg-gray-50 dark:bg-gray-900 rounded border dark:border-gray-700">
{{ JSON.stringify(expiryAlerts, null, 2) }}
        </pre>
      </div>
    </div>

    <!-- ===== Modals (Receipt / Transfer / Adjust / Create Lot) ===== -->

    <!-- Modal: Receipt -->
    <div v-if="modals.receipt" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="closeAll"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Post Receipt</h3>
        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">Location ID</label>
            <input v-model.number="receipt.location_id" type="number" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm mb-1">Lines (item_id, qty, uom, lot_id?)</label>
            <textarea v-model="receiptLinesRaw" rows="4" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" placeholder='[{"item_id":1,"qty":10,"uom":"kg"}]'></textarea>
          </div>
        </div>
        <div class="mt-4 text-right flex gap-2 justify-end">
          <button @click="closeAll" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="submitReceipt" class="px-4 py-2 rounded bg-primary text-white">Submit</button>
        </div>
      </div>
    </div>

    <!-- Modal: Transfer -->
    <div v-if="modals.transfer" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="closeAll"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Internal Transfer</h3>
        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">From Location</label>
            <input v-model.number="transfer.from_location_id" type="number" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div>
            <label class="block text-sm mb-1">To Location</label>
            <input v-model.number="transfer.to_location_id" type="number" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm mb-1">Lines (item_id, qty, uom, lot_id?)</label>
            <textarea v-model="transferLinesRaw" rows="4" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" placeholder='[{"item_id":1,"qty":5,"uom":"kg"}]'></textarea>
          </div>
        </div>
        <div class="mt-4 text-right flex gap-2 justify-end">
          <button @click="closeAll" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="submitTransfer" class="px-4 py-2 rounded bg-primary text-white">Submit</button>
        </div>
      </div>
    </div>

    <!-- Modal: Adjust -->
    <div v-if="modals.adjust" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="closeAll"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Stock Adjust</h3>
        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">Location ID</label>
            <input v-model.number="adjust.location_id" type="number" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div>
            <label class="block text-sm mb-1">Reason</label>
            <select v-model="adjust.reason" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700">
              <option value="count">count</option>
              <option value="waste">waste</option>
              <option value="shrink">shrink</option>
              <option value="other">other</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm mb-1">Lines (item_id, diff_qty [+/-], uom)</label>
            <textarea v-model="adjustLinesRaw" rows="4" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" placeholder='[{"item_id":1,"diff_qty":-2,"uom":"kg"}]'></textarea>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm mb-1">Note</label>
            <input v-model="adjust.note" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
        </div>
        <div class="mt-4 text-right flex gap-2 justify-end">
          <button @click="closeAll" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="submitAdjust" class="px-4 py-2 rounded bg-primary text-white">Submit</button>
        </div>
      </div>
    </div>

    <!-- Modal: Create Lot -->
    <div v-if="modals.createLot" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="closeAll"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Create Lot</h3>
        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">Item ID</label>
            <input v-model.number="createLot.item_id" type="number" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div>
            <label class="block text-sm mb-1">Lot Number</label>
            <input v-model="createLot.number" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" placeholder="e.g. BATCH-2025-001"/>
          </div>
          <div>
            <label class="block text-sm mb-1">MFG Date</label>
            <input v-model="createLot.mfg_date" type="date" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div>
            <label class="block text-sm mb-1">Expiry Date</label>
            <input v-model="createLot.expiry_date" type="date" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
        </div>
        <div class="mt-4 text-right flex gap-2 justify-end">
          <button @click="closeAll" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="submitCreateLot" class="px-4 py-2 rounded bg-primary text-white">Create</button>
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
  name: "Inventory",
  data() {
    return {
      loading: false,
      activeTab: "stocks",
      tabs: [
        { key: "stocks", label: "Stocks" },
        { key: "lots",   label: "Lots" },
      ],
      search: "",
      stocks: [],
      lots: [],
      expiryAlerts: [],
      stocksMeta: { current_page: 1, last_page: 1, total: 0 },
      lotsMeta:   { current_page: 1, last_page: 1, total: 0 },
      modals: { receipt: false, transfer: false, adjust: false, createLot: false },
      receipt: { location_id: null, items: [] },
      receiptLinesRaw: '[{"item_id":1,"qty":10,"uom":"kg"}]',
      transfer: { from_location_id: null, to_location_id: null, items: [] },
      transferLinesRaw: '[{"item_id":1,"qty":5,"uom":"kg"}]',
      adjust: { location_id: null, reason: "count", moved_at: "", note: "" },
      adjustLinesRaw: '[{"item_id":1,"diff_qty":-2,"uom":"kg"}]',
      createLot: { item_id: null, number: "", mfg_date: "", expiry_date: "" },
    };
  },
  mounted() {
    this.loadStocks(1);
    this.loadLots(1);
  },
  methods: {
    api() { return scmApi(); },

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

    nf(v) { try { return new Intl.NumberFormat().format(v ?? 0); } catch { return v; } },

    async loadStocks(page = 1) {
      this.loading = true;
      try {
        const { data } = await this.api().get("/inventory/stocks", {
          params: { search: this.search, page, per_page: 20 },
        });
        this.stocks = this.unpackRows(data);
        this.stocksMeta = this.unpackMeta(data);
      } catch (e) {
        this.alert("error", "Load Stocks gagal", e?.response?.data?.message || e.message);
      } finally {
        this.loading = false;
      }
    },

    async loadLots(page = 1) {
      this.loading = true;
      try {
        const { data } = await this.api().get("/inventory/lots", {
          params: { page, per_page: 20 },
        });
        this.lots = this.unpackRows(data);
        this.lotsMeta = this.unpackMeta(data);
      } catch (e) {
        this.alert("error", "Load Lots gagal", e?.response?.data?.message || e.message);
      } finally {
        this.loading = false;
      }
    },

    async loadExpiryAlerts(days = 14) {
      this.loading = true;
      try {
        const { data } = await this.api().get("/inventory/expiry-alerts", { params: { days } });
        this.expiryAlerts = data?.data || [];
        this.toast("success", `Loaded expiry alerts (≤ ${data?.threshold_days ?? days} days)`);
      } catch (e) {
        this.alert("error", "Load Alerts gagal", e?.response?.data?.message || e.message);
      } finally {
        this.loading = false;
      }
    },

    switchTab(key) {
      this.activeTab = key;
      if (key === "stocks" && !this.stocks.length) this.loadStocks(1);
      if (key === "lots" && !this.lots.length) this.loadLots(1);
    },

    openReceipt()  { this.modals = { receipt: true,  transfer: false, adjust: false, createLot: false }; },
    openTransfer() { this.modals = { receipt: false, transfer: true,  adjust: false, createLot: false }; },
    openAdjust()   { this.modals = { receipt: false, transfer: false, adjust: true,  createLot: false }; },
    openCreateLot(){ this.modals = { receipt: false, transfer: false, adjust: false, createLot: true  }; },
    closeAll()     { this.modals = { receipt: false, transfer: false, adjust: false, createLot: false }; },

    async submitReceipt() {
      let lines;
      try { lines = JSON.parse(this.receiptLinesRaw || "[]"); }
      catch { return this.alert("warning", "Format salah", "Lines harus JSON array"); }

      if (!this.receipt.location_id || !lines.length)
        return this.alert("warning", "Validasi", "Lengkapi location & lines");

      const items = lines.map(x => ({
        item_id: Number(x.item_id ?? x.product_id),
        qty: Number(x.qty),
        uom: String(x.uom || '').trim(),
        ...(x.lot_id ? { lot_id: Number(x.lot_id) } : {}),
      })).filter(x => x.item_id && x.qty && x.uom);

      if (!items.length) return this.alert("warning", "Validasi", "Lines kosong/invalid");

      this.loading = true;
      try {
        await this.api().post("/inventory/receipt", {
          location_id: Number(this.receipt.location_id),
          items,
        });
        this.toast("success", "Receipt posted");
        this.closeAll();
        this.loadStocks(this.stocksMeta.current_page);
      } catch (e) {
        this.alert("error", "Receipt gagal", e?.response?.data?.message || e.message);
      } finally {
        this.loading = false;
      }
    },

    async submitTransfer() {
      let lines;
      try { lines = JSON.parse(this.transferLinesRaw || "[]"); }
      catch { return this.alert("warning", "Format salah", "Lines harus JSON array"); }

      if (!this.transfer.from_location_id || !this.transfer.to_location_id || !lines.length)
        return this.alert("warning", "Validasi", "Lengkapi from/to & lines");

      const items = lines.map(x => ({
        item_id: Number(x.item_id ?? x.product_id),
        qty: Number(x.qty),
        uom: String(x.uom || '').trim(),
        ...(x.lot_id ? { lot_id: Number(x.lot_id) } : {}),
      })).filter(x => x.item_id && x.qty && x.uom);

      if (!items.length) return this.alert("warning", "Validasi", "Lines kosong/invalid");

      this.loading = true;
      try {
        await this.api().post("/inventory/transfer", {
          from_location_id: Number(this.transfer.from_location_id),
          to_location_id: Number(this.transfer.to_location_id),
          items,
        });
        this.toast("success", "Transfer executed");
        this.closeAll();
        this.loadStocks(this.stocksMeta.current_page);
      } catch (e) {
        this.alert("error", "Transfer gagal", e?.response?.data?.message || e.message);
      } finally {
        this.loading = false;
      }
    },

    // API adjust menerima single item; UI loop per-line
    async submitAdjust() {
      let lines;
      try { lines = JSON.parse(this.adjustLinesRaw || "[]"); }
      catch { return this.alert("warning", "Format salah", "Lines harus JSON array"); }

      if (!this.adjust.location_id || !this.adjust.reason || !lines.length)
        return this.alert("warning", "Validasi", "Lengkapi location, reason, dan lines");

      const payloads = lines.map(x => ({
        location_id: Number(this.adjust.location_id),
        item_id: Number(x.item_id ?? x.product_id),
        diff_qty: Number(x.diff_qty ?? x.qty),
        uom: String(x.uom || '').trim(),
        reason: this.adjust.reason,
        moved_at: this.adjust.moved_at || null,
        note: this.adjust.note || null,
      })).filter(p => p.item_id && p.diff_qty && p.uom);

      if (!payloads.length) return this.alert("warning", "Validasi", "Lines kosong/invalid");

      this.loading = true;
      try {
        await Promise.all(payloads.map(p => this.api().post("/inventory/adjust", p)));
        this.toast("success", "Adjustment recorded");
        this.closeAll();
        this.loadStocks(this.stocksMeta.current_page);
      } catch (e) {
        this.alert("error", "Adjust gagal", e?.response?.data?.message || e.message);
      } finally {
        this.loading = false;
      }
    },

    async submitCreateLot() {
      if (!this.createLot.item_id || !this.createLot.number)
        return this.alert("warning", "Validasi", "Item dan Lot Number wajib");

      this.loading = true;
      try {
        await this.api().post("/inventory/lots", {
          item_id: Number(this.createLot.item_id),
          number: String(this.createLot.number).trim(),
          mfg_date: this.createLot.mfg_date || null,
          expiry_date: this.createLot.expiry_date || null,
        });
        this.toast("success", "Lot created");
        this.closeAll();
        this.loadLots(this.lotsMeta.current_page);
      } catch (e) {
        this.alert("error", "Create lot gagal", e?.response?.data?.message || e.message);
      } finally {
        this.loading = false;
      }
    },

    // sweetalert helpers
    toast(icon, title) {
      const T = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 1600, timerProgressBar: true });
      T.fire({ icon, title });
    },
    alert(icon, title, text) { return Swal.fire({ icon, title, text }); },
  },
};
</script>
