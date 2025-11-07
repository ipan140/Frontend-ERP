<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">scm</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Quality</h1>
      </div>

      <div class="flex gap-2 w-full lg:w-auto">
        <button
          @click="openQC()"
          class="inline-flex items-center justify-center gap-2 bg-primary text-white rounded py-2.5 px-5 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[.98] transition"
          title="New Quality Check"
        >
          <Icon icon="mdi:check-decagram" class="text-xl" />
          <span class="font-medium">New QC</span>
        </button>
        <button
          @click="openNC()"
          class="inline-flex items-center justify-center gap-2 border dark:border-gray-700 rounded py-2.5 px-5 hover:bg-gray-50 dark:hover:bg-gray-700"
          title="Record Non-Conformance"
        >
          <Icon icon="mdi:alert-decagram-outline" class="text-xl" />
          <span class="font-medium">Record NC</span>
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
      <!-- QC List -->
      <div class="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
        <div class="px-5 py-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold dark:text-gray-100">Quality Checks</h3>
          <button @click="loadChecks" class="text-sm px-3 py-1.5 rounded border dark:border-gray-700">Reload</button>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
            <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th class="px-6 py-3">ID</th>
                <th class="px-6 py-3">Lot</th>
                <th class="px-6 py-3">Point</th>
                <th class="px-6 py-3">Result</th>
                <th class="px-6 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="q in qchecks" :key="q.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                <td class="px-6 py-3 font-mono">#{{ q.id }}</td>
                <td class="px-6 py-3">
                  <span v-if="q.lot?.number">Lot {{ q.lot.number }}</span>
                  <span v-else>Lot {{ q.lot_id }}</span>
                </td>
                <td class="px-6 py-3">{{ q.point }}</td>
                <td class="px-6 py-3">
                  <span v-if="(q.result||'').toLowerCase()==='pass'" class="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Pass</span>
                  <span v-else class="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Fail</span>
                </td>
                <td class="px-6 py-3 truncate max-w-[260px]" :title="q.note">{{ q.note || '-' }}</td>
              </tr>
              <tr v-if="!loading.checks && !qchecks.length">
                <td colspan="5" class="px-6 py-6 text-center text-gray-400">No quality checks</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Checkpoints + Reports -->
      <div class="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
        <div class="px-5 py-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold dark:text-gray-100">Checkpoints & Reports</h3>
          <div class="flex gap-2">
            <button @click="loadCheckpoints" class="text-sm px-3 py-1.5 rounded border dark:border-gray-700">Reload Points</button>
            <button @click="loadReports" class="text-sm px-3 py-1.5 rounded border dark:border-gray-700">Reload Reports</button>
          </div>
        </div>

        <div class="p-5 grid gap-4">
          <div>
            <h4 class="font-medium dark:text-gray-100 mb-2">Available Checkpoints</h4>
            <ul class="list-disc ml-5 text-sm">
              <li v-for="c in checkpoints" :key="c.id">{{ c.name }}</li>
            </ul>
            <p v-if="!loading.points && !checkpoints.length" class="text-sm text-gray-400">No checkpoints</p>
          </div>

          <!-- Reports (summary) - Cards + Progress -->
          <div>
            <h4 class="font-medium dark:text-gray-100 mb-2">Reports (summary)</h4>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="rounded-xl border dark:border-gray-700 p-3">
                <div class="text-xs text-gray-500 dark:text-gray-400">Total</div>
                <div class="text-2xl font-semibold">{{ summary.total }}</div>
              </div>
              <div class="rounded-xl border dark:border-gray-700 p-3">
                <div class="text-xs text-gray-500 dark:text-gray-400">Pass</div>
                <div class="text-2xl font-semibold text-green-600 dark:text-green-400">
                  {{ summary.pass }}
                </div>
              </div>
              <div class="rounded-xl border dark:border-gray-700 p-3">
                <div class="text-xs text-gray-500 dark:text-gray-400">Fail</div>
                <div class="text-2xl font-semibold text-red-600 dark:text-red-400">
                  {{ summary.fail }}
                </div>
              </div>
              <div class="rounded-xl border dark:border-gray-700 p-3">
                <div class="text-xs text-gray-500 dark:text-gray-400">Pass Rate</div>
                <div class="text-2xl font-semibold">
                  {{ (summary.pass_rate * 100).toFixed(0) }}%
                </div>
              </div>
            </div>

            <div class="mt-3">
              <div class="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  class="h-full bg-green-500 dark:bg-green-400"
                  :style="{ width: (summary.pass_rate * 100) + '%' }"
                ></div>
              </div>
              <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ summary.pass }} pass / {{ summary.fail }} fail
              </div>
            </div>

            <p
              v-if="!loading.reports && summary.total === 0"
              class="text-sm text-gray-400 mt-3"
            >
              Belum ada data report.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: New Quality Check -->
    <div v-if="modal.open && modal.mode==='qc'" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open=false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">New Quality Check</h3>

        <div class="grid gap-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm mb-1 dark:text-gray-300">Lot ID <span class="text-red-500">*</span></label>
              <input v-model.number="qcForm.lot_id" type="number" min="1" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
              <p v-if="fieldErrors.lot_id" class="text-xs text-red-500 mt-1">{{ fieldErrors.lot_id[0] }}</p>
            </div>
            <div>
              <label class="block text-sm mb-1 dark:text-gray-300">Point <span class="text-red-500">*</span></label>
              <select v-model="qcForm.point" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
                <option value="">-- Select --</option>
                <option v-for="c in checkpoints" :key="c.id" :value="c.name">{{ c.name }}</option>
                <option value="Receipt">Receipt</option>
                <option value="InProcess">InProcess</option>
                <option value="Delivery">Delivery</option>
              </select>
              <p v-if="fieldErrors.point" class="text-xs text-red-500 mt-1">{{ fieldErrors.point[0] }}</p>
            </div>
          </div>

          <!-- Metrics key-value -->
          <div class="border dark:border-gray-700 rounded-md p-3">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-medium dark:text-gray-100">Metrics (optional)</h4>
              <button @click="addMetric" class="px-2 py-1 text-xs rounded border dark:border-gray-600">Add</button>
            </div>
            <div v-for="(m,idx) in qcForm.metrics" :key="'m-'+idx" class="grid grid-cols-2 gap-2 mb-2">
              <input v-model="m.key" placeholder="Key (e.g. moisture)" class="border dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-200" />
              <div class="flex gap-2">
                <input v-model="m.value" placeholder="Value" class="flex-1 border dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-200" />
                <button @click="removeMetric(idx)" class="px-2 py-1 text-xs rounded border dark:border-gray-600">Del</button>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm mb-1 dark:text-gray-300">Result <span class="text-red-500">*</span></label>
              <select v-model="qcForm.result" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
                <option value="">-- Select --</option>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
              </select>
              <p v-if="fieldErrors.result" class="text-xs text-red-500 mt-1">{{ fieldErrors.result[0] }}</p>
            </div>
            <div>
              <label class="block text-sm mb-1 dark:text-gray-300">Photo URL</label>
              <input v-model="qcForm.photo_url" type="url" placeholder="https://…" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
              <p v-if="fieldErrors.photo_url" class="text-xs text-red-500 mt-1">{{ fieldErrors.photo_url[0] }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Note</label>
            <textarea v-model="qcForm.note" rows="3" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"></textarea>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open=false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="saveQC" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Non-Conformance -->
    <div v-if="modal.open && modal.mode==='nc'" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open=false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-lg p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Record Non-Conformance</h3>

        <div class="grid gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Lot ID <span class="text-red-500">*</span></label>
            <input v-model.number="ncForm.lot_id" type="number" min="1" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.lot_id" class="text-xs text-red-500 mt-1">{{ fieldErrors.lot_id[0] }}</p>
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Reason <span class="text-red-500">*</span></label>
            <input v-model="ncForm.reason" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.reason" class="text-xs text-red-500 mt-1">{{ fieldErrors.reason[0] }}</p>
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Action</label>
            <select v-model="ncForm.action" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option value="">-- Select (optional) --</option>
              <option value="rework">Rework</option>
              <option value="scrap">Scrap</option>
              <option value="downgrade">Downgrade</option>
            </select>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open=false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="saveNC" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
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
  name: "ScmQuality",
  components: { Icon },

  data() {
    return {
      loading: { points: false, checks: false, reports: false },
      saving: false,
      error: "",
      fieldErrors: {},

      checkpoints: [],
      qchecks: [],
      reports: [],   // bisa object {total,pass,fail} atau array

      modal: { open: false, mode: null },

      qcForm: {
        lot_id: null,
        point: "",
        metrics: [], // [{key:'moisture', value:'12%'}]
        result: "",
        note: "",
        photo_url: "",
      },

      ncForm: {
        lot_id: null,
        reason: "",
        action: "",
      },
    };
  },

  computed: {
    isBusy() {
      return this.loading.points || this.loading.checks || this.loading.reports;
    },
    // Normalisasi bentuk reports → { total, pass, fail, pass_rate }
    summary() {
      let total = 0, pass = 0, fail = 0;

      if (Array.isArray(this.reports)) {
        total = this.reports.length;
        for (const r of this.reports) {
          const res = (r?.result ?? '').toString().toLowerCase();
          if (res === 'pass' || r?.result === true) pass++;
          else if (res === 'fail' || r?.result === false) fail++;
        }
      } else if (this.reports && typeof this.reports === 'object') {
        total = Number(this.reports.total ?? 0);
        pass  = Number(this.reports.pass  ?? 0);
        fail  = Number(this.reports.fail  ?? Math.max(0, total - pass));
      }

      const pass_rate = total > 0 ? pass / total : 0;
      return { total, pass, fail, pass_rate };
    }
  },

  mounted() {
    this.reloadAll();
  },

  methods: {
    // Helpers
    toast(icon, title) {
      const T = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 1600, timerProgressBar: true });
      T.fire({ icon, title });
    },
    alert(icon, title, text) { return Swal.fire({ icon, title, text }); },

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
        baseURL: `${API_BASE}/api/scm/quality`,
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
    async loadCheckpoints() {
      this.loading.points = true; this.error = "";
      try {
        const { data } = await this.api().get("/checkpoints");
        this.checkpoints = Array.isArray(data?.data) ? data.data : [];
      } catch (e) {
        const msg = e?.response?.data?.message || "Gagal memuat checkpoints";
        this.error = msg; this.alert("error", "Load gagal", msg);
      } finally {
        this.loading.points = false;
      }
    },
    async loadChecks() {
      this.loading.checks = true; this.error = "";
      try {
        const { data } = await this.api().get("/checks");
        const list = Array.isArray(data?.checks) ? data.checks : (Array.isArray(data?.data) ? data.data : []);
        this.qchecks = list;
      } catch (e) {
        const msg = e?.response?.data?.message || "Gagal memuat quality checks";
        this.error = msg; this.alert("error", "Load gagal", msg);
      } finally {
        this.loading.checks = false;
      }
    },
    async loadReports() {
      this.loading.reports = true; this.error = "";
      try {
        const { data } = await this.api().get("/reports", { params: {} });
        // backend bisa kembalikan { summary: {total,pass,fail} } atau array checks
        this.reports = data?.summary ?? (Array.isArray(data) ? data : []);
      } catch (e) {
        const msg = e?.response?.data?.message || "Gagal memuat reports";
        this.error = msg; this.alert("error", "Load gagal", msg);
      } finally {
        this.loading.reports = false;
      }
    },
    async reloadAll() {
      await Promise.all([this.loadCheckpoints(), this.loadChecks(), this.loadReports()]);
    },

    // Modals
    openQC() {
      this.modal = { open: true, mode: "qc" };
      this.error = ""; this.fieldErrors = {};
      this.qcForm = { lot_id: null, point: "", metrics: [], result: "", note: "", photo_url: "" };
      if (!this.checkpoints.length) this.loadCheckpoints();
    },
    openNC() {
      this.modal = { open: true, mode: "nc" };
      this.error = ""; this.fieldErrors = {};
      this.ncForm = { lot_id: null, reason: "", action: "" };
    },

    addMetric() {
      this.qcForm.metrics.push({ key: "", value: "" });
    },
    removeMetric(i) {
      this.qcForm.metrics.splice(i, 1);
    },

    // Actions
    async saveQC() {
      if (this.saving) return;
      this.saving = true; this.error = ""; this.fieldErrors = {};
      try {
        const metricsPayload = this.qcForm.metrics
          .filter(m => String(m.key || "").trim().length)
          .reduce((acc, m) => ({ ...acc, [m.key.trim()]: m.value }), {});

        const payload = {
          lot_id: Number(this.qcForm.lot_id),
          point: String(this.qcForm.point || "").trim(),
          metrics: Object.keys(metricsPayload).length ? metricsPayload : null,
          result: String(this.qcForm.result || "").trim(),
          note: String(this.qcForm.note || "").trim() || null,
          photo_url: String(this.qcForm.photo_url || "").trim() || null,
        };

        if (!payload.lot_id) throw { response: { status: 422, data: { errors: { lot_id: ["Lot wajib diisi."] } } } };
        if (!payload.point)  throw { response: { status: 422, data: { errors: { point: ["Point wajib dipilih."] } } } };
        if (!payload.result) throw { response: { status: 422, data: { errors: { result: ["Result wajib dipilih."] } } } };

        const { data } = await this.api().post("/checks", payload);

        const created = data?.qc || { id: Date.now(), ...payload };
        this.qchecks.unshift(created);

        this.toast("success", "Quality check saved");
        this.modal.open = false;
      } catch (e) {
        if (e?.response?.status === 422) {
          this.fieldErrors = e.response.data?.errors || {};
          const msg = Object.values(this.fieldErrors)?.[0]?.[0] || "Validasi gagal";
          this.error = msg; this.alert("error", "Validasi gagal", msg);
        } else {
          const msg = e?.response?.data?.message || "Gagal menyimpan quality check";
          this.error = msg; this.alert("error", "Gagal", msg);
        }
      } finally {
        this.saving = false;
      }
    },

    async saveNC() {
      if (this.saving) return;
      this.saving = true; this.error = ""; this.fieldErrors = {};
      try {
        const payload = {
          lot_id: Number(this.ncForm.lot_id),
          reason: String(this.ncForm.reason || "").trim(),
          action: String(this.ncForm.action || "").trim() || null,
        };

        if (!payload.lot_id) throw { response: { status: 422, data: { errors: { lot_id: ["Lot wajib diisi."] } } } };
        if (!payload.reason) throw { response: { status: 422, data: { errors: { reason: ["Reason wajib diisi."] } } } };

        await this.api().post("/nonconformance", payload);

        this.toast("success", "Non-conformance recorded");
        this.modal.open = false;
      } catch (e) {
        if (e?.response?.status === 422) {
          this.fieldErrors = e.response.data?.errors || {};
          const msg = Object.values(this.fieldErrors)?.[0]?.[0] || "Validasi gagal";
          this.error = msg; this.alert("error", "Validasi gagal", msg);
        } else {
          const msg = e?.response?.data?.message || "Gagal menyimpan non-conformance";
          this.error = msg; this.alert("error", "Gagal", msg);
        }
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>
