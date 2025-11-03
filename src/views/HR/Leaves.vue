<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">hr</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Leaves</h1>
      </div>

      <div class="flex gap-2 w-full lg:w-auto">
        <input
          v-model="q.search"
          @keyup.enter="reload"
          class="flex-1 lg:flex-none border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search by reason…"
        />
        <button @click="reload" class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5">
          Search
        </button>
        <button
          @click="openCreate"
          class="inline-flex items-center justify-center gap-2 bg-primary text-white rounded py-2.5 px-5 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[.98] transition"
          title="Add new leave"
        >
          <Icon icon="ic:round-add" class="text-xl" />
          <span class="font-medium">New Leave</span>
        </button>
      </div>
    </div>

    <!-- Card -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <!-- Filters -->
      <div class="px-5 py-4 grid gap-3 md:grid-cols-5">
        <div>
          <label class="block text-sm dark:text-gray-300 mb-1">Employee</label>
          <select v-model="q.employee_id" @change="reload" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
            <option value="">All Employees</option>
            <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm dark:text-gray-300 mb-1">Leave type</label>
          <select v-model="q.leave_type_id" @change="reload" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
            <option value="">All Types</option>
            <option v-for="t in leaveTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm dark:text-gray-300 mb-1">Status</label>
          <select v-model="q.status" @change="reload" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label class="block text-sm dark:text-gray-300 mb-1">From</label>
          <input type="date" v-model="q.date_from" @change="reload" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
        </div>
        <div>
          <label class="block text-sm dark:text-gray-300 mb-1">To</label>
          <input type="date" v-model="q.date_to" @change="reload" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
        </div>
      </div>

      <!-- Summary / per page -->
      <div class="px-5 -mt-2 pb-2 flex items-center justify-between">
        <div class="w-40">
          <label class="block text-sm dark:text-gray-300 mb-1">Per page</label>
          <select v-model.number="q.perPage" @change="reload" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
            <option v-for="n in [10,20,50]" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ page.from || 0 }}–{{ page.to || 0 }} of {{ page.total || 0 }}
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">Employee</th>
              <th class="px-6 py-3">Type</th>
              <th class="px-6 py-3">Start</th>
              <th class="px-6 py-3">End</th>
              <th class="px-6 py-3">Days</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3">Reason</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3">{{ r.employee?.full_name || r.employee?.name || r.employee_name || '-' }}</td>
              <td class="px-6 py-3">{{ r.leave_type?.name || r.leave_type_name || '-' }}</td>
              <td class="px-6 py-3">{{ r.date_start }}</td>
              <td class="px-6 py-3">{{ r.date_end }}</td>
              <td class="px-6 py-3">{{ r.days }}</td>
              <td class="px-6 py-3">
                <span v-if="r.status==='approved'" class="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Approved</span>
                <span v-else-if="r.status==='rejected'" class="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Rejected</span>
                <span v-else class="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">Pending</span>
              </td>
              <td class="px-6 py-3 truncate max-w-[360px]" :title="r.reason">{{ r.reason || '-' }}</td>
              <td class="px-6 py-3 text-right space-x-2">
                <button @click="openView(r)" class="px-2 py-1 rounded border dark:border-gray-600" title="View">View</button>
                <button @click="openEdit(r)" class="px-2 py-1 rounded border dark:border-gray-600" title="Edit" :disabled="r.status==='approved'">Edit</button>
                <button @click="confirmDelete(r)" class="px-2 py-1 rounded border dark:border-gray-600" :disabled="saving">Delete</button>
                <button v-if="r.status!=='approved'" @click="approve(r)" class="px-2 py-1 rounded bg-primary text-white hover:bg-primary/80">Approve</button>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="8" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-5 py-4 flex items-center justify-between">
        <button :disabled="!page.prev" @click="go(page.current - 1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">Prev</button>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ page.current || 1 }} / {{ page.last || 1 }}
        </div>
        <button :disabled="!page.next" @click="go(page.current + 1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">Next</button>
      </div>
    </div>

    <!-- Modal: Create/Edit -->
    <div v-if="modal.open && modal.mode !== 'view'" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-3xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">
          {{ modal.mode === 'create' ? 'New Leave' : 'Edit Leave' }}
        </h3>

        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Employee<span class="text-red-500">*</span></label>
            <select v-model="form.employee_id" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option value="">Select…</option>
              <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
            </select>
            <p v-if="fieldErrors.employee_id" class="text-xs text-red-500 mt-1">{{ fieldErrors.employee_id[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Leave type<span class="text-red-500">*</span></label>
            <select v-model="form.leave_type_id" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option value="">Select…</option>
              <option v-for="t in leaveTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
            <p v-if="fieldErrors.leave_type_id" class="text-xs text-red-500 mt-1">{{ fieldErrors.leave_type_id[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Date start<span class="text-red-500">*</span></label>
            <input type="date" v-model="form.date_start" @change="recalcDays" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.date_start" class="text-xs text-red-500 mt-1">{{ fieldErrors.date_start[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Date end<span class="text-red-500">*</span></label>
            <input type="date" v-model="form.date_end" @change="recalcDays" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.date_end" class="text-xs text-red-500 mt-1">{{ fieldErrors.date_end[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Days</label>
            <input type="number" min="1" v-model.number="form.days" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Reason</label>
            <input v-model="form.reason" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Attachment (optional)</label>
            <input type="file" @change="onFile" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200 file:mr-3" />
            <p class="text-xs text-gray-500 mt-1" v-if="form.attachment_path && !file">Current: {{ basename(form.attachment_path) }}</p>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open = false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="save" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: View -->
    <div v-if="modal.open && modal.mode === 'view'" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Leave Detail</h3>
        <div class="grid md:grid-cols-2 gap-3 text-sm">
          <p><span class="text-gray-500">Employee:</span> {{ findName(employees, form.employee_id) || '-' }}</p>
          <p><span class="text-gray-500">Type:</span> {{ findName(leaveTypes, form.leave_type_id) || '-' }}</p>
          <p><span class="text-gray-500">Date start:</span> {{ form.date_start || '-' }}</p>
          <p><span class="text-gray-500">Date end:</span> {{ form.date_end || '-' }}</p>
          <p><span class="text-gray-500">Days:</span> {{ form.days || '-' }}</p>
          <p><span class="text-gray-500">Status:</span> {{ form.status || 'pending' }}</p>
          <p class="md:col-span-2"><span class="text-gray-500">Reason:</span> {{ form.reason || '-' }}</p>
          <p class="md:col-span-2" v-if="form.attachment_path">
            <span class="text-gray-500">Attachment:</span> {{ basename(form.attachment_path) }}
          </p>
          <p><span class="text-gray-500">Approved by:</span> {{ form.approver_name || '-' }}</p>
          <p><span class="text-gray-500">Approved at:</span> {{ form.approved_at || '-' }}</p>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open = false" class="px-4 py-2 rounded border dark:border-gray-600">Close</button>
        </div>
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
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { Icon } from "@iconify/vue";

export default {
  name: "Leaves",
  components: { Icon },
  data() {
    return {
      loading: false,
      rows: [],
      q: { page: 1, perPage: 10, search: "", employee_id: "", leave_type_id: "", status: "", date_from: "", date_to: "" },
      page: { current: 1, last: 1, total: 0, from: 0, to: 0, prev: false, next: false },

      employees: [],
      leaveTypes: [],

      modal: { open: false, mode: "create" },
      form: {
        id: null,
        employee_id: "",
        leave_type_id: "",
        date_start: "",
        date_end: "",
        days: 1,
        reason: "",
        attachment_path: "",
        status: "pending",
        approver_id: null,
        approver_name: null,
        approved_at: null,
      },

      file: null, // attachment (optional)
      saving: false,
      error: "",
      fieldErrors: {},
    };
  },

  mounted() {
    Promise.all([this.loadEmployees(), this.loadLeaveTypes()]).then(() => this.reload());
  },

  methods: {
    // --- utils ---
    basename(p) {
      if (!p) return "";
      try { return String(p).split("/").pop(); } catch { return p; }
    },
    findName(arr, id) {
      const f = arr.find(x => String(x.id) === String(id));
      return f?.name || "";
    },
    toast(icon, title) {
      const T = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 1500, timerProgressBar: true });
      T.fire({ icon, title });
    },
    resolveBaseUrl() {
      const raw = import.meta?.env?.VITE_API_BASE || "http://localhost:8000";
      return String(raw).trim().replace(/\/+$/, "");
    },
    api() {
      const token = localStorage.getItem("token");
      const API_BASE = this.resolveBaseUrl();
      const instance = axios.create({
        baseURL: `${API_BASE}/api/hr`,
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

    // --- masters ---
    async loadEmployees() {
      try {
        const { data } = await this.api().get("/employees", { params: { per_page: 1000, status: "active" } });
        const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.employees = rows.map(e => ({
          id: e.id,
          name: e.full_name || [e.first_name, e.last_name].filter(Boolean).join(" ") || e.name || `Emp#${e.id}`,
        }));
      } catch { this.employees = []; }
    },
    async loadLeaveTypes() {
      try {
        const { data } = await this.api().get("/leave-types", { params: { per_page: 1000 } });
        this.leaveTypes = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      } catch { this.leaveTypes = []; }
    },

    // --- list ---
    cleanParams(raw) {
      const p = { ...raw };
      for (const k of ["search","employee_id","leave_type_id","status","date_from","date_to"]) {
        if (!String(p[k] || "").trim()) delete p[k];
      }
      return p;
    },
    async reload() {
      this.loading = true; this.error = ""; this.fieldErrors = {};
      try {
        const params = this.cleanParams({
          page: this.q.page, per_page: this.q.perPage,
          search: this.q.search,
          employee_id: this.q.employee_id,
          leave_type_id: this.q.leave_type_id,
          status: this.q.status,
          date_from: this.q.date_from,
          date_to: this.q.date_to,
        });
        const { data } = await this.api().get("/leaves", { params });
        const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.rows = rows;
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
        this.error = e?.response?.data?.message || "Failed to load leaves";
      } finally { this.loading = false; }
    },
    go(p) { this.q.page = Math.max(1, p); this.reload(); },

    // --- modal helpers ---
    openCreate() {
      this.modal = { open: true, mode: "create" };
      this.error = ""; this.fieldErrors = {}; this.file = null;
      this.form = {
        id: null, employee_id: "", leave_type_id: "",
        date_start: "", date_end: "", days: 1,
        reason: "", attachment_path: "", status: "pending",
        approver_id: null, approver_name: null, approved_at: null,
      };
    },
    openEdit(row) {
      this.modal = { open: true, mode: "edit" };
      this.error = ""; this.fieldErrors = {}; this.file = null;
      this.form = {
        id: row.id,
        employee_id: row.employee_id || row.employee?.id || "",
        leave_type_id: row.leave_type_id || row.leave_type?.id || "",
        date_start: row.date_start || "",
        date_end: row.date_end || "",
        days: Number(row.days || 1),
        reason: row.reason || "",
        attachment_path: row.attachment_path || "",
        status: row.status || "pending",
        approver_id: row.approver_id || null,
        approver_name: row.approver?.name || row.approver_name || null,
        approved_at: row.approved_at || null,
      };
    },
    openView(row) {
      this.modal = { open: true, mode: "view" };
      this.file = null;
      this.form = {
        id: row.id,
        employee_id: row.employee_id || row.employee?.id || "",
        leave_type_id: row.leave_type_id || row.leave_type?.id || "",
        date_start: row.date_start || "",
        date_end: row.date_end || "",
        days: Number(row.days || 1),
        reason: row.reason || "",
        attachment_path: row.attachment_path || "",
        status: row.status || "pending",
        approver_id: row.approver_id || null,
        approver_name: row.approver?.name || row.approver_name || null,
        approved_at: row.approved_at || null,
      };
    },

    // --- file & days ---
    onFile(e) { this.file = e.target.files?.[0] || null; },
    recalcDays() {
      const a = this.form.date_start, b = this.form.date_end;
      if (!a || !b) return;
      const da = new Date(a), db = new Date(b);
      const ms = db - da;
      if (isNaN(ms) || ms < 0) { this.form.days = 1; return; }
      // +1 day inclusive
      this.form.days = Math.floor(ms / (1000*60*60*24)) + 1;
    },

    // --- payload ---
    toFormData() {
      const fd = new FormData();
      fd.append("employee_id", this.form.employee_id || "");
      fd.append("leave_type_id", this.form.leave_type_id || "");
      fd.append("date_start", this.form.date_start || "");
      fd.append("date_end", this.form.date_end || "");
      fd.append("days", this.form.days ?? 1);
      if (this.form.reason) fd.append("reason", this.form.reason);
      if (this.file) fd.append("attachment", this.file); // backend: simpan ke attachment_path
      return fd;
    },

    // --- save/delete/approve ---
    async save() {
      this.saving = true; this.error = ""; this.fieldErrors = {};
      // minimal validations client-side
      if (!this.form.employee_id) { this.error = "Employee wajib dipilih."; this.saving = false; return; }
      if (!this.form.leave_type_id) { this.error = "Leave type wajib dipilih."; this.saving = false; return; }
      if (!this.form.date_start || !this.form.date_end) { this.error = "Rentang tanggal wajib diisi."; this.saving = false; return; }

      try {
        if (this.modal.mode === "create") {
          await this.api().post("/leaves", this.toFormData(), { headers: { "Content-Type": "multipart/form-data" } });
          this.toast("success", "Leave created");
        } else {
          // izinkan update tanpa mengubah attachment jika tidak ada file
          const payload = this.file ? this.toFormData() : {
            employee_id: Number(this.form.employee_id),
            leave_type_id: Number(this.form.leave_type_id),
            date_start: this.form.date_start,
            date_end: this.form.date_end,
            days: Number(this.form.days || 1),
            reason: this.form.reason || null,
            status: this.form.status || "pending",
          };
          await this.api().put(`/leaves/${this.form.id}`, payload, this.file ? { headers: { "Content-Type": "multipart/form-data" } } : {});
          this.toast("success", "Leave updated");
        }
        this.modal.open = false;
        await this.reload();
      } catch (e) {
        if (e?.response?.status === 422) {
          this.fieldErrors = e.response.data?.errors || {};
          this.error = Object.values(this.fieldErrors)[0]?.[0] || e.response.data?.message || "Validasi gagal";
          this.toast("error", this.error);
        } else {
          this.error = e?.response?.data?.message || "Gagal menyimpan leave";
          this.toast("error", this.error);
        }
      } finally { this.saving = false; }
    },

    async confirmDelete(row) {
      const res = await Swal.fire({
        title: `Hapus leave ${row.employee?.name || ''}?`,
        text: "Tindakan ini tidak dapat dibatalkan.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        focusCancel: true,
      });
      if (!res.isConfirmed) return;

      this.saving = true; this.error = "";
      try {
        await this.api().delete(`/leaves/${row.id}`);
        this.toast("success", "Deleted");
        await this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal menghapus leave";
        this.toast("error", this.error);
      } finally { this.saving = false; }
    },

    async approve(row) {
      try {
        await this.api().put(`/leaves/${row.id}/approve`);
        this.toast("success", "Approved");
        await this.reload();
      } catch (e) {
        this.toast("error", e?.response?.data?.message || "Gagal approve");
      }
    },
  },
};
</script>
