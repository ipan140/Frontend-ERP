<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">scm</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Purchases</h1>
      </div>

      <div class="flex gap-2 w-full lg:w-auto">
        <input
          v-model="q.search"
          @keyup.enter="reload"
          class="flex-1 lg:flex-none border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search vendor/ref/notes…"
        />
        <button @click="reload" class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5">
          Search
        </button>
        <button @click="openCreate" class="bg-primary text-white rounded px-5 py-2">
          Create PO
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mt-4">
      <div class="flex gap-2 border-b dark:border-gray-700">
        <button v-for="t in tabs" :key="t.key"
                @click="activeTab = t.key"
                class="px-4 py-2 -mb-[1px] border-b-2"
                :class="activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500'">
          {{ t.label }}
        </button>
      </div>
    </div>

    <!-- List -->
    <div v-if="activeTab==='list'" class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 flex flex-wrap gap-3 items-center justify-between">
        <div class="flex items-center gap-2">
          <label class="text-sm dark:text-gray-300">Status</label>
          <select v-model="q.status" @change="reload" class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ rows.length }} rows
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">#</th>
              <th class="px-6 py-3">Vendor</th>
              <th class="px-6 py-3">Expected</th>
              <th class="px-6 py-3">Items</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3 font-mono">{{ r.id }}</td>
              <td class="px-6 py-3">{{ r.vendor_id }}</td>
              <td class="px-6 py-3">{{ r.expected_date || '-' }}</td>
              <td class="px-6 py-3">{{ r.items_count ?? r.items?.length ?? 0 }}</td>
              <td class="px-6 py-3">
                <span class="px-2 py-1 text-xs rounded" :class="badgeClass(r.status)">{{ r.status || 'draft' }}</span>
              </td>
              <td class="px-6 py-3 text-right space-x-2">
                <button class="px-2 py-1 rounded border dark:border-gray-600" @click="openReceive(r)" :disabled="loading">Receive</button>
                <button class="px-2 py-1 rounded border dark:border-gray-600" @click="confirm(r)" :disabled="loading || r.status==='confirmed'">Confirm</button>
                <button class="px-2 py-1 rounded border dark:border-gray-600" @click="remove(r)" :disabled="loading">Delete</button>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="6" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Loading bar -->
    <div v-if="loading" class="fixed left-0 right-0 top-0 h-1 bg-primary animate-pulse"></div>

    <!-- Modal: Create PO -->
    <div v-if="modals.create" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="closeAll"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Create Purchase Order</h3>
        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">Vendor ID</label>
            <input v-model.number="form.vendor_id" type="number" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div>
            <label class="block text-sm mb-1">Expected Date</label>
            <input v-model="form.expected_date" type="date" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm mb-1">Items JSON</label>
            <textarea v-model="itemsRaw" rows="5" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
              placeholder='[{"product_id":1,"qty":10,"uom":"kg","price":12000}]'></textarea>
            <p class="text-xs mt-1 text-gray-500 dark:text-gray-400">Format: product_id, qty, uom, price</p>
          </div>
        </div>
        <div class="mt-4 text-right flex gap-2 justify-end">
          <button @click="closeAll" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="createPO" class="px-4 py-2 rounded bg-primary text-white" :disabled="saving">{{ saving ? 'Saving…' : 'Create' }}</button>
        </div>
      </div>
    </div>

    <!-- Modal: Receive -->
    <div v-if="modals.receive" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="closeAll"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Receive PO #{{ receiveForm.po_id }}</h3>
        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">Location ID</label>
            <input v-model.number="receiveForm.location_id" type="number" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm mb-1">Lines JSON</label>
            <textarea v-model="receiveLinesRaw" rows="5" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
              placeholder='[{"po_item_id":1,"qty":10,"lot":"L-001","expiry_date":"2025-12-31"}]'></textarea>
            <p class="text-xs mt-1 text-gray-500 dark:text-gray-400">Gunakan po_item_id, qty, (opsional) lot, expiry_date</p>
          </div>
        </div>
        <div class="mt-4 text-right flex gap-2 justify-end">
          <button @click="closeAll" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="submitReceive" class="px-4 py-2 rounded bg-primary text-white" :disabled="saving">{{ saving ? 'Submitting…' : 'Submit' }}</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { scmApi } from "@/lib/_scmApi";

