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
                <th class="px-6 py-3">#</th>
                <th class="px-6 py-3">Code</th>
                <th class="px-6 py-3">Name</th>
                <th class="px-6 py-3">Serial</th>
                <th class="px-6 py-3">Category</th>
                <th class="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(e, idx) in equipments" :key="e.id ?? idx" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                <td class="px-6 py-3 font-mono">{{ idx + 1 }}</td>
                <td class="px-6 py-3 font-mono">{{ e.code ?? e.asset_id ?? e.id ?? '-' }}</td>
                <td class="px-6 py-3">{{ e.name ?? e.asset_name ?? '-' }}</td>
                <td class="px-6 py-3">{{ e.serial ?? '-' }}</td>
                <td class="px-6 py-3">{{ e.category ?? '-' }}</td>
                <td class="px-6 py-3 text-right">
                  <div class="flex justify-end gap-2">
                    <button @click="viewEquipment(e)" class="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">View</button>
                    <button @click="editEquipment(e)" class="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700">Edit</button>
                    <button @click="deleteEquipment(e)" class="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Delete</button>
                  </div>
                </td>
              </tr>
              <tr v-if="!loading.equip && !equipments.length">
                <td colspan="6" class="px-6 py-6 text-center text-gray-400">No equipment</td>
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
                <td class="px-6 py-3 font-mono">#{{ r.id ?? '-' }}</td>
                <td class="px-6 py-3">
                  <div class="font-medium">{{ getRequestEquipmentName(r) }}</div>
                  <div class="text-xs text-gray-500">{{ getRequestEquipmentCode(r) }}</div>
                </td>
                <td class="px-6 py-3 capitalize">{{ r.type ?? '-' }}</td>
                <td class="px-6 py-3 capitalize">
                  <span v-if="r.priority==='high'" class="px-2 py-1 text-xs rounded bg-red-100 text-red-700">High</span>
                  <span v-else-if="r.priority==='low'" class="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">Low</span>
                  <span v-else class="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700">Normal</span>
                </td>
                <td class="px-6 py-3 capitalize">
                  <span v-if="r.status==='done'" class="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Done</span>
                  <span v-else class="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700">{{ r.status ?? '-' }}</span>
                </td>
                <td class="px-6 py-3 text-right">
                  <div class="flex justify-end gap-2">
                    <button @click="viewRequest(r)" class="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">View</button>
                    <button @click="editRequest(r)" class="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700">Edit</button>
                    <button @click="deleteRequest(r)" class="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Delete</button>

                    <button
                      v-if="r.status!=='done'"
                      :disabled="busyId===r.id"
                      @click="completeRequest(r)"
                      class="px-2 py-1 rounded border dark:border-gray-600"
                    >
                      {{ busyId===r.id ? 'Completing…' : 'Complete' }}
                    </button>
                  </div>
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
              <div class="font-medium dark:text-gray-100">{{ p.name ?? ('Plan #'+(p.id ?? '?')) }}</div>
              <div class="text-xs text-gray-500">{{ getPlanEquipmentName(p) }}</div>
              <div class="text-xs mt-1">Interval: {{ p.frequency ?? p.interval ?? '-' }}</div>
              <div class="text-xs">Next: {{ p.next_date ?? p.next_due ?? '-' }}</div>
              <div class="text-xs text-gray-500 mt-1">{{ p.procedure ?? '' }}</div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ===== MODALS ===== -->

    <!-- VIEW modal (used for both equipment & request) -->
    <div v-if="modal.open && (modal.mode==='equip_view' || modal.mode==='req_view')" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="closeModal"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-lg p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">{{ modal.mode==='equip_view' ? 'Equipment Details' : 'Request Details' }}</h3>

        <div v-if="modal.mode==='equip_view'">
          <div class="text-sm">Name: <span class="font-medium">{{ viewData.name }}</span></div>
          <div class="text-sm">Code: <span class="font-medium">{{ viewData.code }}</span></div>
          <div class="text-sm">Serial: <span class="font-medium">{{ viewData.serial }}</span></div>
          <div class="text-sm">Category: <span class="font-medium">{{ viewData.category }}</span></div>
        </div>

        <div v-else>
          <div class="text-sm">ID: <span class="font-medium">#{{ viewData.id }}</span></div>
          <div class="text-sm">Equipment: <span class="font-medium">{{ getRequestEquipmentName(viewData) }}</span></div>
          <div class="text-sm">Type: <span class="font-medium">{{ viewData.type }}</span></div>
          <div class="text-sm">Priority: <span class="font-medium">{{ viewData.priority }}</span></div>
          <div class="text-sm">Note: <div class="mt-2 p-2 bg-gray-50 rounded text-sm">{{ viewData.note }}</div></div>
        </div>

        <div class="mt-5 text-right">
          <button class="px-3 py-2 rounded border" @click="closeModal">Close</button>
        </div>
      </div>
    </div>

    <!-- CREATE / EDIT Equipment modal -->
    <div v-if="modal.open && (modal.mode==='equip' || modal.mode==='equip_edit')" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="closeModal"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-lg p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">{{ modal.mode==='equip' ? 'Add Equipment' : 'Edit Equipment' }}</h3>

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
          <button @click="closeModal" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button v-if="modal.mode==='equip'" @click="saveEquipment" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
          <button v-else @click="updateEquipment()" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Updating…' : 'Update' }}
          </button>
        </div>
      </div>
    </div>

    <!-- CREATE / EDIT Request modal -->
    <div v-if="modal.open && (modal.mode==='req' || modal.mode==='req_edit')" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="closeModal"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-lg p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">{{ modal.mode==='req' ? 'New Maintenance Request' : 'Edit Maintenance Request' }}</h3>

        <div class="grid gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Equipment <span class="text-red-500">*</span></label>
            <select v-model.number="reqForm.equipment_id" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option value="">-- Select equipment --</option>
              <option v-for="e in equipments" :key="e.id" :value="e.id">{{ e.name ?? e.asset_name ?? ('#'+(e.id ?? '')) }}</option>
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
          <button @click="closeModal" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button v-if="modal.mode==='req'" @click="saveRequest" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
          <button v-else @click="updateRequest()" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Updating…' : 'Update' }}
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

      // forms & helpers
      equipForm: { id: null, name: "", code: "", serial: "", category: "" },
      reqForm: { id: null, equipment_id: "", type: "", note: "", priority: "normal" },

      // view content
      viewData: {},
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
    // ==============================
    // SMALL HELPERS
    // ==============================
    alert(icon, title, text = "") {
      return Swal.fire({ icon, title, text });
    },

    toast(icon, title) {
      Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1400,
        timerProgressBar: true,
      }).fire({ icon, title });
    },

    resolveBaseUrl() {
      const raw =
        import.meta?.env?.VITE_API_BASE ||
        process?.env?.VUE_APP_API_BASE ||
        "http://localhost:8000";

      return String(raw).trim().replace(/\/+$/, "");
    },

    api() {
      const API_BASE = this.resolveBaseUrl();
      const token = localStorage.getItem("token");

      return axios.create({
        baseURL: `${API_BASE}/api/scm/maintenance`,
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    },

    // ==============================
    // Extractor lebih kuat
    // ==============================
    extractArray(payload, key = null) {
      if (!payload) return [];

      if (key && payload[key]) {
        const v = payload[key];
        if (Array.isArray(v)) return v;
        if (Array.isArray(v?.data)) return v.data;
      }

      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload?.data?.data)) return payload.data.data;
      if (Array.isArray(payload?.items)) return payload.items;
      if (Array.isArray(payload?.results)) return payload.results;

      return [];
    },

    // ==============================
    // LOADERS
    // ==============================
    async loadEquipments() {
      this.loading.equip = true;
      try {
        const res = await this.api().get("/equipments");
        const payload = res.data || {};
        let arr = this.extractArray(payload, "equipments");

        if (!arr.length) arr = this.extractArray(payload);

        // mapping supaya code tidak hilang
        this.equipments = arr.map((e) => ({
          id: e.id,
          name: e.name ?? e.equipment_name ?? e.asset?.name ?? "-",
          code: e.code ?? e.equipment_code ?? e.asset_code ?? e.asset?.code ?? "",
          serial: e.serial ?? e.serial_number ?? "",
          category: e.category ?? e.type ?? "",
        }));
      } catch (e) {
        this.alert("error", "Load gagal", e?.response?.data?.message || "Gagal memuat equipments");
      } finally {
        this.loading.equip = false;
      }
    },

    async loadRequests() {
      this.loading.req = true;
      try {
        const res = await this.api().get("/requests");
        const payload = res.data || {};
        let arr = this.extractArray(payload, "requests");
        if (!arr.length) arr = this.extractArray(payload);

        this.requests = arr;
      } catch (e) {
        this.alert("error", "Load gagal", e?.response?.data?.message || "Gagal memuat requests");
      } finally {
        this.loading.req = false;
      }
    },

    async loadPlans() {
      this.loading.plan = true;
      try {
        const res = await this.api().get("/plans");
        const payload = res.data || {};
        let arr = this.extractArray(payload, "plans");

        if (!arr.length) arr = this.extractArray(payload);

        this.plans = arr;
      } catch (e) {
        this.alert("error", "Load gagal", e?.response?.data?.message || "Gagal memuat plans");
      } finally {
        this.loading.plan = false;
      }
    },

    reloadAll() {
      return Promise.all([
        this.loadEquipments(),
        this.loadRequests(),
        this.loadPlans(),
      ]);
    },

    // ==============================
    // EQUIPMENTS CRUD
    // ==============================
    openNewEquipment() {
      this.modal = { open: true, mode: "equip" };
      this.error = "";
      this.fieldErrors = {};
      this.equipForm = { id: null, name: "", code: "", serial: "", category: "" };
    },

    async saveEquipment() {
      if (this.saving) return;
      this.saving = true;
      this.fieldErrors = {};

      try {
        const payload = {
          name: this.equipForm.name.trim(),
          code: this.equipForm.code.trim(),
          serial: this.equipForm.serial?.trim() || null,
          category: this.equipForm.category?.trim() || null,
        };

        if (!payload.name) this.fieldErrors.name = ["Name wajib diisi."];
        if (!payload.code) this.fieldErrors.code = ["Code wajib diisi."];

        if (Object.keys(this.fieldErrors).length) {
          throw { response: { status: 422, data: { errors: this.fieldErrors } } };
        }

        const res = await this.api().post("/equipments", payload);
        const created = res.data?.equipment ?? res.data?.data ?? payload;

        this.equipments.unshift(created);
        this.toast("success", "Equipment saved");
        this.closeModal();
      } catch (e) {
        if (e?.response?.status === 422) {
          this.fieldErrors = e.response.data.errors || {};
          const msg = Object.values(this.fieldErrors)[0][0];
          this.alert("error", "Validasi gagal", msg);
        } else {
          this.alert("error", "Gagal", e?.response?.data?.message || "Gagal menyimpan equipment");
        }
      } finally {
        this.saving = false;
      }
    },

    viewEquipment(e) {
      this.viewData = {
        name: e.name ?? "-",
        code: e.code ?? "",
        serial: e.serial ?? "",
        category: e.category ?? "",
      };

      this.modal = { open: true, mode: "equip_view" };
    },

    editEquipment(e) {
      this.equipForm = { ...e };
      this.modal = { open: true, mode: "equip_edit" };
    },

    async updateEquipment() {
      if (this.saving) return;
      this.saving = true;
      this.fieldErrors = {};

      try {
        const id = this.equipForm.id;

        const payload = {
          name: this.equipForm.name.trim(),
          code: this.equipForm.code.trim(),
          serial: this.equipForm.serial?.trim() || null,
          category: this.equipForm.category?.trim() || null,
        };

        const res = await this.api().put(`/equipments/${id}`, payload);
        const updated = res.data?.equipment ?? res.data?.data ?? payload;

        this.equipments = this.equipments.map((x) =>
          x.id === id ? { ...x, ...updated } : x
        );

        this.toast("success", "Equipment updated");
        this.closeModal();
      } catch (e) {
        this.alert("error", "Gagal", e?.response?.data?.message || "Tidak dapat update");
      } finally {
        this.saving = false;
      }
    },

    async deleteEquipment(e) {
      const ok = await Swal.fire({
        icon: "warning",
        title: "Delete Equipment?",
        text: `Equipment "${e.name}" akan dihapus.`,
        showCancelButton: true,
        confirmButtonText: "Delete",
      });

      if (!ok.isConfirmed) return;

      try {
        await this.api().delete(`/equipments/${e.id}`);
        this.equipments = this.equipments.filter((x) => x.id !== e.id);
        this.toast("success", "Equipment deleted");
      } catch (err) {
        this.alert("error", "Gagal", err?.response?.data?.message || "Error delete");
      }
    },

    // ==============================
    // REQUEST CRUD
    // ==============================
    openNewRequest() {
      this.reqForm = { id: null, equipment_id: "", type: "", note: "", priority: "normal" };
      this.modal = { open: true, mode: "req" };
    },

    async saveRequest() {
      if (this.saving) return;
      this.saving = true;
      this.fieldErrors = {};

      try {
        const payload = {
          equipment_id: Number(this.reqForm.equipment_id),
          type: this.reqForm.type.trim(),
          note: this.reqForm.note || "",
          priority: this.reqForm.priority || "normal",
        };

        if (!payload.equipment_id)
          this.fieldErrors.equipment_id = ["Equipment wajib dipilih."];
        if (!payload.type)
          this.fieldErrors.type = ["Type wajib diisi."];

        if (Object.keys(this.fieldErrors).length) {
          throw { response: { status: 422, data: { errors: this.fieldErrors } } };
        }

        const res = await this.api().post("/requests", payload);
        const created = res.data?.request ?? res.data?.data ?? payload;

        this.requests.unshift(created);
        this.toast("success", "Request saved");
        this.closeModal();
      } catch (e) {
        this.alert("error", "Gagal", e?.response?.data?.message || "Gagal membuat request");
      } finally {
        this.saving = false;
      }
    },

    viewRequest(r) {
      this.viewData = { ...r };
      this.modal = { open: true, mode: "req_view" };
    },

    editRequest(r) {
      this.reqForm = { ...r };
      this.modal = { open: true, mode: "req_edit" };
    },

    async updateRequest() {
      if (this.saving) return;
      this.saving = true;
      this.fieldErrors = {};

      try {
        const id = this.reqForm.id;
        const payload = {
          equipment_id: Number(this.reqForm.equipment_id),
          type: this.reqForm.type.trim(),
          note: this.reqForm.note?.trim() || null,
          priority: this.reqForm.priority || "normal",
        };

        const res = await this.api().put(`/requests/${id}`, payload);
        const updated = res.data?.request ?? res.data?.data ?? payload;

        this.requests = this.requests.map((x) =>
          x.id === id ? { ...x, ...updated } : x
        );

        this.toast("success", "Request updated");
        this.closeModal();
      } catch (e) {
        this.alert("error", "Gagal", e?.response?.data?.message || "Tidak dapat update");
      } finally {
        this.saving = false;
      }
    },

    async deleteRequest(r) {
      const ok = await Swal.fire({
        icon: "warning",
        title: "Delete Request?",
        text: `Request #${r.id} akan dihapus.`,
        showCancelButton: true,
        confirmButtonText: "Delete",
      });

      if (!ok.isConfirmed) return;

      try {
        await this.api().delete(`/requests/${r.id}`);
        this.requests = this.requests.filter((x) => x.id !== r.id);
        this.toast("success", "Request deleted");
      } catch (err) {
        this.alert("error", "Gagal", err?.response?.data?.message || "Error delete");
      }
    },

    // ==============================
    // COMPLETE REQUEST
    // ==============================
    async completeRequest(r) {
      if (this.busyId) return;
      this.busyId = r.id;

      try {
        await this.api().post(`/requests/${r.id}/complete`);
        r.status = "done";
        this.toast("success", "Request completed");
      } catch (e) {
        this.alert("error", "Gagal", e?.response?.data?.message || "Tidak dapat complete");
      } finally {
        this.busyId = null;
      }
    },

    // ==============================
    // UTILS
    // ==============================
    getRequestEquipmentName(r) {
      return (
        r?.equipment?.name ||
        r?.equipment_name ||
        r?.asset?.name ||
        "-"
      );
    },

    getRequestEquipmentCode(r) {
      return (
        r?.equipment?.code ||
        r?.asset?.code ||
        ""
      );
    },

    getPlanEquipmentName(p) {
      return (
        p?.equipment?.name ||
        p?.equipment_name ||
        p?.asset?.name ||
        "-"
      );
    },

    closeModal() {
      this.modal = { open: false, mode: null };
      this.viewData = {};
      this.fieldErrors = {};
      this.error = "";

      this.equipForm = { id: null, name: "", code: "", serial: "", category: "" };
      this.reqForm = { id: null, equipment_id: "", type: "", note: "", priority: "normal" };
    },
  },
};
</script>

