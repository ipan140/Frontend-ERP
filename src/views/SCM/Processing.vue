<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">scm</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Processing</h1>
      </div>

      <div class="flex gap-2 w-full lg:w-auto">
        <button
          @click="openCreate()"
          class="inline-flex items-center justify-center gap-2 bg-primary text-white rounded py-2.5 px-5 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[.98] transition"
          title="New Work Order"
        >
          <Icon icon="mdi:factory" class="text-xl" />
          <span class="font-medium">New Work Order</span>
        </button>
        <button
          @click="reload"
          class="inline-flex items-center justify-center gap-2 border dark:border-gray-700 rounded py-2.5 px-5 hover:bg-gray-50 dark:hover:bg-gray-700"
          title="Reload"
        >
          <Icon icon="mdi:refresh" class="text-xl" />
          <span class="font-medium">Reload</span>
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold dark:text-gray-100">Work Orders</h3>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ rows.length }} item(s)
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">ID</th>
              <th class="px-6 py-3">Name</th>
              <th class="px-6 py-3">Inputs</th>
              <th class="px-6 py-3">Outputs</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3 font-mono">#{{ r.id }}</td>
              <td class="px-6 py-3">{{ r.name || '-' }}</td>
              <td class="px-6 py-3">
                <ul class="list-disc ml-5 space-y-0.5">
                  <li v-for="(i,idx) in r.input" :key="idx">
                    <span class="font-mono">P{{ i.product_id || '-' }}</span>
                    — {{ i.qty }} {{ i.uom }}
                    <span v-if="i.lot_id"> (Lot {{ i.lot_id }})</span>
                  </li>
                </ul>
              </td>
              <td class="px-6 py-3">
                <ul class="list-disc ml-5 space-y-0.5">
                  <li v-for="(o,idx) in r.output" :key="idx">
                    <span class="font-mono">P{{ o.product_id }}</span>
                    — {{ o.qty }} {{ o.uom }}
                  </li>
                </ul>
              </td>
              <td class="px-6 py-3">
                <span v-if="r.status==='draft'" class="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">Draft</span>
                <span v-else-if="r.status==='in_progress'" class="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700">In Progress</span>
                <span v-else class="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Finished</span>
              </td>
              <td class="px-6 py-3 text-right space-x-2">
                <button
                  v-if="r.status==='draft'"
                  :disabled="busyId===r.id"
                  @click="startWO(r)"
                  class="px-2 py-1 rounded border dark:border-gray-600"
                >
                  {{ busyId===r.id ? 'Starting…' : 'Start' }}
                </button>
                <button
                  v-if="r.status==='in_progress'"
                  @click="openFinish(r)"
                  class="px-2 py-1 rounded border dark:border-gray-600"
                >
                  Finish
                </button>
              </td>
            </tr>

            <tr v-if="!loading && !rows.length">
              <td colspan="6" class="px-6 py-6 text-center text-gray-400">No work orders</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Create WO -->
    <div v-if="modal.open && modal.mode==='create'" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open=false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-3xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">New Work Order</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Name</label>
            <input v-model="form.name" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="Optional name…" />
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <!-- Inputs -->
            <div class="border dark:border-gray-700 rounded-md p-3">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium dark:text-gray-100">Inputs</h4>
                <button @click="addInput()" class="px-2 py-1 text-xs rounded border dark:border-gray-600">Add</button>
              </div>
              <div v-for="(row,idx) in form.input" :key="'in-'+idx" class="grid grid-cols-6 gap-2 mb-2">
                <input v-model.number="row.product_id" type="number" placeholder="Product ID" class="col-span-2 border dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-200" />
                <input v-model="row.uom" placeholder="UoM" class="col-span-1 border dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-200" />
                <input v-model.number="row.qty" type="number" min="0.0001" step="0.0001" placeholder="Qty" class="col-span-2 border dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-200" />
                <input v-model.number="row.lot_id" type="number" placeholder="Lot ID (opt)" class="col-span-2 border dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-200" />
                <button @click="removeInput(idx)" class="col-span-1 px-2 py-1 text-xs rounded border dark:border-gray-600">Del</button>
              </div>
              <p v-if="fieldErrors['input']" class="text-xs text-red-500">{{ fieldErrors['input'][0] }}</p>
            </div>

            <!-- Outputs -->
            <div class="border dark:border-gray-700 rounded-md p-3">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium dark:text-gray-100">Outputs</h4>
                <button @click="addOutput()" class="px-2 py-1 text-xs rounded border dark:border-gray-600">Add</button>
              </div>
              <div v-for="(row,idx) in form.output" :key="'out-'+idx" class="grid grid-cols-5 gap-2 mb-2">
                <input v-model.number="row.product_id" type="number" placeholder="Product ID" class="col-span-2 border dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-200" />
                <input v-model="row.uom" placeholder="UoM" class="col-span-1 border dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-200" />
                <input v-model.number="row.qty" type="number" min="0.0001" step="0.0001" placeholder="Qty" class="col-span-1 border dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-200" />
                <button @click="removeOutput(idx)" class="col-span-1 px-2 py-1 text-xs rounded border dark:border-gray-600">Del</button>
              </div>
              <p v-if="fieldErrors['output']" class="text-xs text-red-500">{{ fieldErrors['output'][0] }}</p>
            </div>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-2">{{ error }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open=false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="save()" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Finish WO -->
    <div v-if="modal.open && modal.mode==='finish'" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open=false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Finish Work Order #{{ activeWO?.id }}</h3>

        <div class="space-y-3">
          <div class="border dark:border-gray-700 rounded-md p-3">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-medium dark:text-gray-100">Actual Output</h4>
            </div>
            <div v-for="(row,idx) in finishForm.actual_output" :key="'act-'+idx" class="grid grid-cols-4 gap-2 mb-2">
              <input v-model.number="row.product_id" type="number" placeholder="Product ID" class="col-span-2 border dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-200" />
              <input v-model="row.uom" placeholder="UoM" class="col-span-1 border dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-200" />
              <input v-model.number="row.qty" type="number" min="0.0001" step="0.0001" placeholder="Qty" class="col-span-1 border dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-200" />
            </div>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-2">{{ error }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open=false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="finish()" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Finishing…' : 'Finish' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading bar -->
    <div v-if="loading" class="fixed left-0 right-0 top-0 h-1 bg-primary animate-pulse"></div>
  </div>
