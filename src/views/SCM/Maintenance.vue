<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">scm</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Maintenance</h1>
      </div>

      <div class="flex gap-2 w-full lg:w-auto">
        <button
          @click="openNewEquipment()"
          class="inline-flex items-center justify-center gap-2 bg-primary text-white rounded py-2.5 px-5 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[.98] transition"
          title="Add Equipment"
        >
          <Icon icon="mdi:wrench" class="text-xl" />
          <span class="font-medium">New Equipment</span>
        </button>

        <button
          @click="openNewRequest()"
          class="inline-flex items-center justify-center gap-2 border dark:border-gray-700 rounded py-2.5 px-5 hover:bg-gray-50 dark:hover:bg-gray-700"
          title="Create Maintenance Request"
        >
          <Icon icon="mdi:clipboard-text" class="text-xl" />
          <span class="font-medium">New Request</span>
        </button>

        <button
          @click="reloadAll"
          class="inline-flex items-center justify-center gap-2 border dark:border-gray-700 rounded py-2.5 px-5 hover:bg-gray-50 dark:hover:bg-gray-700"
          title="Reload"
        >
          <Icon icon="mdi:refresh" class="text-xl" />
          <span class="font-medium">Reload</span>
        </button>
      </div>
    </div>

    <!-- GRID -->
    <div class="mt-4 grid lg:grid-cols-2 gap-4">
      <!-- Equipments -->
      <div class="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md overflow-hidden">
        <div class="px-5 py-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold dark:text-gray-100">Equipments</h3>
          <button @click="loadEquipments" class="text-sm px-3 py-1.5 rounded border dark:border-gray-700">Reload</button>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
            <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th class="px-6 py-3">Code</th>
                <th class="px-6 py-3">Name</th>
                <th class="px-6 py-3">Serial</th>
                <th class="px-6 py-3">Category</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in equipments" :key="e.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                <td class="px-6 py-3 font-mono">{{ e.code }}</td>
                <td class="px-6 py-3">{{ e.name }}</td>
                <td class="px-6 py-3">{{ e.serial || '-' }}</td>
                <td class="px-6 py-3">{{ e.category || '-' }}</td>
              </tr>
              <tr v-if="!loading.equip && !equipments.length">
                <td colspan="4" class="px-6 py-6 text-center text-gray-400">No equipment</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Requests -->
      <div class="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md overflow-hidden">
        <div class="px-5 py-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold dark:text-gray-100">Maintenance Requests</h3>
          <button @click="loadRequests" class="text-sm px-3 py-1.5 rounded border dark:border-gray-700">Reload</button>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
            <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th class="px-6 py-3">#</th>
                <th class="px-6 py-3">Equipment</th>
                <th class="px-6 py-3">Type</th>
                <th class="px-6 py-3">Priority</th>
                <th class="px-6 py-3">Status</th>
                <th class="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in requests" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                <td class="px-6 py-3 font-mono">#{{ r.id }}</td>
                <td class="px-6 py-3">
                  <div class="font-medium">{{ r.equipment?.name || '-' }}</div>
                  <div class="text-xs text-gray-500">{{ r.equipment?.code }}</div>
                </td>
                <td class="px-6 py-3 capitalize">{{ r.type }}</td>
                <td class="px-6 py-3 capitalize">
                  <span v-if="r.priority==='high'" class="px-2 py-1 text-xs rounded bg-red-100 text-red-700">High</span>
                  <span v-else-if="r.priority==='low'" class="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">Low</span>
                  <span v-else class="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700">Normal</span>
                </td>
                <td class="px-6 py-3 capitalize">
                  <span v-if="r.status==='done'" class="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Done</span>
                  <span v-else class="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700">{{ r.status }}</span>
                </td>
                <td class="px-6 py-3 text-right">
                  <button
                    v-if="r.status!=='done'"
                    :disabled="busyId===r.id"
                    @click="completeRequest(r)"
                    class="px-2 py-1 rounded border dark:border-gray-600"
                  >
                    {{ busyId===r.id ? 'Completing…' : 'Complete' }}
                  </button>
                </td>
              </tr>
              <tr v-if="!loading.req && !requests.length">
                <td colspan="6" class="px-6 py-6 text-center text-gray-400">No requests</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Plans (optional) -->
      <div class="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md lg:col-span-2">
        <div class="px-5 py-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold dark:text-gray-100">Preventive Plans</h3>
          <button @click="loadPlans" class="text-sm px-3 py-1.5 rounded border dark:border-gray-700">Reload</button>
        </div>
        <div class="p-5">
          <div v-if="!loading.plan && !plans.length" class="text-sm text-gray-400">No plans</div>
          <ul v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <li v-for="p in plans" :key="p.id" class="border dark:border-gray-700 rounded p-3">
              <div class="font-medium dark:text-gray-100">{{ p.name || ('Plan #'+p.id) }}</div>
              <div class="text-xs text-gray-500">{{ p.equipment?.name || '-' }}</div>
              <div class="text-xs mt-1">Interval: {{ p.interval || '-' }}</div>
              <div class="text-xs">Next: {{ p.next_due || '-' }}</div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Modal: New Equipment -->
    <div v-if="modal.open && modal.mode==='equip'" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open=false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-lg p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Add Equipment</h3>

        <div class="grid gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Name <span class="text-red-500">*</span></label>
            <input v-model="equipForm.name" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.name" class="text-xs text-red-500 mt-1">{{ fieldErrors.name[0] }}</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm mb-1 dark:text-gray-300">Code <span class="text-red-500">*</span></label>
              <input v-model="equipForm.code" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
              <p v-if="fieldErrors.code" class="text-xs text-red-500 mt-1">{{ fieldErrors.code[0] }}</p>
            </div>
            <div>
              <label class="block text-sm mb-1 dark:text-gray-300">Serial</label>
              <input v-model="equipForm.serial" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            </div>
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Category</label>
            <input v-model="equipForm.category" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open=false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="saveEquipment" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: New Request -->
    <div v-if="modal.open && modal.mode==='req'" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open=false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-lg p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">New Maintenance Request</h3>

        <div class="grid gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Equipment <span class="text-red-500">*</span></label>
            <select v-model.number="reqForm.equipment_id" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option value="">-- Select equipment --</option>
              <option v-for="e in equipments" :key="e.id" :value="e.id">
                {{ e.name }} ({{ e.code }})
              </option>
            </select>
            <p v-if="fieldErrors.equipment_id" class="text-xs text-red-500 mt-1">{{ fieldErrors.equipment_id[0] }}</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm mb-1 dark:text-gray-300">Type <span class="text-red-500">*</span></label>
              <select v-model="reqForm.type" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
                <option value="">-- Select --</option>
                <option value="corrective">Corrective</option>
                <option value="preventive">Preventive</option>
              </select>
              <p v-if="fieldErrors.type" class="text-xs text-red-500 mt-1">{{ fieldErrors.type[0] }}</p>
            </div>
            <div>
              <label class="block text-sm mb-1 dark:text-gray-300">Priority</label>
              <select v-model="reqForm.priority" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
                <option value="normal">Normal</option>
                <option value="low">Low</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Note</label>
            <textarea v-model="reqForm.note" rows="3" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"></textarea>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open=false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="saveRequest" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading bar -->
    <div v-if="isBusy" class="fixed left-0 right-0 top-0 h-1 bg-primary animate-pulse"></div>
  </div>
