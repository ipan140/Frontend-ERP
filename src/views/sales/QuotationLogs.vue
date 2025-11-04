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
        <button
          @click="$router.push({ name: 'Quotations' })"
          class="border rounded-md px-4 py-2 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        >
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
          <select
            v-model="form.status"
            class="w-full border dark:border-gray-700 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          >
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
          <input
            v-model="form.note"
            class="w-full border dark:border-gray-700 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
            placeholder="optional"
          />
        </div>
      </div>

      <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>

      <div class="mt-3 flex justify-end">
        <button
          @click="addLog"
          :disabled="saving"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
        >
          <span v-if="!saving" class="text-xl leading-none">＋</span>
          <svg v-else class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4A4 4 0 0 0 8 12H4z"/>
          </svg>
          <span>{{ saving ? 'Saving…' : 'Add Log' }}</span>
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
              <th class="px-6 py-3 text-right w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in displayRows"
              :key="r.id"
              class="bg-white dark:bg-gray-800 border-b dark:border-gray-700"
            >
              <td class="px-6 py-3 font-mono text-xs">#{{ r.id }}</td>
              <td class="px-6 py-3"><span :class="badge(r.status)">{{ r.status }}</span></td>
              <td class="px-6 py-3">{{ r.note || '-' }}</td>
              <td class="px-6 py-3">{{ r.by }}</td>
              <td class="px-6 py-3">{{ fmtDate(r.when) }}</td>
              <td class="px-6 py-3 text-right space-x-2">
                <button
                  @click="openView(r)"
                  class="px-3 py-1.5 rounded-md border dark:border-gray-600"
                >
                  View
                </button>
                <button
                  @click="confirmDelete(r)"
                  :disabled="saving"
                  class="px-3 py-1.5 rounded-md border dark:border-gray-600"
                >
                  Delete
                </button>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="6" class="px-6 py-6 text-center text-gray-400">No logs found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- View Modal -->
    <div v-if="view.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="view.open=false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-xl p-5">
        <div class="flex items-start justify-between">
          <h3 class="text-lg font-semibold dark:text-gray-200">Log Details</h3>
          <button class="px-3 py-1 rounded-md border dark:border-gray-600" @click="view.open=false">Close</button>
        </div>

        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><div class="text-gray-500 dark:text-gray-400">ID</div><div class="font-medium">#{{ view.row.id }}</div></div>
          <div><div class="text-gray-500 dark:text-gray-400">Status</div><div class="font-medium"><span :class="badge(view.row.status)">{{ view.row.status }}</span></div></div>
          <div class="sm:col-span-2"><div class="text-gray-500 dark:text-gray-400">Note</div><div class="font-medium whitespace-pre-line">{{ view.row.note || '-' }}</div></div>
          <div><div class="text-gray-500 dark:text-gray-400">By</div><div class="font-medium">{{ view.row.by || '-' }}</div></div>
          <div><div class="text-gray-500 dark:text-gray-400">Created At</div><div class="font-medium">{{ fmtDate(view.row.when) }}</div></div>
        </div>
      </div>
    </div>

    <!-- Top loading bar -->
    <div v-if="loading" class="fixed left-0 right-0 top-0 h-1 bg-primary animate-pulse"></div>
  </div>
</template>

<script>
import axios from "axios";
import Swal from "sweetalert2";

export default {
  name: "QuotationLogs",
  data() {
    return {
      qid: Number(this.$route.params.id),
      header: { number: "" },
      rows: [],
      form: { status: "draft", note: "" },
      view: { open: false, row: {} },
      loading: false,
      saving: false,
      error: "",
    };
  },
  computed: {
    displayRows() {
      return this.rows.map((r) => {
        const status = r.status || r.to_status || r.new_status || "-";
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
    toast(icon, title) {
      const T = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1700,
        timerProgressBar: true,
      });
      T.fire({ icon, title });
    },

    fmtDate(v) {
      if (!v) return "-";
      try {
        const d = new Date(v);
        if (isNaN(d)) return String(v);
        return d.toLocaleString("id-ID", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch { return String(v); }
    },

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

      instance.interceptors.request.use((cfg) => {
        if (typeof cfg.url === "string") {
          if (cfg.url.startsWith("/quotations")) cfg.url = "/sales" + cfg.url;
          if (cfg.url.startsWith("/quotation-logs")) cfg.url = "/sales" + cfg.url;
        }
        return cfg;
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
      const base = "px-2 py-1 text-xs rounded-md capitalize";
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
        const d = data?.data || data || {};
        this.header.number = d?.quotation?.number || d?.number || `#${this.qid}`;
        const logs = d?.logs || d?.quotation?.logs || d?.logs?.data || [];
        if (Array.isArray(logs) && logs.length) this.rows = logs;
      } catch {
        this.header.number = `#${this.qid}`;
      }
    },

    async reload() {
      this.loading = true;
      this.error = "";
      try {
        const { data } = await this.api().get(`/quotation-logs`, {
          params: { quotation_id: this.qid },
        });
        this.rows = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal memuat logs";
        this.toast("error", this.error);
      } finally {
        this.loading = false;
      }
    },

    async openView(row) {
      try {
        const { data } = await this.api().get(`/quotation-logs/${row.id}`);
        const r = data?.data || data || row;
        this.view = {
          open: true,
          row: {
            id: r.id,
            status: r.status || r.to_status || r.new_status || "-",
            note: r.note ?? r.reason ?? null,
            by: r.user_name || r.user?.name || r.by || "-",
            when: r.changed_at || r.created_at || r.updated_at || "",
          },
        };
      } catch {
        this.view = { open: true, row };
      }
    },

    async confirmDelete(row) {
      const res = await Swal.fire({
        title: "Delete log?",
        text: `Hapus log #${row.id} permanen.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        buttonsStyling: false,
        customClass: {
          popup: "rounded-md",
          confirmButton: "rounded-md bg-red-500 text-white px-4 py-2 hover:bg-red-600 focus:ring-2 focus:ring-red-400",
          cancelButton: "rounded-md border border-gray-300 px-4 py-2 ml-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50",
        },
      });
      if (!res.isConfirmed) return;

      this.saving = true;
      try {
        await this.api().delete(`/quotation-logs/${row.id}`);
        this.toast("success", "Log deleted");
        await this.reload();
      } catch (e) {
        const msg = e?.response?.data?.message || "Gagal menghapus log";
        this.toast("error", msg);
      } finally {
        this.saving = false;
      }
    },

    async addLog() {
      if (this.saving) return;
      this.saving = true;
      this.error = "";
      try {
        await this.api().post(`/quotation-logs`, {
          quotation_id: this.qid,
          status: this.form.status,
          note: this.form.note || null,
        });
        this.form.note = "";
        this.toast("success", "Log added");
        await this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || e?.message || "Gagal menambah log";
        if (e?.response?.status === 422) {
          const first = Object.values(e.response.data?.errors || {})?.[0]?.[0] || e.response.data?.message;
          this.error = first || this.error;
        }
        this.toast("error", this.error);
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>
