<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">hr</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Employees</h1>
      </div>

      <div class="flex gap-2 w-full lg:w-auto">
        <input
          v-model="q.search"
          @keyup.enter="reload()"
          class="flex-1 lg:flex-none border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search by name or email…"
        />
        <button
          @click="reload()"
          class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5"
        >
          Search
        </button>
        <button
          @click="openCreate()"
          class="inline-flex items-center justify-center gap-2 bg-primary text-white rounded py-2.5 px-5 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[.98] transition"
          title="Add new employee"
        >
          <Icon icon="ic:round-add" class="text-xl" />
          <span class="font-medium">New Employee</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div class="flex flex-col sm:flex-row gap-3 flex-1">
          <!-- Department -->
          <div class="flex-1 min-w-[220px]">
            <label class="block text-sm dark:text-gray-300 mb-1">Department</label>
            <select
              v-model="q.department_id"
              @change="onDepartmentChange"
              class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">All Departments</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>

          <!-- Position (depends on department) -->
          <div class="flex-1 min-w-[220px]">
            <label class="block text-sm dark:text-gray-300 mb-1">Position</label>
            <select
              :disabled="!q.department_id || loadingPositions"
              v-model="q.position_id"
              @change="reload()"
              class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200 disabled:opacity-50"
            >
              <option value="">
                {{ !q.department_id ? 'Select Department First' : (loadingPositions ? 'Loading…' : 'All Positions') }}
              </option>
              <option v-for="p in positions" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>

          <!-- Per page -->
          <div class="w-full sm:w-40">
            <label class="block text-sm dark:text-gray-300 mb-1">Per page</label>
            <select
              v-model.number="q.perPage"
              @change="reload()"
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

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">Code</th>
              <th class="px-6 py-3">Name</th>
              <th class="px-6 py-3">Email</th>
              <th class="px-6 py-3">Department</th>
              <th class="px-6 py-3">Position</th>
              <th class="px-6 py-3">Phone</th>
              <th class="px-6 py-3">Active</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in rows"
              :key="r.id"
              class="bg-white dark:bg-gray-800 border-b dark:border-gray-700"
            >
              <td class="px-6 py-3 font-mono">{{ r.emp_no || '-' }}</td>
              <td class="px-6 py-3">{{ r.full_name || r.first_name || r.name || '-' }}</td>
              <td class="px-6 py-3">{{ r.email || '-' }}</td>
              <td class="px-6 py-3">{{ r.department?.name || '-' }}</td>
              <td class="px-6 py-3">{{ r.job_position?.name || r.jobPosition?.name || '-' }}</td>
              <td class="px-6 py-3">{{ r.phone || '-' }}</td>
              <td class="px-6 py-3">
                <span v-if="(r.status||'active')==='active'"
                      class="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Active</span>
                <span v-else
                      class="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Inactive</span>
              </td>
              <td class="px-6 py-3 text-right space-x-2">
                <button @click="openView(r)"  class="px-2 py-1 rounded border dark:border-gray-600" title="View">View</button>
                <button @click="openEdit(r)"  class="px-2 py-1 rounded border dark:border-gray-600" title="Edit">Edit</button>
                <button @click="confirmDelete(r)" class="px-2 py-1 rounded border dark:border-gray-600" :disabled="saving" title="Delete">Delete</button>
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

    <!-- Modal: Create/Edit -->
    <div v-if="modal.open && modal.mode !== 'view'" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-3xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">
          {{ modal.mode === 'create' ? 'New Employee' : 'Edit Employee' }}
        </h3>

        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Code / NIK<span class="text-red-500">*</span></label>
            <input v-model="form.code" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.emp_no || fieldErrors.code" class="text-xs text-red-500 mt-1">{{ (fieldErrors.emp_no?.[0] || fieldErrors.code?.[0]) }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Name<span class="text-red-500">*</span></label>
            <input v-model="form.name" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.first_name || fieldErrors.name" class="text-xs text-red-500 mt-1">{{ (fieldErrors.first_name?.[0] || fieldErrors.name?.[0]) }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Email<span class="text-red-500">*</span></label>
            <input v-model="form.email" type="email" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.email" class="text-xs text-red-500 mt-1">{{ fieldErrors.email[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Phone</label>
            <input v-model="form.phone" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Department<span class="text-red-500">*</span></label>
            <select v-model="form.department_id" @change="loadPositions(form.department_id, true)"
                    class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option value="">Select…</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
            <p v-if="fieldErrors.department_id" class="text-xs text-red-500 mt-1">{{ fieldErrors.department_id[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Position<span class="text-red-500">*</span></label>
            <select :disabled="!form.department_id || loadingPositions" v-model="form.position_id"
                    class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200 disabled:opacity-50">
              <option value="">{{ !form.department_id ? 'Select Department First' : (loadingPositions ? 'Loading…' : 'Select…') }}</option>
              <option v-for="p in positions" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <p v-if="fieldErrors.job_position_id || fieldErrors.position_id" class="text-xs text-red-500 mt-1">{{ (fieldErrors.job_position_id?.[0] || fieldErrors.position_id?.[0]) }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Join Date<span class="text-red-500">*</span></label>
            <input v-model="form.join_date" type="date" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.hire_date" class="text-xs text-red-500 mt-1">{{ fieldErrors.hire_date[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Salary</label>
            <input v-model.number="form.salary" type="number" min="0" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Address</label>
            <input v-model="form.address" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
          </div>

          <div class="md:col-span-2 flex items-center gap-2 mt-2">
            <input id="is_active" type="checkbox" v-model="form.is_active" class="w-4 h-4 rounded border dark:border-gray-600 dark:bg-gray-800" />
            <label for="is_active" class="text-sm dark:text-gray-300">Active</label>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open = false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="save()" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: View -->
    <div v-if="modal.open && modal.mode === 'view'" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Employee Detail</h3>
        <div class="grid md:grid-cols-2 gap-3 text-sm">
          <p><span class="text-gray-500">Code:</span> {{ form.code || '-' }}</p>
          <p><span class="text-gray-500">Name:</span> {{ form.name }}</p>
          <p class="md:col-span-2"><span class="text-gray-500">Email:</span> {{ form.email || '-' }}</p>
          <p><span class="text-gray-500">Phone:</span> {{ form.phone || '-' }}</p>
          <p><span class="text-gray-500">Department:</span> {{ getDeptName(form.department_id) || '-' }}</p>
          <p><span class="text-gray-500">Position:</span> {{ getPosName(form.position_id) || '-' }}</p>
          <p><span class="text-gray-500">Join Date:</span> {{ form.join_date || '-' }}</p>
          <p><span class="text-gray-500">Salary:</span> Rp{{ formatNumber(form.salary) }}</p>
          <p class="md:col-span-2"><span class="text-gray-500">Address:</span> {{ form.address || '-' }}</p>
          <p class="md:col-span-2">
            <span class="text-gray-500">Status:</span>
            <span v-if="form.is_active" class="ml-1 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">Active</span>
            <span v-else class="ml-1 px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">Inactive</span>
          </p>
        </div>
        <div class="mt-5 flex justify-end">
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
  name: "Employees",
  components: { Icon },

  data() {
    return {
      loading: false,
      rows: [],
      q: { page: 1, perPage: 10, search: "", department_id: "", position_id: "" },
      page: { current: 1, last: 1, total: 0, from: 0, to: 0, prev: false, next: false },

      departments: [],
      positions: [],
      loadingPositions: false,

      modal: { open: false, mode: "create" },
      form: {
        id: null,
        code: "",
        name: "",
        email: "",
        phone: "",
        department_id: "",
        position_id: "",
        join_date: "",
        salary: 0,
        address: "",
        is_active: true,
        employment_type: "permanent", // default untuk memenuhi validasi BE
      },

      saving: false,
      error: "",
      fieldErrors: {},
    };
  },

  mounted() {
    this.loadDepartments().then(() => this.reload());
  },

  methods: {
    toast(icon, title) {
      const T = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 1500, timerProgressBar: true });
      T.fire({ icon, title });
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
        baseURL: `${API_BASE}/api/hr`, // ⬅️ penting: pakai prefix /api/hr
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

    formatNumber(n) {
      return Number(n || 0).toLocaleString("id-ID");
    },
    cleanParams(raw) {
      const p = { ...raw };
      if (!String(p.search || "").trim()) delete p.search;
      if (!String(p.department_id || "")) delete p.department_id;
      // kirimkan ke BE sebagai job_position_id
      if (String(p.position_id || "") !== "") {
        p.job_position_id = p.position_id;
      }
      delete p.position_id;
      return p;
    },

    getDeptName(id) {
      const f = this.departments.find(d => String(d.id) === String(id));
      return f?.name || "";
    },
    getPosName(id) {
      const f = this.positions.find(p => String(p.id) === String(id));
      return f?.name || "";
    },

    async loadDepartments() {
      try {
        const { data } = await this.api().get("/departments", { params: { per_page: 1000 } });
        this.departments = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      } catch (e) {
        this.departments = [];
      }
    },

    async loadPositions(departmentId, forForm = false) {
      if (!departmentId) {
        this.positions = [];
        if (forForm) this.form.position_id = "";
        else this.q.position_id = "";
        return;
      }
      this.loadingPositions = true;
      try {
        // gunakan /api/hr/jobs?department_id=XX
        const { data } = await this.api().get("/jobs", {
          params: { department_id: departmentId, per_page: 1000 },
        });
        const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.positions = rows.map(r => ({ id: r.id, name: r.name }));
      } catch (e) {
        this.positions = [];
      } finally {
        this.loadingPositions = false;
      }
    },

    async onDepartmentChange() {
      await this.loadPositions(this.q.department_id, false);
      this.q.position_id = "";
      this.reload();
    },

    async reload() {
      this.loading = true;
      this.error = "";
      this.fieldErrors = {};
      try {
        const params = this.cleanParams({
          page: this.q.page,
          per_page: this.q.perPage,
          search: this.q.search,
          department_id: this.q.department_id,
          position_id: this.q.position_id, // akan diubah ke job_position_id di cleanParams
        });

        const { data } = await this.api().get("/employees", { params });

        const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.rows = rows.map((r) => ({
          ...r,
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
        this.error = e?.response?.data?.message || "Gagal memuat data karyawan";
      } finally {
        this.loading = false;
      }
    },

    go(p) {
      this.q.page = Math.max(1, p);
      this.reload();
    },

    openCreate() {
      this.modal = { open: true, mode: "create" };
      this.error = "";
      this.fieldErrors = {};
      this.form = {
        id: null,
        code: "",
        name: "",
        email: "",
        phone: "",
        department_id: "",
        position_id: "",
        join_date: "",
        salary: 0,
        address: "",
        is_active: true,
        employment_type: "permanent",
      };
      this.positions = [];
    },

    openEdit(row) {
      this.modal = { open: true, mode: "edit" };
      this.error = "";
      this.fieldErrors = {};
      this.form = {
        id: row.id,
        code: row.emp_no || "",
        name: row.full_name || row.first_name || "",
        email: row.email || "",
        phone: row.phone || "",
        department_id: row.department_id || row.department?.id || "",
        position_id: row.job_position_id || row.job_position?.id || row.jobPosition?.id || "",
        join_date: row.hire_date || "",
        salary: Number(row.salary || 0),
        address: row.address || "",
        is_active: (row.status || "active") === "active",
        employment_type: row.employment_type || "permanent",
      };
      this.loadPositions(this.form.department_id, true);
    },

    openView(row) {
      this.modal = { open: true, mode: "view" };
      this.form = {
        id: row.id,
        code: row.emp_no || "",
        name: row.full_name || row.first_name || "",
        email: row.email || "",
        phone: row.phone || "",
        department_id: row.department_id || row.department?.id || "",
        position_id: row.job_position_id || row.job_position?.id || row.jobPosition?.id || "",
        join_date: row.hire_date || "",
        salary: Number(row.salary || 0),
        address: row.address || "",
        is_active: (row.status || "active") === "active",
        employment_type: row.employment_type || "permanent",
      };
    },

    toPayload() {
      const t = (v) => (typeof v === "string" ? v.trim() : v);
      return {
        // mapping FE -> BE
        emp_no: t(this.form.code),
        first_name: t(this.form.name),   // simple: taruh di first_name
        last_name: null,
        full_name: t(this.form.name),
        email: t(this.form.email),
        phone: t(this.form.phone) || null,
        department_id: this.form.department_id ? Number(this.form.department_id) : null,
        job_position_id: this.form.position_id ? Number(this.form.position_id) : null,
        hire_date: this.form.join_date || null,
        employment_type: this.form.employment_type || "permanent",
        status: this.form.is_active ? "active" : "inactive",
        address: t(this.form.address) || null,
        // properti opsional lainnya biarkan null
      };
    },

    async save() {
      this.saving = true;
      this.error = "";
      this.fieldErrors = {};

      // FE guards untuk sesuai validasi BE
      if (!String(this.form.code || "").trim()) {
        this.saving = false; this.error = "Code/NIK wajib diisi."; return;
      }
      if (!String(this.form.name || "").trim()) {
        this.saving = false; this.error = "Name wajib diisi."; return;
      }
      if (!String(this.form.email || "").trim()) {
        this.saving = false; this.error = "Email wajib diisi."; return;
      }
      if (!this.form.department_id) {
        this.saving = false; this.error = "Department wajib dipilih."; return;
      }
      if (!this.form.position_id) {
        this.saving = false; this.error = "Position wajib dipilih."; return;
      }
      if (!this.form.join_date) {
        this.saving = false; this.error = "Join Date wajib diisi."; return;
      }

      try {
        const payload = this.toPayload();
        if (this.modal.mode === "create") {
          await this.api().post("/employees", payload);
          this.toast("success", "Employee created");
        } else {
          await this.api().put(`/employees/${this.form.id}`, payload);
          this.toast("success", "Employee updated");
        }
        this.modal.open = false;
        await this.reload();
      } catch (e) {
        if (e?.response?.status === 422) {
          this.fieldErrors = e.response.data?.errors || {};
          this.error =
            Object.values(this.fieldErrors)[0]?.[0] ||
            e.response.data?.message ||
            "Validasi gagal";
          this.toast("error", this.error);
        } else {
          this.error = e?.response?.data?.message || "Gagal menyimpan employee";
          this.toast("error", this.error);
        }
      } finally {
        this.saving = false;
      }
    },

    async confirmDelete(row) {
      const res = await Swal.fire({
        title: `Hapus "${row.full_name || row.first_name || row.name}"?`,
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
        await this.api().delete(`/employees/${row.id}`);
        this.toast("success", "Deleted");
        await this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal menghapus employee";
        this.toast("error", this.error);
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>
