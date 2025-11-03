<template>
  <div class="p-4">
    <!-- Heading -->
    <h2 class="my-6 text-2xl font-semibold text-gray-700 dark:text-gray-200">
      My Attendance
    </h2>

    <!-- Card: Today -->
    <div class="px-4 py-4 mb-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <h4 class="text-lg font-semibold text-gray-600 dark:text-gray-300">
          Today's Attendance ({{ todayLabel }})
        </h4>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Local time: {{ nowTime }}
        </div>
      </div>

      <!-- Alerts -->
      <div v-if="flash.success" class="p-4 mt-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
        {{ flash.success }}
      </div>
      <div v-if="flash.error" class="p-4 mt-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
        {{ flash.error }}
      </div>

      <!-- Logic Check-in / Check-out -->
      <div class="mt-2">
        <template v-if="!today || !today.check_in">
          <!-- Belum Check-in -->
          <button
            @click="checkIn"
            :disabled="savingToday"
            class="px-5 py-3 font-medium leading-5 text-white transition-colors duration-150 bg-green-600 border border-transparent rounded-lg active:bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {{ savingToday ? 'Processing…' : 'Check In Now' }}
          </button>
        </template>

        <template v-else-if="today.check_in && !today.check_out">
          <!-- Sudah Check-in, belum Check-out -->
          <p class="mb-4">
            You checked in at: <span class="font-semibold">{{ formatTime(today.check_in) }}</span>
          </p>
          <button
            @click="checkOut"
            :disabled="savingToday"
            class="px-5 py-3 font-medium leading-5 text-white transition-colors duration-150 bg-red-600 border border-transparent rounded-lg active:bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {{ savingToday ? 'Processing…' : 'Check Out Now' }}
          </button>
        </template>

        <template v-else>
          <!-- Lengkap -->
          <p class="mb-1">Attendance for today is complete.</p>
          <p>
            Check In: <span class="font-semibold">{{ formatTime(today.check_in) }}</span>
            |
            Check Out: <span class="font-semibold">{{ formatTime(today.check_out) }}</span>
          </p>
        </template>
      </div>
    </div>

    <!-- Filters Riwayat -->
    <div class="px-4 py-4 mb-4 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div class="flex flex-col sm:flex-row gap-3 flex-1">
          <div class="w-full sm:w-56">
            <label class="block text-sm dark:text-gray-300 mb-1">Month</label>
            <input
              type="month"
              v-model="q.month"
              @change="reloadHistory"
              class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>

          <div class="w-full sm:flex-1">
            <label class="block text-sm dark:text-gray-300 mb-1">Search</label>
            <input
              v-model="q.search"
              @input="debouncedSearch()"
              @keyup.enter="reloadHistory"
              placeholder="Search date (YYYY-MM-DD) or note…"
              class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>

          <div class="w-full sm:w-40">
            <label class="block text-sm dark:text-gray-300 mb-1">Per page</label>
            <select
              v-model.number="q.perPage"
              @change="reloadHistory"
              class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
            >
              <option v-for="n in [10,20,50]" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>

        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ page.from || 0 }}–{{ page.to || 0 }} of {{ page.total || 0 }}
        </div>
      </div>
    </div>

    <!-- Tabel Riwayat -->
    <div class="overflow-x-auto bg-white rounded-lg shadow-md dark:bg-gray-800">
      <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
        <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th class="px-6 py-3">Date</th>
            <th class="px-6 py-3">Check In</th>
            <th class="px-6 py-3">Check Out</th>
            <th class="px-6 py-3">Duration</th>
            <th class="px-6 py-3">Note</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in rows"
            :key="r.id || r.date+'-'+(r.check_in||'')"
            class="bg-white dark:bg-gray-800 border-b dark:border-gray-700"
          >
            <td class="px-6 py-3">
              <div class="font-medium">{{ formatDate(r.date) }}</div>
              <div class="text-xs text-gray-500">{{ formatWeekday(r.date) }}</div>
            </td>
            <td class="px-6 py-3">{{ r.check_in ? formatTime(r.check_in) : '-' }}</td>
            <td class="px-6 py-3">{{ r.check_out ? formatTime(r.check_out) : '-' }}</td>
            <td class="px-6 py-3">{{ computeDuration(r.check_in, r.check_out) }}</td>
            <td class="px-6 py-3">{{ r.note || '-' }}</td>
          </tr>

          <tr v-if="!loadingHistory && !rows.length">
            <td colspan="5" class="px-6 py-6 text-center text-gray-400">No data</td>
          </tr>
        </tbody>
      </table>

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

    <!-- Toast fallback -->
    <div v-if="error" class="fixed bottom-4 right-4 bg-red-600 text-white text-sm px-4 py-3 rounded shadow">
      {{ error }}
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "MyAttendance",

  data() {
    const todayISO = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const monthISO = todayISO.slice(0, 7); // YYYY-MM
    return {
      // Today
      today: null,        // {check_in, check_out} | null
      savingToday: false,
      flash: { success: "", error: "" },

      // History
      loadingHistory: false,
      rows: [],
      q: { page: 1, perPage: 10, month: monthISO, search: "" },
      page: { current: 1, last: 1, total: 0, from: 0, to: 0, prev: false, next: false },

      // UI
      nowTime: "",
      error: "",
      _searchTimer: null,
      _clockTimer: null,
    };
  },

  computed: {
    todayLabel() {
      const d = new Date();
      try {
        return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(d);
      } catch {
        return new Date().toISOString().slice(0, 10);
      }
    },
  },

  mounted() {
    this.tickClock();
    this._clockTimer = setInterval(this.tickClock, 1000);

    this.loadToday();
    this.reloadHistory();
  },

  beforeUnmount() {
    clearInterval(this._clockTimer);
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
        baseURL: `${API_BASE}/api`,
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

    /* ====================== Today ====================== */
    async loadToday() {
      try {
        const { data } = await this.api().get("/my-attendance/today");
        this.today = data && (data.check_in || data.check_out) ? data : (data || null);
      } catch (e) {
        this.today = null;
      }
    },

    async checkIn() {
      this.savingToday = true; this.flash = { success: "", error: "" }; this.error = "";
      try {
        await this.api().post("/my-attendance/checkin");
        this.flash.success = "Check-in recorded.";
        await this.loadToday();
        await this.reloadHistory();
      } catch (e) {
        this.flash.error = e?.response?.data?.message || "Failed to check in.";
      } finally {
        this.savingToday = false;
      }
    },

    async checkOut() {
      this.savingToday = true; this.flash = { success: "", error: "" }; this.error = "";
      try {
        await this.api().post("/my-attendance/checkout");
        this.flash.success = "Check-out recorded.";
        await this.loadToday();
        await this.reloadHistory();
      } catch (e) {
        this.flash.error = e?.response?.data?.message || "Failed to check out.";
      } finally {
        this.savingToday = false;
      }
    },

    /* ====================== History ====================== */
    cleanParams(raw) {
      const p = { ...raw };
      if (!String(p.search || "").trim()) delete p.search;
      if (!String(p.month || "").trim()) delete p.month;
      return p;
    },

    async reloadHistory() {
      this.loadingHistory = true;
      this.error = "";
      try {
        const params = this.cleanParams({
          page: this.q.page,
          per_page: this.q.perPage,
          month: this.q.month,       // YYYY-MM
          search: this.q.search,     // bebas (mis. note atau yyyy-mm-dd)
        });

        const { data } = await this.api().get("/my-attendance", { params });

        const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        // Normalize expected fields
        this.rows = rows.map((r) => ({
          id: r.id,
          date: r.date || r.check_in?.slice(0, 10) || r.check_out?.slice(0, 10),
          check_in: r.check_in || null,
          check_out: r.check_out || null,
          note: r.note || r.description || null,
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
        this.loadingHistory = false;
      }
    },

    go(p) {
      this.q.page = Math.max(1, p);
      this.reloadHistory();
    },

    debouncedSearch() {
      clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => this.reloadHistory(), 350);
    },

    /* ====================== Utils ====================== */
    tickClock() {
      try {
        this.nowTime = new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date());
      } catch {
        const d = new Date();
        this.nowTime = [d.getHours(), d.getMinutes(), d.getSeconds()].map(v => String(v).padStart(2, "0")).join(":");
      }
    },

    formatDate(iso) {
      const d = new Date(iso);
      if (isNaN(d)) return iso || "-";
      return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(d);
    },
    formatWeekday(iso) {
      const d = new Date(iso);
      if (isNaN(d)) return "-";
      return new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(d);
    },
    formatTime(iso) {
      const d = new Date(iso);
      if (isNaN(d)) return "-";
      return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(d);
    },
    computeDuration(inISO, outISO) {
      if (!inISO || !outISO) return "-";
      const a = new Date(inISO).getTime();
      const b = new Date(outISO).getTime();
      if (isNaN(a) || isNaN(b) || b <= a) return "-";
      const mins = Math.round((b - a) / 60000);
      const hh = Math.floor(mins / 60);
      const mm = mins % 60;
      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    },
  },
};
</script>
