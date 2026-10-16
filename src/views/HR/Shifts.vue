<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">hr</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Attendances</h1>
      </div>

      <!-- Quick actions -->
      <div class="flex flex-wrap gap-2">
        <button @click="openCreate" class="bg-primary text-white px-4 py-2 rounded border border-primary hover:bg-primary/90">
          + Add Manual
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="mt-4 p-4 bg-white dark:bg-gray-800 rounded shadow">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <!-- Employee -->
        <div>
          <label class="block text-sm mb-1 dark:text-gray-300">Employee</label>
          <div class="flex gap-2">
            <select v-model="q.employee_id" @change="reload(1)"
                    class="flex-1 border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
              <option :value="null">All employees</option>
              <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
            </select>
            <input v-model="lookups.employeeSearch" @input="debouncedLoadEmployees"
                   placeholder="Find employee…" class="w-40 border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
          </div>
        </div>

        <!-- Shift -->
        <div>
          <label class="block text-sm mb-1 dark:text-gray-300">Shift</label>
          <div class="flex gap-2">
            <select v-model="q.shift_id" @change="reload(1)"
                    class="flex-1 border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
              <option :value="null">All shifts</option>
              <option v-for="s in shifts" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
            <input v-model="lookups.shiftSearch" @input="debouncedLoadShifts"
                   placeholder="Find shift…" class="w-40 border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
          </div>
        </div>

        <!-- Date range -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">From</label>
            <input type="date" v-model="q.date_from" @change="reload(1)"
                   class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700" />
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">To</label>
            <input type="date" v-model="q.date_to" @change="reload(1)"
                   class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700" />
          </div>
        </div>

        <!-- Search -->
        <div>
          <label class="block text-sm mb-1 dark:text-gray-300">Search</label>
          <input v-model="q.search" @input="debouncedSearch" @keyup.enter="reload(1)"
                 placeholder="Search note / yyyy-mm-dd"
                 class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700" />
        </div>

        <!-- Per page -->
        <div>
          <label class="block text-sm mb-1 dark:text-gray-300">Per page</label>
          <select v-model="q.per_page" @change="reload(1)"
                  class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
            <option v-for="n in [10,20,50,100]" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>

        <!-- Quick Kiosk/Mobile -->
        <div class="flex items-end gap-2">
          <div class="flex-1">
            <label class="block text-sm mb-1 dark:text-gray-300">Quick employee</label>
            <select v-model="quick.employee_id"
                    class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
              <option :value="null" disabled>Select employee…</option>
              <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">&nbsp;</label>
            <div class="flex gap-2">
              <button @click="quickCheckIn" class="px-3 py-2 rounded border dark:border-gray-700 bg-green-600 text-white disabled:opacity-40"
                      :disabled="!quick.employee_id || loading">
                Check In
              </button>
              <button @click="quickCheckOut" class="px-3 py-2 rounded border dark:border-gray-700 bg-red-600 text-white disabled:opacity-40"
                      :disabled="!quick.employee_id || loading">
                Check Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="flash" class="mt-3 text-sm" :class="flashType === 'error' ? 'text-red-600' : 'text-green-600'">
        {{ flash }}
      </div>
    </div>

    <!-- Table -->
    <div class="mt-4 overflow-x-auto bg-white rounded-lg shadow-md dark:bg-gray-800">
      <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
        <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th class="px-6 py-3">ID</th>
            <th class="px-6 py-3">Employee</th>
            <th class="px-6 py-3">Shift</th>
            <th class="px-6 py-3">Check In</th>
            <th class="px-6 py-3">Check Out</th>
            <th class="px-6 py-3">Duration</th>
            <th class="px-6 py-3">Source</th>
            <th class="px-6 py-3">Note</th>
            <th class="px-6 py-3 w-40">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
            <td class="px-6 py-3">{{ r.id }}</td>
            <td class="px-6 py-3">
              <div class="font-medium">{{ r.employee?.name || '-' }}</div>
              <div class="text-xs text-gray-500">#{{ r.employee_id }}</div>
            </td>
            <td class="px-6 py-3">{{ r.shift?.name || '-' }}</td>
            <td class="px-6 py-3">{{ r.check_in ? formatDateTime(r.check_in) : '-' }}</td>
            <td class="px-6 py-3">{{ r.check_out ? formatDateTime(r.check_out) : '-' }}</td>
            <td class="px-6 py-3">
              <span v-if="isNum(r.work_duration_minutes)">{{ hhmm(r.work_duration_minutes) }}</span>
              <span v-else>-</span>
            </td>
            <td class="px-6 py-3 capitalize">{{ r.source || '-' }}</td>
            <td class="px-6 py-3">{{ r.note || '-' }}</td>
            <td class="px-6 py-3">
              <div class="flex flex-wrap gap-2">
                <button @click="openEdit(r)" class="px-3 py-1 rounded border dark:border-gray-700">Edit</button>
                <button @click="remove(r)" class="px-3 py-1 rounded border dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
              </div>
            </td>
          </tr>

          <tr v-if="!loading && !rows.length">
            <td colspan="9" class="px-6 py-6 text-center text-gray-400">No data</td>
          </tr>
        </tbody>
      </table>

      <div class="px-5 py-4 flex items-center justify-between">
        <button :disabled="!page.prev" @click="go(page.current - 1)"
                class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">Prev</button>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ page.from || 0 }}–{{ page.to || 0 }} of {{ page.total || 0 }} | Page {{ page.current || 1 }} / {{ page.last || 1 }}
        </div>
        <button :disabled="!page.next" @click="go(page.current + 1)"
                class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">Next</button>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="modal.open" class="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow max-w-2xl w-full p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold">{{ modal.mode === 'create' ? 'Add Attendance' : 'Edit Attendance' }}</h3>
          <button @click="closeModal" class="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Employee -->
          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Employee <span class="text-red-600">*</span></label>
            <select v-model="form.employee_id"
                    class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
              <option :value="null" disabled>Select employee…</option>
              <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
            </select>
          </div>

          <!-- Shift -->
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Shift</label>
            <select v-model="form.shift_id"
                    class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
              <option :value="null">-</option>
              <option v-for="s in shifts" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>

          <!-- Source -->
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Source <span class="text-red-600">*</span></label>
            <select v-model="form.source"
                    class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
              <option value="manual">manual</option>
              <option value="kiosk">kiosk</option>
              <option value="mobile">mobile</option>
            </select>
          </div>

          <!-- Check in/out -->
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Check In</label>
            <input type="datetime-local" v-model="form.check_in"
                   class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700" />
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Check Out</label>
            <input type="datetime-local" v-model="form.check_out"
                   class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700" />
          </div>

          <!-- Note -->
          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Note</label>
            <textarea v-model="form.note" rows="3"
                      class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"></textarea>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-end gap-2">
          <button @click="closeModal" class="px-4 py-2 rounded border dark:border-gray-700">Cancel</button>
          <button @click="save" :disabled="saving"
                  class="px-4 py-2 rounded border dark:border-gray-700 bg-primary text-white disabled:opacity-50">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>

        <div v-if="formError" class="mt-2 text-sm text-red-600">{{ formError }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "HRAttendances",

  data() {
    return {
      // list
      loading: false,
      rows: [],
      page: { current: 1, last: 1, total: 0, from: 0, to: 0, prev: false, next: false },

      // filter/query
      q: {
        page: 1,
        per_page: 20,
        employee_id: null,
        shift_id: null,
        date_from: "",
        date_to: "",
        search: "",
      },

      // lookups
      employees: [],
      shifts: [],
      lookups: {
        employeeSearch: "",
        shiftSearch: "",
        _empTimer: null,
        _shiftTimer: null,
      },

      // quick actions
      quick: { employee_id: null },

      // modal
      modal: { open: false, mode: "create" }, // create|edit
      form: {
        id: null,
        employee_id: null,
        shift_id: null,
        source: "manual",
        check_in: "",
        check_out: "",
        note: "",
      },
      saving: false,
      formError: "",
      flash: "",
      flashType: "ok", // ok | error

      _searchTimer: null,
    };
  },

  mounted() {
    this.loadEmployees();
    this.loadShifts();
    this.reload(1);
  },

  methods: {
    /* ================= axios ================= */
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
      const inst = axios.create({
        baseURL: `${API_BASE}/api`,
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      inst.interceptors.response.use(
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
      return inst;
    },

    /* ================= List ================= */
    async reload(p = null) {
      if (p) this.q.page = p;
      this.loading = true;
      this.flash = "";

      try {
        const params = this.cleanParams({
          ...this.q,
          per_page: this.toIntOrNull(this.q.per_page),
          employee_id: this.toIntOrNull(this.q.employee_id),
          shift_id: this.toIntOrNull(this.q.shift_id),
        });

        const { data } = await this.api().get("/hr/attendances", { params });

        const arr = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.rows = arr;

        this.page = {
          current: Number(data.current_page || params.page || 1),
          last: Number(data.last_page || 1),
          total: Number(data.total || arr.length),
          from: Number(data.from || (arr.length ? 1 : 0)),
          to: Number(data.to || arr.length),
          prev: Number(data.current_page || 1) > 1,
          next: Number(data.current_page || 1) < Number(data.last_page || 1),
        };
      } catch (e) {
        this.flash = e?.response?.data?.message || "Failed to load attendances.";
        this.flashType = "error";
      } finally {
        this.loading = false;
      }
    },

    go(p) {
      this.q.page = Math.max(1, p);
      this.reload();
    },

    debouncedSearch() {
      clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => this.reload(1), 350);
    },

    cleanParams(obj) {
      const out = { ...obj };
      Object.keys(out).forEach((k) => {
        const v = out[k];
        if (v === "" || v === null || v === undefined || (typeof v === "number" && isNaN(v))) {
          delete out[k];
        }
      });
      return out;
    },

    toIntOrNull(v) {
      if (v === null || v === undefined || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    },

    /* ================= Lookups ================= */
    async loadEmployees() {
      try {
        const search = this.lookups.employeeSearch?.trim();
        const { data } = await this.api().get("/hr/employees", {
          params: search ? { search, per_page: 50 } : { per_page: 50 },
        });
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : (data?.data || []);
        // pastikan ada field "name"
        this.employees = list.map((e) => ({
          id: e.id,
          name: e.name || e.full_name || [e.first_name, e.last_name].filter(Boolean).join(" ").trim() || e.emp_no || `Emp #${e.id}`,
        }));
      } catch {
        this.employees = [];
      }
    },
    async loadShifts() {
      try {
        const search = this.lookups.shiftSearch?.trim();
        const { data } = await this.api().get("/hr/shifts", {
          params: search ? { search, per_page: 50 } : { per_page: 50 },
        });
        this.shifts = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : (data?.data || []);
      } catch {
        this.shifts = [];
      }
    },
    debouncedLoadEmployees() {
      clearTimeout(this.lookups._empTimer);
      this.lookups._empTimer = setTimeout(this.loadEmployees, 350);
    },
    debouncedLoadShifts() {
      clearTimeout(this.lookups._shiftTimer);
      this.lookups._shiftTimer = setTimeout(this.loadShifts, 350);
    },

    /* ================= Modal ================= */
    openCreate() {
      this.modal = { open: true, mode: "create" };
      this.form = {
        id: null,
        employee_id: null,
        shift_id: null,
        source: "manual",
        check_in: "",
        check_out: "",
        note: "",
      };
      this.formError = "";
    },
    openEdit(row) {
      this.modal = { open: true, mode: "edit" };
      this.form = {
        id: row.id,
        employee_id: row.employee_id ?? row.employee?.id ?? null,
        shift_id: row.shift_id ?? row.shift?.id ?? null,
        source: row.source || "manual",
        check_in: row.check_in ? this.toLocalInput(row.check_in) : "",
        check_out: row.check_out ? this.toLocalInput(row.check_out) : "",
        note: row.note || "",
      };
      this.formError = "";
    },
    closeModal() {
      this.modal.open = false;
    },

    async save() {
      this.saving = true;
      this.formError = "";
      try {
        const payload = {
          employee_id: this.toIntOrNull(this.form.employee_id),
          shift_id: this.toIntOrNull(this.form.shift_id),
          source: this.form.source,
          check_in: this.form.check_in || null,
          check_out: this.form.check_out || null,
          note: this.form.note || null,
        };

        if (!payload.employee_id) throw new Error("Employee is required.");

        if (this.modal.mode === "create") {
          await this.api().post("/hr/attendances", payload);
        } else {
          await this.api().put(`/hr/attendances/${this.form.id}`, payload);
        }

        this.flash = "Saved.";
        this.flashType = "ok";
        this.closeModal();
        this.reload();
      } catch (e) {
        this.formError = e?.response?.data?.message || e?.message || "Failed to save.";
      } finally {
        this.saving = false;
      }
    },

    async remove(row) {
      if (!confirm(`Delete attendance #${row.id}?`)) return;
      try {
        await this.api().delete(`/hr/attendances/${row.id}`);
        this.reload();
      } catch (e) {
        this.flash = e?.response?.data?.message || "Failed to delete.";
        this.flashType = "error";
      }
    },

    /* ================= Quick Checkin/Checkout ================= */
    async quickCheckIn() {
      if (!this.quick.employee_id) return;
      this.loading = true;
      this.flash = "";
      try {
        await this.api().post("/hr/attendances/checkin", {
          employee_id: this.toIntOrNull(this.quick.employee_id),
          source: "kiosk",
        });
        this.flash = "Check-in recorded.";
        this.flashType = "ok";
        this.reload(1);
      } catch (e) {
        this.flash = e?.response?.data?.message || "Failed to check in.";
        this.flashType = "error";
      } finally {
        this.loading = false;
      }
    },
    async quickCheckOut() {
      if (!this.quick.employee_id) return;
      this.loading = true;
      this.flash = "";
      try {
        await this.api().post("/hr/attendances/checkout", {
          employee_id: this.toIntOrNull(this.quick.employee_id),
        });
        this.flash = "Check-out recorded.";
        this.flashType = "ok";
        this.reload(1);
      } catch (e) {
        this.flash = e?.response?.data?.message || "Failed to check out.";
        this.flashType = "error";
      } finally {
        this.loading = false;
      }
    },

    /* ================= Utils ================= */
    isNum(v) {
      return typeof v === "number" && Number.isFinite(v);
    },
    hhmm(mins) {
      const m = Math.max(0, Math.round(mins || 0));
      const hh = Math.floor(m / 60);
      const mm = m % 60;
      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    },
    formatDateTime(iso) {
      const d = new Date(iso);
      if (isNaN(d)) return iso || "-";
      return new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    },
    toLocalInput(iso) {
      const d = new Date(iso);
      if (isNaN(d)) return "";
      const pad = (n) => String(n).padStart(2, "0");
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mi = pad(d.getMinutes());
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    },
  },
};
</script>
