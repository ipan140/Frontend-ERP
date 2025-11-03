<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">hr</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Departments</h1>
      </div>

      <div class="flex gap-2 w-full lg:w-auto">
        <input
          v-model="q.search"
          @input="debouncedSearch"
          @keyup.enter="reload"
          class="flex-1 lg:flex-none border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search name / code / description…"
        />
        <button @click="reload" class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5">
          Search
        </button>
        <button
          @click="openCreate"
          class="inline-flex items-center justify-center gap-2 bg-primary text-white rounded py-2.5 px-5 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[.98] transition"
          title="Add new department"
        >
          <Icon icon="ic:round-add" class="text-xl" />
          <span class="font-medium">New Department</span>
        </button>
      </div>
    </div>

    <!-- Card -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <!-- Filters/summary -->
      <div class="px-5 py-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div class="flex flex-col sm:flex-row gap-3 flex-1">
          <div class="w-full sm:w-40">
            <label class="block text-sm dark:text-gray-300 mb-1">Per page</label>
            <select
              v-model.number="q.perPage"
              @change="reload"
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
              <th class="px-6 py-3">Parent</th>
              <th class="px-6 py-3">Manager</th>
              <th class="px-6 py-3">Active</th>
              <th class="px-6 py-3">Description</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3 font-mono">{{ r.code || '-' }}</td>
              <td class="px-6 py-3">{{ r.name }}</td>
              <td class="px-6 py-3">{{ r.parent?.name || r.parent_name || '-' }}</td>
              <td class="px-6 py-3">{{ r.manager?.full_name || r.manager?.name || r.manager_name || '-' }}</td>
              <td class="px-6 py-3">
                <span v-if="isActive(r.active)" class="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Active</span>
                <span v-else class="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Inactive</span>
              </td>
              <td class="px-6 py-3 truncate max-w-[420px]" :title="r.description">{{ r.description || '-' }}</td>
              <td class="px-6 py-3 text-right space-x-2">
                <button @click="openView(r)"  class="px-2 py-1 rounded border dark:border-gray-600" title="View">View</button>
                <button @click="openEdit(r)"  class="px-2 py-1 rounded border dark:border-gray-600" title="Edit">Edit</button>
                <button @click="confirmDelete(r)" class="px-2 py-1 rounded border dark:border-gray-600" :disabled="saving" title="Delete">Delete</button>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="7" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-5 py-4 flex items-center justify-between">
        <button :disabled="!page.prev" @click="go(page.current - 1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">
          Prev
        </button>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ page.current || 1 }} / {{ page.last || 1 }}
        </div>
        <button :disabled="!page.next" @click="go(page.current + 1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">
          Next
        </button>
      </div>
    </div>

    <!-- Modal: Create/Edit -->
    <div v-if="modal.open && modal.mode !== 'view'" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-3xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">
          {{ modal.mode === 'create' ? 'New Department' : 'Edit Department' }}
        </h3>

        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Code</label>
            <input v-model="form.code" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.code" class="text-xs text-red-500 mt-1">{{ fieldErrors.code[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Name<span class="text-red-500">*</span></label>
            <input v-model="form.name" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.name" class="text-xs text-red-500 mt-1">{{ fieldErrors.name[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Parent Department</label>
            <select v-model="form.parent_id" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option :value="null">— None —</option>
              <option v-for="d in parentOptions" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
            <p v-if="fieldErrors.parent_id" class="text-xs text-red-500 mt-1">{{ fieldErrors.parent_id[0] }}</p>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Manager (Employee)</label>
            <select v-model="form.manager_employee_id" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option :value="null">— None —</option>
              <option v-for="e in employees" :key="e.id" :value="e.id">
                {{ e.name }}<span v-if="e.email"> — {{ e.email }}</span>
              </option>
            </select>
            <p v-if="fieldErrors.manager_employee_id" class="text-xs text-red-500 mt-1">{{ fieldErrors.manager_employee_id[0] }}</p>
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Description</label>
            <textarea v-model="form.description" rows="3" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"></textarea>
            <p v-if="fieldErrors.description" class="text-xs text-red-500 mt-1">{{ fieldErrors.description[0] }}</p>
          </div>

          <div class="md:col-span-2 flex items-center gap-2 mt-2">
            <input id="active" type="checkbox" v-model="form.active" class="w-4 h-4 rounded border dark:border-gray-600 dark:bg-gray-800" />
            <label for="active" class="text-sm dark:text-gray-300">Active</label>
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
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Department Detail</h3>
        <div class="grid gap-3 text-sm">
          <p><span class="text-gray-500">Code:</span> {{ form.code || '-' }}</p>
          <p><span class="text-gray-500">Name:</span> {{ form.name }}</p>
          <p><span class="text-gray-500">Parent:</span> {{ getParentName(form.parent_id) || '-' }}</p>
          <p><span class="text-gray-500">Manager:</span> {{ getEmployeeName(form.manager_employee_id) || '-' }}</p>
          <p><span class="text-gray-500">Active:</span> {{ isActive(form.active) ? 'Yes' : 'No' }}</p>
          <p><span class="text-gray-500">Description:</span> {{ form.description || '-' }}</p>
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
  name: "Departments",
  components: { Icon },
  data() {
    return {
      loading: false,
      rows: [],
      q: { page: 1, perPage: 10, search: "" },
      page: { current: 1, last: 1, total: 0, from: 0, to: 0, prev: false, next: false },

      // dropdown sources
      allDepartments: [],
      employees: [],

      modal: { open: false, mode: "create" },
      form: {
        id: null,
        code: "",
        name: "",
        parent_id: null,
        manager_employee_id: null,
        description: "",
        active: true,
      },

      saving: false,
      error: "",
      fieldErrors: {},
      _searchTimer: null,
    };
  },

  mounted() {
    Promise.all([this.loadDepartmentsMaster(), this.loadEmployeesMaster()]).finally(() => {
      this.reload();
    });
  },

  computed: {
    parentOptions() {
      return this.allDepartments.filter(d => String(d.id) !== String(this.form.id || ""));
    },
  },

  methods: {
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
        baseURL: `${API_BASE}/api/hr`, // ⬅️ gunakan prefix /api/hr
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

    isActive(v) {
      return v === true || v === 1 || v === "1";
    },

    async loadDepartmentsMaster() {
      try {
        const { data } = await this.api().get("/departments", { params: { per_page: 1000 } });
        this.allDepartments = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      } catch {
        this.allDepartments = [];
      }
    },

    async loadEmployeesMaster() {
      try {
        const { data } = await this.api().get("/employees", { params: { per_page: 1000, status: 'active' } });
        const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        // Normalisasi nama agar enak dipakai di dropdown
        this.employees = rows.map(e => ({
          id: e.id,
          email: e.email || null,
          name: e.full_name || [e.first_name, e.last_name].filter(Boolean).join(" ") || e.name || `Emp#${e.id}`,
        }));
      } catch {
        this.employees = [];
      }
    },

    getParentName(id) {
      const f = this.allDepartments.find(d => String(d.id) === String(id));
      return f?.name || "";
    },
    getEmployeeName(id) {
      const f = this.employees.find(e => String(e.id) === String(id));
      return f?.name || "";
    },

    cleanParams(raw) {
      const p = { ...raw };
      if (!String(p.search || "").trim()) delete p.search;
      return p;
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
        });

        const { data } = await this.api().get("/departments", { params });

        const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.rows = rows.map((r) => ({
          ...r,
          active: this.isActive(r.active) ? 1 : 0,
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
        this.error = e?.response?.data?.message || "Failed to load departments";
      } finally {
        this.loading = false;
      }
    },

    debouncedSearch() {
      clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => this.reload(), 350);
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
        parent_id: null,
        manager_employee_id: null,
        description: "",
        active: true,
      };
    },

    openEdit(row) {
      this.modal = { open: true, mode: "edit" };
      this.error = "";
      this.fieldErrors = {};
      this.form = {
        id: row.id,
        code: row.code || "",
        name: row.name || "",
        parent_id: row.parent_id ?? row.parent?.id ?? null,
        manager_employee_id: row.manager_employee_id ?? row.manager?.id ?? null,
        description: row.description || "",
        active: this.isActive(row.active),
      };
    },

    openView(row) {
      this.modal = { open: true, mode: "view" };
      this.form = {
        id: row.id,
        code: row.code || "",
        name: row.name || "",
        parent_id: row.parent_id ?? row.parent?.id ?? null,
        manager_employee_id: row.manager_employee_id ?? row.manager?.id ?? null,
        description: row.description || "",
        active: this.isActive(row.active),
      };
    },

    toPayload() {
      const t = (v) => (typeof v === "string" ? v.trim() : v);
      return {
        code: t(this.form.code) || null,
        name: t(this.form.name),
        parent_id: this.form.parent_id ? Number(this.form.parent_id) : null,
        manager_employee_id: this.form.manager_employee_id ? Number(this.form.manager_employee_id) : null,
        description: t(this.form.description) || null,
        active: this.form.active ? 1 : 0,
      };
    },

    async save() {
      this.saving = true;
      this.error = "";
      this.fieldErrors = {};

      if (!String(this.form.name || "").trim()) {
        this.saving = false; this.error = "Name wajib diisi."; return;
      }

      try {
        const payload = this.toPayload();
        if (this.modal.mode === "create") {
          await this.api().post("/departments", payload);
          this.toast("success", "Department created");
        } else {
          await this.api().put(`/departments/${this.form.id}`, payload);
          this.toast("success", "Department updated");
        }
        this.modal.open = false;
        await this.loadDepartmentsMaster(); // refresh dropdown Parent
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
          this.error = e?.response?.data?.message || "Gagal menyimpan department";
          this.toast("error", this.error);
        }
      } finally {
        this.saving = false;
      }
    },

    async confirmDelete(row) {
      const res = await Swal.fire({
        title: `Hapus "${row.name}"?`,
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
        await this.api().delete(`/departments/${row.id}`);
        this.toast("success", "Deleted");
        await this.loadDepartmentsMaster();
        await this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || "Gagal menghapus department";
        this.toast("error", this.error);
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>