</template>

<script>
import axios from "axios";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { Icon } from "@iconify/vue";

export default {
  name: "ScmMaintenance",
  components: { Icon },

  data() {
    return {
      equipments: [],
      requests: [],
      plans: [],

      loading: { equip: false, req: false, plan: false },
      saving: false,
      busyId: null,

      modal: { open: false, mode: null },
      error: "",
      fieldErrors: {},

      equipForm: {
        name: "",
        code: "",
        serial: "",
        category: "",
      },

      reqForm: {
        equipment_id: "",
        type: "",
        note: "",
        priority: "normal",
      },
    };
  },

  computed: {
    isBusy() {
      return this.loading.equip || this.loading.req || this.loading.plan;
    },
  },

  mounted() {
    this.reloadAll();
  },

  methods: {
    // Toast & Alert
    toast(icon, title) {
      const T = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 1600, timerProgressBar: true });
      T.fire({ icon, title });
    },
    alert(icon, title, text) { return Swal.fire({ icon, title, text }); },

    // Axios base
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
        baseURL: `${API_BASE}/api/scm/maintenance`,
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

    // Loaders
    async loadEquipments() {
      this.loading.equip = true; this.error = "";
      try {
        const { data } = await this.api().get("/equipments");
        this.equipments = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.equipments) ? data.equipments : (data?.equipment ? [data.equipment] : []));
      } catch (e) {
        const msg = e?.response?.data?.message || "Gagal memuat equipments";
        this.error = msg; this.alert("error", "Load gagal", msg);
      } finally {
        this.loading.equip = false;
      }
    },

    async loadRequests() {
      this.loading.req = true; this.error = "";
      try {
        const { data } = await this.api().get("/requests");
        // Controller kamu pakai paginate: { ok, requests: { data: [...] } } atau { ok, requests:[...] }
        const raw = data?.requests ?? data;
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
        this.requests = list;
      } catch (e) {
        const msg = e?.response?.data?.message || "Gagal memuat requests";
        this.error = msg; this.alert("error", "Load gagal", msg);
      } finally {
        this.loading.req = false;
      }
    },

    async loadPlans() {
      this.loading.plan = true; this.error = "";
      try {
        const { data } = await this.api().get("/plans");
        this.plans = Array.isArray(data?.plans) ? data.plans : [];
      } catch (e) {
        const msg = e?.response?.data?.message || "Gagal memuat plans";
        this.error = msg; this.alert("error", "Load gagal", msg);
      } finally {
        this.loading.plan = false;
      }
    },

    async reloadAll() {
      await Promise.all([this.loadEquipments(), this.loadRequests(), this.loadPlans()]);
    },

    // Modal openers
    openNewEquipment() {
      this.modal = { open: true, mode: "equip" };
      this.error = ""; this.fieldErrors = {};
      this.equipForm = { name: "", code: "", serial: "", category: "" };
    },
    openNewRequest() {
      this.modal = { open: true, mode: "req" };
      this.error = ""; this.fieldErrors = {};
      this.reqForm = { equipment_id: "", type: "", note: "", priority: "normal" };
      if (!this.equipments.length) this.loadEquipments();
    },

    // Actions
    async saveEquipment() {
      if (this.saving) return;
      this.saving = true; this.error = ""; this.fieldErrors = {};
      try {
        const payload = {
          name: String(this.equipForm.name || "").trim(),
          code: String(this.equipForm.code || "").trim(),
          serial: String(this.equipForm.serial || "").trim() || null,
          category: String(this.equipForm.category || "").trim() || null,
        };

        if (!payload.name) { throw { response: { status: 422, data: { errors: { name: ["Name wajib diisi."] } } } }; }
        if (!payload.code) { throw { response: { status: 422, data: { errors: { code: ["Code wajib diisi."] } } } }; }

        const { data } = await this.api().post("/equipments", payload);
        const created = data?.equipment || data?.data || payload;
        // Tambahkan ke list
        this.equipments.unshift(created);
        this.toast("success", "Equipment saved");
        this.modal.open = false;
      } catch (e) {
        if (e?.response?.status === 422) {
          this.fieldErrors = e.response.data?.errors || {};
          const msg = Object.values(this.fieldErrors)?.[0]?.[0] || "Validasi gagal";
          this.error = msg; this.alert("error", "Validasi gagal", msg);
        } else {
          const msg = e?.response?.data?.message || "Gagal menyimpan equipment";
          this.error = msg; this.alert("error", "Gagal", msg);
        }
      } finally {
        this.saving = false;
      }
    },

    async saveRequest() {
      if (this.saving) return;
      this.saving = true; this.error = ""; this.fieldErrors = {};
      try {
        const payload = {
          equipment_id: Number(this.reqForm.equipment_id),
          type: String(this.reqForm.type || "").trim(),
          note: String(this.reqForm.note || "").trim() || null,
          priority: String(this.reqForm.priority || "normal"),
        };

        if (!payload.equipment_id) { throw { response: { status: 422, data: { errors: { equipment_id: ["Equipment wajib dipilih."] } } } }; }
        if (!payload.type) { throw { response: { status: 422, data: { errors: { type: ["Type wajib diisi."] } } } }; }

        const { data } = await this.api().post("/request", payload);
        const created = data?.request || data?.data || payload;
        this.requests.unshift(created);
        this.toast("success", "Request created");
        this.modal.open = false;
      } catch (e) {
        if (e?.response?.status === 422) {
          this.fieldErrors = e.response.data?.errors || {};
          const msg = Object.values(this.fieldErrors)?.[0]?.[0] || "Validasi gagal";
          this.error = msg; this.alert("error", "Validasi gagal", msg);
        } else {
          const msg = e?.response?.data?.message || "Gagal membuat request";
          this.error = msg; this.alert("error", "Gagal", msg);
        }
      } finally {
        this.saving = false;
      }
    },

    async completeRequest(row) {
      if (this.busyId) return;
      this.busyId = row.id; this.error = "";
      try {
        await this.api().post(`/complete/${row.id}`);
        row.status = "done";
        this.toast("success", "Request completed");
      } catch (e) {
        const msg = e?.response?.data?.message || "Gagal menyelesaikan request";
        this.error = msg; this.alert("error", "Gagal", msg);
      } finally {
        this.busyId = null;
      }
    },
  },
};
</script>
