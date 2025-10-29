<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">sales</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">
          Quotation Logs
          <span v-if="header.number" class="text-gray-400 text-base">— {{ header.number }}</span>
        </h1>
      </div>
      <div class="flex gap-2">
        <button @click="$router.push({ name: 'Quotations' })" class="border rounded px-4 py-2 dark:border-gray-700">
          ← Back to Quotations
        </button>
      </div>
    </div>

    <!-- Add Log -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md p-4">
      <h3 class="font-semibold mb-3">Add Log</h3>
      <div class="grid md:grid-cols-3 gap-3">
        <div>
          <label class="block text-sm mb-1 dark:text-gray-300">Status</label>
          <select v-model="form.status" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
            <option value="draft">draft</option>
            <option value="sent">sent</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="expired">expired</option>
            <option value="confirmed">confirmed</option>
          </select>
          <p class="text-xs text-gray-500 mt-1">
            Backend akan memetakan status ke sistem (approved/confirmed → won, rejected → lost).
          </p>
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm mb-1 dark:text-gray-300">Note</label>
          <input v-model="form.note" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="optional" />
        </div>
      </div>
      <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>
      <div class="mt-3 flex justify-end">
        <button @click="addLog()" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
          {{ saving ? 'Saving…' : 'Add Log' }}
        </button>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
        {{ rows.length }} log(s)
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3 w-24">#ID</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3">Note</th>
              <th class="px-6 py-3">By</th>
              <th class="px-6 py-3">Created At</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in displayRows" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3 font-mono text-xs">#{{ r.id }}</td>
              <td class="px-6 py-3"><span :class="badge(r.status)">{{ r.status }}</span></td>
              <td class="px-6 py-3">{{ r.note || '-' }}</td>
              <td class="px-6 py-3">{{ r.by }}</td>
              <td class="px-6 py-3">{{ r.when }}</td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="5" class="px-6 py-6 text-center text-gray-400">No logs found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "QuotationLogs",
  data() {
    return {
      qid: Number(this.$route.params.id),
      header: { number: "" },
      rows: [],          // raw rows from API
      form: { status: "draft", note: "" },
      loading: false,
      saving: false,
      error: "",
    };
  },
  computed: {
    // Normalisasi baris untuk tampilan
    displayRows() {
      return this.rows.map((r) => {
        const status = r.status || r.to_status || r.new_status || "-";
        // backend kirim user_name + changed_at
        const when = r.changed_at || r.created_at || r.updated_at || "";
        return {
          ...r,
          status,
          note: r.note ?? r.reason ?? null,
          by: r.user_name || r.user?.name || r.by || "-",
          when,
        };
      });
    },
  },
  mounted() {
    this.fetchHeader();
    this.reload();
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

    badge(st) {
      const base = "px-2 py-1 text-xs rounded capitalize";
      const map = {
        draft: "bg-gray-100 text-gray-700",
        sent: "bg-blue-100 text-blue-700",
        approved: "bg-green-100 text-green-700",
        rejected: "bg-red-100 text-red-700",
        expired: "bg-orange-100 text-orange-700",
        confirmed: "bg-purple-100 text-purple-700",
        won: "bg-green-100 text-green-700",
        lost: "bg-red-100 text-red-700",
      };
      return `${base} ${map[st] || "bg-gray-100 text-gray-700"}`;
    },

    async fetchHeader() {
      try {
        const { data } = await this.api().get(`/quotations/${this.qid}`);
        this.header.number =
          data?.quotation?.number || data?.number || `#${this.qid}`;

        // jika show() sudah mengembalikan logs, boleh diisi awal
        const logs = data?.logs || data?.quotation?.logs || data?.logs?.data || [];
        if (Array.isArray(logs) && logs.length) this.rows = logs;
      } catch {
        this.header.number = `#${this.qid}`;
      }
    },

    async reload() {
      this.loading = true;
      this.error = "";
      try {
        // Endpoint khusus log (disarankan)
        const { data } = await this.api().get(`/quotation-logs`, {
          params: { quotation_id: this.qid },
        });
        const rows = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        this.rows = rows;
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal memuat logs";
      } finally {
        this.loading = false;
      }
    },

    async addLog() {
      this.saving = true;
      this.error = "";
      try {
        // FE cukup kirim ke endpoint log — backend yang urus mapping status
        await this.api().post(`/quotation-logs`, {
          quotation_id: this.qid,
          status: this.form.status,
          note: this.form.note || null,
        });
        this.form.note = "";
        await this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || e?.message || "Gagal menambah log";
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>
