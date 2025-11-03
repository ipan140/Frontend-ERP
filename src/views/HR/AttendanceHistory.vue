<template>
  <div class="container mx-auto grid p-4">
    <!-- Title -->
    <h2 class="my-6 text-2xl font-semibold text-gray-700 dark:text-gray-200">
      Employee Attendance History
    </h2>

    <!-- Filter & Actions -->
    <div class="px-4 py-4 mb-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div class="flex flex-col sm:flex-row items-end justify-between gap-4">
        <!-- Combo: Employee -->
        <div class="relative flex-1 w-full" @keydown.esc="combo.open=false">
          <button
            type="button"
            @click="combo.open = !combo.open"
            class="flex items-center justify-between w-full px-3 py-2.5 text-sm text-left bg-white border border-gray-300 rounded-lg dark:text-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <span>{{ selectedEmployee?.name || '-- Choose Employee --' }}</span>
            <svg class="w-4 h-4 ml-2 transition-transform duration-200" :class="{'rotate-180': combo.open}" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clip-rule="evenodd"/>
            </svg>
          </button>

          <div
            v-show="combo.open"
            @click.outside="combo.open=false"
            class="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-700 dark:border-gray-600 max-h-72 overflow-y-auto"
          >
            <div class="p-2 border-b border-gray-200 dark:border-gray-600">
              <input
                v-model="combo.search"
                @input="filterEmployees"
                placeholder="Search for employee..."
                class="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-600 focus:outline-none dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
            <ul class="py-1">
              <li
                v-for="e in filteredEmployees"
                :key="e.id"
                @click="selectEmployee(e)"
                class="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between"
                :class="{'bg-blue-100 dark:bg-blue-900': selectedEmployee?.id === e.id}"
              >
                <span class="truncate">{{ e.name }}</span>
                <span v-if="selectedEmployee?.id === e.id" class="text-xs text-blue-700 dark:text-blue-300">selected</span>
              </li>
              <li v-if="!filteredEmployees.length" class="px-3 py-2 text-sm text-gray-500">No employees found.</li>
            </ul>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-end space-x-2 w-full sm:w-auto">
          <button
            type="button"
            @click="reload"
            class="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            :disabled="!selectedEmployee"
          >
            View History
          </button>
          <router-link
            to="/attendances/create"
            class="px-5 py-2.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Add Manual
          </router-link>
        </div>
      </div>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Profile Card -->
      <div v-if="selectedEmployee" class="lg:col-span-3">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
          <div class="p-6">
            <div class="flex items-center space-x-5">
              <div class="relative flex-shrink-0">
                <img
                  v-if="profile.photo"
                  :src="profile.photo"
                  :alt="selectedEmployee.name"
                  class="w-20 h-20 rounded-full object-cover"
                />
                <div v-else class="relative w-20 h-20 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
                  <svg class="absolute w-24 h-24 text-gray-400 -left-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <p class="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">{{ selectedEmployee.name }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ profile.position || '—' }}</p>
              </div>
            </div>

            <hr class="my-5 border-gray-200 dark:border-gray-700">

            <div class="space-y-4">
              <div>
                <h4 class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">Employment Details</h4>
                <dl class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <div class="flex justify-between">
                    <dt class="font-medium text-gray-600 dark:text-gray-400">Employee ID</dt>
                    <dd>{{ profile.nik || 'N/A' }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="font-medium text-gray-600 dark:text-gray-400">Joining Date</dt>
                    <dd>{{ formatDate(profile.hire_date) }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="font-medium text-gray-600 dark:text-gray-400">Department</dt>
                    <dd>{{ profile.department || 'N/A' }}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">Contact</h4>
                <dl class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <div class="flex items-center">
                    <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a :href="profile.email ? 'mailto:'+profile.email : '#'" class="hover:underline">
                      {{ profile.email || 'N/A' }}
                    </a>
                  </div>
                  <div class="flex items-center">
                    <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{{ profile.phone || 'N/A' }}</span>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex gap-3">
            <router-link
              :to="profileLink"
              class="flex-1 text-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
            >
              View Profile
            </router-link>
            <router-link
              :to="editLink"
              class="flex-1 text-center px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:text-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-150"
            >
              Edit
            </router-link>
          </div>
        </div>
      </div>

      <!-- Attendance Table -->
      <div :class="selectedEmployee ? 'lg:col-span-9' : 'col-span-full'">
        <div class="bg-white rounded-lg shadow-md dark:bg-gray-800">
          <!-- Top filters for table -->
          <div class="px-4 py-3 border-b dark:border-gray-700 grid sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-sm dark:text-gray-300 mb-1">Year</label>
              <select v-model="q.year" @change="reload" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
                <option value="">All</option>
                <option v-for="y in years" :key="y" :value="String(y)">{{ y }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm dark:text-gray-300 mb-1">Month</label>
              <select v-model="q.month" @change="reload" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
                <option value="">All</option>
                <option v-for="(m,idx) in months" :key="idx" :value="String(idx+1).padStart(2,'0')">{{ m }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm dark:text-gray-300 mb-1">Per page</label>
              <select v-model.number="q.perPage" @change="reload" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
                <option v-for="n in [10,20,50]" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
              <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th class="px-6 py-3">Date</th>
                  <th class="px-6 py-3">Check In</th>
                  <th class="px-6 py-3">Check Out</th>
                  <th class="px-6 py-3">Duration</th>
                  <th class="px-6 py-3">Note</th>
                  <th class="px-6 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="r in rows" :key="r._key">
                  <tr class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                    <td class="px-6 py-3">
                      <div class="font-medium">{{ formatDate(r.date) }}</div>
                      <div class="text-xs text-gray-500">{{ formatWeekday(r.date) }}</div>
                    </td>
                    <td class="px-6 py-3">{{ r.check_in ? formatTime(r.check_in) : '-' }}</td>
                    <td class="px-6 py-3">{{ r.check_out ? formatTime(r.check_out) : '-' }}</td>
                    <td class="px-6 py-3">{{ computeDuration(r.check_in, r.check_out) }}</td>
                    <td class="px-6 py-3">{{ r.note || '-' }}</td>
                    <td class="px-6 py-3 text-right">
                      <button
                        class="details-toggle px-2 py-1 rounded border dark:border-gray-600"
                        @click="toggleDetails(r)"
                        :aria-expanded="r._open ? 'true' : 'false'"
                      >
                        <span v-show="!r._open" class="expand-icon">Show</span>
                        <span v-show="r._open" class="collapse-icon">Hide</span>
                      </button>
                    </td>
                  </tr>

                  <!-- Details row -->
                  <tr v-show="r._open" class="bg-gray-50/60 dark:bg-gray-900/40 border-b dark:border-gray-800">
                    <td colspan="6" class="px-6 py-4">
                      <div v-if="r.details && r.details.length" class="space-y-2">
                        <div
                          v-for="(d, i) in r.details"
                          :key="i"
                          class="flex items-center justify-between text-xs md:text-sm"
                        >
                          <div class="flex items-center gap-2">
                            <span class="inline-flex px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                              {{ (d.type || 'log').toUpperCase() }}
                            </span>
                            <span>{{ d.note || '-' }}</span>
                          </div>
                          <div class="font-mono">{{ d.time ? formatTime(d.time) : '-' }}</div>
                        </div>
                      </div>
                      <div v-else class="text-sm text-gray-500">No extra details.</div>
                    </td>
                  </tr>
                </template>

                <tr v-if="!loading && !rows.length">
                  <td colspan="6" class="px-6 py-6 text-center text-gray-400">Please select an employee to view their attendance history.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="px-5 py-4 flex items-center justify-between">
            <button
              :disabled="!page.prev"
              @click="go(page.current - 1)"
              class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40"
            >
              Prev
            </button>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Page {{ page.current || 1 }} / {{ page.last || 1 }}
            </div>
            <button
              :disabled="!page.next"
              @click="go(page.current + 1)"
              class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

        <div v-if="error" class="mt-4 bg-red-600 text-white text-sm px-4 py-3 rounded shadow">
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "AttendanceHistory",

  data() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return {
      // Combo
      employees: [],       // [{id, name, email, ...}]
      filteredEmployees: [],
      combo: { open: false, search: "" },

      // Selected
      selectedEmployee: null,  // {id, name}
      profile: {
        photo: null,
        position: null,
        nik: null,
        hire_date: null,
        department: null,
        email: null,
        phone: null,
      },

      // Filters for table
      q: { page: 1, perPage: 10, year: String(y), month: m },

      // Table state
      loading: false,
      rows: [],
      page: { current: 1, last: 1, total: 0, from: 0, to: 0, prev: false, next: false },

      // UI
      error: "",
      years: Array.from({ length: 11 }, (_, i) => y - i), // y..y-10
      months: [
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
      ],
    };
  },

  computed: {
    profileLink() {
      return this.selectedEmployee ? `/employees/${this.selectedEmployee.id}` : "#";
    },
    editLink() {
      return this.selectedEmployee ? `/employees/${this.selectedEmployee.id}/edit` : "#";
    },
  },

  mounted() {
    this.loadEmployees();
  },

  methods: {
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
        baseURL: `${API_BASE}/api/hr`,   // <<<<<< DISINI
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

    /* ===== Employees Combo ===== */
    async loadEmployees() {
      try {
        // NB: endpoint employees ada di /api/hr/employees (sesuai grup hr)
        const { data } = await this.api().get("/employees", { params: { per_page: 1000 } });
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.employees = list.map((e) => ({
          id: e.id,
          name: e.full_name || e.name || e.employee_name || `Emp #${e.id}`,
          email: e.user?.email || e.email || null,
          photo: e.photo ? this.fileUrl(e.photo) : null,
          position: e.position?.name || e.position_name || null,
          department: e.department?.name || e.department_name || null,
          nik: e.nik || e.code || e.employee_code || null,
          hire_date: e.hire_date || e.join_date || null,
          phone: e.phone_number || e.phone || null,
        }));
        this.filteredEmployees = this.employees;
      } catch (e) {
        this.employees = [];
        this.filteredEmployees = [];
      }
    },
    filterEmployees() {
      const q = (this.combo.search || "").toLowerCase();
      if (!q) {
        this.filteredEmployees = this.employees;
        return;
      }
      this.filteredEmployees = this.employees.filter((e) =>
        (e.name || "").toLowerCase().includes(q)
        || (e.email || "").toLowerCase().includes(q)
      );
    },
    selectEmployee(e) {
      this.selectedEmployee = { id: e.id, name: e.name };
      // isi profile ringkas
      this.profile = {
        photo: e.photo || null,
        position: e.position || null,
        nik: e.nik || null,
        hire_date: e.hire_date || null,
        department: e.department || null,
        email: e.email || null,
        phone: e.phone || null,
      };
      this.combo.open = false;
      this.q.page = 1;
      this.reload();
    },
    fileUrl(path) {
      if (!path) return null;
      const base = this.resolveBaseUrl().replace(/\/api$/, "");
      return `${base}/storage/${String(path).replace(/^storage\//, "")}`;
    },

    /* ===== Attendance Table ===== */
    async reload() {
      if (!this.selectedEmployee) return;
      this.loading = true;
      this.error = "";
      try {
        const params = {
          employee_id: this.selectedEmployee.id,
          page: this.q.page,
          per_page: this.q.perPage,
        };
        if (this.q.year)  params.year  = this.q.year;
        if (this.q.month) params.month = this.q.month;

        const { data } = await this.api().get("/attendances", { params });

        const arr = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.rows = arr.map((r, i) => ({
          _key: r.id || `${r.date}-${i}`,
          _open: false,
          id: r.id,
          date: r.date || r.check_in?.slice(0,10) || r.check_out?.slice(0,10),
          check_in: r.check_in || null,
          check_out: r.check_out || null,
          note: r.note || r.description || null,
          details: Array.isArray(r.details) ? r.details : [],
        }));

        this.page = {
          current: Number(data.current_page || 1),
          last: Number(data.last_page || 1),
          total: Number(data.total || this.rows.length),
          from: Number(data.from || (this.rows.length ? 1 : 0)),
          to: Number(data.to || this.rows.length),
          prev: Number(data.current_page || 1) > 1,
          next: Number(data.current_page || 1) < Number(data.last_page || 1),
        };
      } catch (e) {
        this.error = e?.response?.data?.message || "Failed to load attendance history.";
      } finally {
        this.loading = false;
      }
    },
    go(p) {
      this.q.page = Math.max(1, p);
      this.reload();
    },
    toggleDetails(row) {
      row._open = !row._open;
    },

    /* ===== Utils ===== */
    formatDate(iso) {
      if (!iso) return "—";
      const d = new Date(iso);
      if (isNaN(d)) return iso;
      return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(d);
    },
    formatWeekday(iso) {
      const d = new Date(iso);
      if (isNaN(d)) return "—";
      return new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(d);
    },
    formatTime(iso) {
      if (!iso) return "—";
      const d = new Date(iso);
      if (isNaN(d)) return "—";
      return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(d);
    },
    computeDuration(inISO, outISO) {
      if (!inISO || !outISO) return "—";
      const a = new Date(inISO).getTime();
      const b = new Date(outISO).getTime();
      if (isNaN(a) || isNaN(b) || b <= a) return "—";
      const mins = Math.round((b - a) / 60000);
      const hh = Math.floor(mins / 60);
      const mm = mins % 60;
      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    },
  },
};
</script>