</template>

<script>
import axios from "axios";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { Icon } from "@iconify/vue";

export default {
  name: "ScmProcessing",
  components: { Icon },

  data() {
    return {
      loading: false,
      rows: [],

      modal: { open: false, mode: null },
      saving: false,
      busyId: null,
      error: "",
      fieldErrors: {},

      form: {
        name: "",
        input: [{ product_id: null, uom: "", qty: null, lot_id: null }],
        output: [{ product_id: null, uom: "", qty: null }],
      },

      activeWO: null,
      finishForm: {
        actual_output: [],
      },
    };
  },

  mounted() {
    this.reload();
  },

  methods: {
    // ----- UI helpers
    toast(icon, title) {
      const T = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 1600, timerProgressBar: true });
      T.fire({ icon, title });
    },
    alert(icon, title, text) { return Swal.fire({ icon, title, text }); },

    // ----- Axios base
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
        baseURL: `${API_BASE}/api/scm/processing`,
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

    // ----- Data ops
    async reload() {
      this.loading = true; this.error = ""; this.fieldErrors = {};
      try {
        const { data } = await this.api().get("/workorders");
        const list = Array.isArray(data?.workorders) ? data.workorders : [];
        // Simpan apa adanya (dummy). Saat create kita push ke atas.
        this.rows = list;
      } catch (e) {
        const msg = e?.response?.data?.message || "Gagal memuat work orders";
        this.error = msg; this.alert("error", "Load gagal", msg);
      } finally {
        this.loading = false;
      }
    },

    openCreate() {
      this.modal = { open: true, mode: "create" };
      this.error = ""; this.fieldErrors = {};
      this.form = {
        name: "",
        input: [{ product_id: null, uom: "", qty: null, lot_id: null }],
        output: [{ product_id: null, uom: "", qty: null }],
      };
    },

    addInput() { this.form.input.push({ product_id: null, uom: "", qty: null, lot_id: null }); },
    removeInput(i) { this.form.input.splice(i, 1); if (!this.form.input.length) this.addInput(); },
    addOutput() { this.form.output.push({ product_id: null, uom: "", qty: null }); },
    removeOutput(i) { this.form.output.splice(i, 1); if (!this.form.output.length) this.addOutput(); },

    async save() {
      if (this.saving) return;
      this.saving = true; this.error = ""; this.fieldErrors = {};
      try {
        // Bersihkan payload (trim & cast)
        const payload = {
          name: String(this.form.name || "").trim() || null,
          input: this.form.input.map(r => ({
            product_id: r.product_id == null || r.product_id === "" ? null : Number(r.product_id),
            uom: String(r.uom || "").trim(),
            qty: r.qty == null || r.qty === "" ? null : Number(r.qty),
            lot_id: r.lot_id == null || r.lot_id === "" ? null : Number(r.lot_id),
          })),
          output: this.form.output.map(r => ({
            product_id: r.product_id == null || r.product_id === "" ? null : Number(r.product_id),
            uom: String(r.uom || "").trim(),
            qty: r.qty == null || r.qty === "" ? null : Number(r.qty),
          })),
        };

        // Hard client-side checks ringan biar UX enak
        if (!payload.input.length || !payload.input[0].uom) {
          throw { response: { status: 422, data: { errors: { input: ["Input minimal 1 dan UoM wajib diisi."] } } } };
        }
        if (!payload.output.length || !payload.output[0].uom) {
          throw { response: { status: 422, data: { errors: { output: ["Output minimal 1 dan UoM wajib diisi."] } } } };
        }

        const { data } = await this.api().post("/workorders", payload);

        // Tambahkan ke list lokal agar terasa realtime
        const wo = data?.wo || { id: Date.now(), status: "draft", ...payload };
        this.rows.unshift(wo);

        this.toast("success", "Work Order created");
        this.modal.open = false;
      } catch (e) {
        if (e?.response?.status === 422) {
          this.fieldErrors = e.response.data?.errors || {};
          const msg = Object.values(this.fieldErrors)?.[0]?.[0] || "Validasi gagal";
          this.error = msg; this.alert("error", "Validasi gagal", msg);
        } else {
          const msg = e?.response?.data?.message || "Gagal membuat Work Order";
          this.error = msg; this.alert("error", "Gagal", msg);
        }
      } finally {
        this.saving = false;
      }
    },

    async startWO(row) {
      if (this.busyId) return;
      this.busyId = row.id; this.error = "";
      try {
        await this.api().post(`/workorders/${row.id}/start`);
        row.status = 'in_progress';
        this.toast("success", "Work Order started");
      } catch (e) {
        const msg = e?.response?.data?.message || "Gagal start Work Order";
        this.error = msg; this.alert("error", "Gagal", msg);
      } finally {
        this.busyId = null;
      }
    },

    openFinish(row) {
      this.modal = { open: true, mode: "finish" };
      this.error = ""; this.fieldErrors = {};
      this.activeWO = row;
      // Default actual_output = plan output
      this.finishForm.actual_output = (row.output || []).map(o => ({
        product_id: o.product_id,
        uom: o.uom,
        qty: o.qty,
      }));
    },

    async finish() {
      if (!this.activeWO) return;
      if (this.saving) return;
      this.saving = true; this.error = "";
      try {
        const payload = {
          actual_output: this.finishForm.actual_output.map(o => ({
            product_id: Number(o.product_id),
            uom: String(o.uom || "").trim(),
            qty: Number(o.qty),
          })),
        };
        await this.api().post(`/workorders/${this.activeWO.id}/finish`, payload);
        this.activeWO.status = 'finished';
        this.toast("success", "Work Order finished");
        this.modal.open = false;
      } catch (e) {
        const msg = e?.response?.data?.message || "Gagal finish Work Order";
        this.error = msg; this.alert("error", "Gagal", msg);
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>
