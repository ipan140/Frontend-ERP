<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">scm</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Logistics</h1>
      </div>

      <div class="flex gap-2 w-full lg:w-auto">
        <input
          v-model="q.search"
          @keyup.enter="reload(1)"
          class="flex-1 lg:flex-none border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search number/vendor/ref…"
        />
        <button @click="reload(1)" class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5">
          Search
        </button>
      </div>
    </div>

    <!-- List -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 flex flex-wrap gap-3 items-center justify-between">
        <div class="flex flex-wrap gap-3 items-center">
          <div class="flex items-center gap-2">
            <label class="text-sm dark:text-gray-300">Status</label>
            <select v-model="q.status" @change="reload(1)"
                    class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ rows.length }} rows
            <span v-if="meta.total"> • total {{ nf(meta.total) }}</span>
          </div>
          <button @click="openCreate" class="px-3 py-2 rounded bg-primary text-white">Create Delivery</button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">#</th>
              <th class="px-6 py-3">Ref</th>
              <th class="px-6 py-3">Ship Date</th>
              <th class="px-6 py-3">Carrier</th>
              <th class="px-6 py-3">Route</th>
              <th class="px-6 py-3">SO</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3 font-mono">{{ r.id }}</td>
              <td class="px-6 py-3">{{ r.number || '-' }}</td>
              <td class="px-6 py-3">{{ r.ship_date || '-' }}</td>
              <td class="px-6 py-3">{{ r.carrier || '-' }}</td>
              <td class="px-6 py-3">{{ r.route || '-' }}</td>
              <td class="px-6 py-3">{{ r.so_id ?? '-' }}</td>
              <td class="px-6 py-3">
                <span class="px-2 py-1 text-xs rounded" :class="badgeClass(r.status)">{{ r.status || 'draft' }}</span>
              </td>
              <td class="px-6 py-3 text-right space-x-2">
                <button @click="confirm(r)" class="px-2 py-1 rounded border dark:border-gray-600"
                        :disabled="loading || r.status==='confirmed' || r.status==='done'">Confirm</button>
                <button @click="openPOD(r)" class="px-2 py-1 rounded border dark:border-gray-600"
                        :disabled="loading">POD</button>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="8" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta.last_page && meta.last_page > 1" class="p-4 flex items-center justify-between text-sm">
        <div>Page {{ meta.current_page }} / {{ meta.last_page }}</div>
        <div class="flex gap-2">
          <button :disabled="meta.current_page<=1" @click="reload(meta.current_page-1)" class="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <button :disabled="meta.current_page>=meta.last_page" @click="reload(meta.current_page+1)" class="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>

    <!-- Modal: Create Delivery -->
    <div v-if="modalCreate" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="closeCreate"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Create Delivery</h3>

        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">SO ID (optional)</label>
            <input v-model.number="form.so_id" type="number" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Ship Date</label>
            <input v-model="form.ship_date" type="date" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Carrier</label>
            <input v-model="form.carrier" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" placeholder="JNE / Internal Truck" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Route</label>
            <input v-model="form.route" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" placeholder="Sby → Sda" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Items JSON</label>
            <textarea v-model="itemsRaw" rows="5"
                      class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
                      placeholder='[{"product_id":1,"qty":5,"uom":"kg"}]'></textarea>
            <p class="text-xs mt-1 text-gray-500 dark:text-gray-400">
              Gunakan <code>lot_id</code> ATAU <code>product_id</code>. Contoh: [{"lot_id":1001,"qty":3,"uom":"kg"}]
            </p>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="closeCreate" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="create" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Saving…' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: POD -->
    <div v-if="modalPOD.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="closePOD"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Proof of Delivery (ID: {{ modalPOD.id }})</h3>
        <div class="grid md:grid-cols-2 gap-3">
          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Signed By</label>
            <input v-model="pod.signed_by" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" placeholder="Nama penerima" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Photo URL</label>
            <input v-model="pod.photo_url" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" placeholder="https://…" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Note</label>
            <input v-model="pod.note" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" />
          </div>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button @click="closePOD" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="submitPOD" class="px-4 py-2 rounded bg-primary text-white">Submit</button>
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
  name: "Logistics",
  data() {
    return {
      loading: false,
      saving: false,

      q: { search: "", status: "" },
      rows: [],
      meta: { current_page: 1, last_page: 1, total: 0 },
      error: "",

      modalCreate: false,
      form: { so_id: null, ship_date: "", carrier: "", route: "", items: [] },
      itemsRaw: '[{"product_id":1,"qty":5,"uom":"kg"}]',

      modalPOD: { open: false, id: null },
      pod: { signed_by: "", photo_url: "", note: "" },
    };
  },

  mounted() { this.reload(1); },

  methods: {
    api() { return scmApi(); },

    // helpers seperti di Inventory
    unpackRows(payload) {
      if (!payload) return [];
      if (Array.isArray(payload.data)) return payload.data;       // non-paginated
      if (payload.data && Array.isArray(payload.data.data)) return payload.data.data; // paginated
      if (Array.isArray(payload)) return payload;
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

    badgeClass(st) {
      switch ((st || "").toLowerCase()) {
        case "draft": return "bg-gray-100 text-gray-700";
        case "confirmed": return "bg-blue-100 text-blue-700";
        case "done": return "bg-green-100 text-green-700";
        case "cancelled": return "bg-red-100 text-red-700";
        default: return "bg-gray-100 text-gray-700";
      }
    },

    toast(icon, title) {
      const T = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 1600, timerProgressBar: true });
      T.fire({ icon, title });
    },
    alert(icon, title, text) { return Swal.fire({ icon, title, text }); },

    async reload(page = 1) {
      this.loading = true; this.error = "";
      try {
        const { data } = await this.api().get("/logistics", {
          params: {
            search: this.q.search || undefined,
            status: this.q.status || undefined,
            page,
            per_page: 20,
          }
        });

        // data backend kemungkinan {ok:true,data:paginate} → gunakan helpers
        const payload = data?.ok !== undefined ? data : { data };
        const list = this.unpackRows(payload);

        this.rows = list.map((r, i) => ({
          id: r.id ?? i + 1,
          number: r.number || r.reference || r.ref || null,
          ship_date: r.ship_date || r.scheduled_date || r.date || "",
          carrier: r.carrier || r.vendor || "",
          route: r.route || r.route_name || "",
          so_id: r.so_id || r.sales_order_id || r.order_id || null,
          status: r.status || r.state || "draft",
        }));
        this.meta = this.unpackMeta(payload);
      } catch (e) {
        this.error = e?.response?.data?.message || e.message || "Gagal memuat shipments";
        this.alert("error", "Load gagal", this.error);
      } finally {
        this.loading = false;
      }
    },

    openCreate() { this.modalCreate = true; },
    closeCreate() { this.modalCreate = false; },

    resetForm() {
      this.form = { so_id: null, ship_date: "", carrier: "", route: "", items: [] };
      this.itemsRaw = '[{"product_id":1,"qty":5,"uom":"kg"}]';
      this.error = "";
    },

    async create() {
      this.error = "";
      let items;
      try {
        items = JSON.parse(this.itemsRaw || "[]");
      } catch {
        return this.alert("warning", "Format salah", "Items harus JSON array");
      }
      if (!this.form.ship_date) return this.alert("warning", "Validasi", "Ship date wajib diisi");
      if (!items.length) return this.alert("warning", "Validasi", "Items minimal 1");

      this.saving = true;
      try {
        await this.api().post("/logistics", { ...this.form, items });
        this.toast("success", "Delivery created");
        this.closeCreate();
        this.resetForm();
        this.reload(this.meta.current_page);
      } catch (e) {
        this.error = e?.response?.data?.message || e.message || "Gagal membuat delivery";
        this.alert("error", "Create gagal", this.error);
      } finally {
        this.saving = false;
      }
    },

    async confirm(row) {
      try {
        await this.api().post(`/logistics/${row.id}/confirm`);
        this.toast("success", "Confirmed");
        this.reload(this.meta.current_page);
      } catch (e) {
        this.alert("error", "Confirm gagal", e?.response?.data?.message || e.message);
      }
    },

    openPOD(row) { this.modalPOD = { open: true, id: row.id }; this.pod = { signed_by: "", photo_url: "", note: "" }; },
    closePOD() { this.modalPOD = { open: false, id: null }; },
    async submitPOD() {
      try {
        await this.api().post(`/logistics/${this.modalPOD.id}/pod`, this.pod);
        this.toast("success", "POD saved");
        this.closePOD();
        this.reload(this.meta.current_page);
      } catch (e) {
        this.alert("error", "POD gagal", e?.response?.data?.message || e.message);
      }
    },
  },
};
</script>