export default {
  name: "Purchases",
  data() {
    return {
      loading: false,
      saving: false,
      activeTab: "list",
      tabs: [{ key: "list", label: "Purchase Orders" }],

      q: { search: "", status: "" },
      rows: [],
      error: "",

      // Create PO
      modals: { create: false, receive: false },
      form: { vendor_id: null, expected_date: "", items: [] },
      itemsRaw: '[{"product_id":1,"qty":10,"uom":"kg","price":12000}]',

      // Receive
      receiveForm: { po_id: null, location_id: null, lines: [] },
      receiveLinesRaw: '[{"po_item_id":1,"qty":10,"lot":"L-001","expiry_date":"2025-12-31"}]',
    };
  },

  mounted() {
    this.reload();
  },

  methods: {
    api() { return scmApi(); },

    badgeClass(st) {
      switch ((st || "").toLowerCase()) {
        case "draft": return "bg-gray-100 text-gray-700";
        case "confirmed": return "bg-blue-100 text-blue-700";
        case "received": return "bg-green-100 text-green-700";
        case "cancelled": return "bg-red-100 text-red-700";
        default: return "bg-gray-100 text-gray-700";
      }
    },

    toast(icon, title) {
      const T = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 1600, timerProgressBar: true });
      T.fire({ icon, title });
    },
    alert(icon, title, text) { return Swal.fire({ icon, title, text }); },

    async reload() {
      this.loading = true; this.error = "";
      try {
        const { data } = await this.api().get("/purchases", { params: { search: this.q.search, status: this.q.status || undefined } });
        // Controller dummy mengembalikan { ok, data: [] }
        const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        this.rows = list.map((r, i) => ({
          id: r.id ?? (i + 1),
          vendor_id: r.vendor_id ?? r.vendor?.id ?? "-",
          expected_date: r.expected_date || "",
          status: r.status || "draft",
          items: r.items || [],
          items_count: r.items?.length ?? 0,
        }));
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal memuat purchases";
        this.alert("error", "Load gagal", this.error);
      } finally {
        this.loading = false;
      }
    },

    openCreate() { this.modals = { create: true, receive: false }; },
    closeAll() { this.modals = { create: false, receive: false }; },

    async createPO() {
      try {
        this.form.items = JSON.parse(this.itemsRaw || "[]");
      } catch {
        return this.alert("warning", "Format salah", "Items harus JSON array");
      }
      if (!this.form.vendor_id) return this.alert("warning", "Validasi", "Vendor wajib diisi");
      if (!this.form.items?.length) return this.alert("warning", "Validasi", "Items minimal 1");

      this.saving = true;
      try {
        await this.api().post("/purchases", this.form);
        this.toast("success", "PO created");
        this.closeAll();
        this.reload();
      } catch (e) {
        this.alert("error", "Create gagal", e?.response?.data?.message || e.message);
      } finally {
        this.saving = false;
      }
    },

    openReceive(row) {
      this.receiveForm = { po_id: row.id, location_id: null, lines: [] };
      this.receiveLinesRaw = '[{"po_item_id":1,"qty":10,"lot":"L-001","expiry_date":"2025-12-31"}]';
      this.modals = { create: false, receive: true };
    },

    async submitReceive() {
      try {
        this.receiveForm.lines = JSON.parse(this.receiveLinesRaw || "[]");
      } catch {
        return this.alert("warning", "Format salah", "Lines harus JSON array");
      }
      if (!this.receiveForm.po_id || !this.receiveForm.location_id || !this.receiveForm.lines?.length)
        return this.alert("warning", "Validasi", "Lengkapi PO, location, dan lines");

      this.saving = true;
      try {
        await this.api().post(`/purchases/${this.receiveForm.po_id}/receive`, {
          location_id: this.receiveForm.location_id,
          lines: this.receiveForm.lines,
        });
        this.toast("success", "Received");
        this.closeAll();
        this.reload();
      } catch (e) {
        this.alert("error", "Receive gagal", e?.response?.data?.message || e.message);
      } finally {
        this.saving = false;
      }
    },

    async confirm(row) {
      try {
        await this.api().post(`/purchases/${row.id}/confirm`);
        this.toast("success", "Confirmed");
        this.reload();
      } catch (e) {
        this.alert("error", "Confirm gagal", e?.response?.data?.message || e.message);
      }
    },

    async remove(row) {
      const ok = await Swal.fire({ icon: "warning", title: "Delete PO?", text: `Hapus PO #${row.id}?`, showCancelButton: true, confirmButtonText: "Delete" })
        .then(r => r.isConfirmed);
      if (!ok) return;
      try {
        await this.api().delete(`/purchases/${row.id}`);
        this.toast("success", "Deleted");
        this.reload();
      } catch (e) {
        this.alert("error", "Delete gagal", e?.response?.data?.message || e.message);
      }
    },
  },
};
</script>
