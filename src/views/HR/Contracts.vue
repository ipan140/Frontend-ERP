<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">hr</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Contracts</h1>
      </div>

      <div class="flex gap-2 w-full lg:w-auto">
        <input
          v-model="q.search"
          @input="debouncedSearch"
          @keyup.enter="reload"
          class="flex-1 lg:flex-none border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search by employee name or contract no…"
        />
        <button
          @click="reload"
          class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5"
        >
          Search
        </button>
        <button
          @click="openCreate"
          class="inline-flex items-center justify-center gap-2 bg-primary text-white rounded py-2.5 px-5 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[.98] transition"
        >
          <Icon icon="ic:round-add" class="text-xl" />
          <span class="font-medium">New Contract</span>
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
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

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">Contract No</th>
              <th class="px-6 py-3">Employee</th>
              <th class="px-6 py-3">Position</th>
              <th class="px-6 py-3">Start Date</th>
              <th class="px-6 py-3">End Date</th>
              <th class="px-6 py-3">Salary</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in rows"
              :key="r.id"
              class="bg-white dark:bg-gray-800 border-b dark:border-gray-700"
            >
              <td class="px-6 py-3">{{ r.contract_no || '-' }}</td>
              <td class="px-6 py-3">{{ r.employee?.name || '-' }}</td>
              <td class="px-6 py-3">{{ r.position || '-' }}</td>
              <td class="px-6 py-3">{{ r.start_date || '-' }}</td>
              <td class="px-6 py-3">{{ r.end_date || '-' }}</td>
              <td class="px-6 py-3">Rp{{ formatNumber(r.salary) }}</td>
              <td class="px-6 py-3">
                <span
                  v-if="r.is_active"
                  class="px-2 py-1 text-xs rounded bg-green-100 text-green-700"
                  >Active</span
                >
                <span
                  v-else
                  class="px-2 py-1 text-xs rounded bg-red-100 text-red-700"
                  >Expired</span
                >
              </td>
              <td class="px-6 py-3 text-right space-x-2">
                <button @click="openView(r)" class="px-2 py-1 rounded border dark:border-gray-600" title="View">View</button>
                <button @click="openEdit(r)" class="px-2 py-1 rounded border dark:border-gray-600" title="Edit">Edit</button>
                <button @click="confirmDelete(r)" class="px-2 py-1 rounded border dark:border-gray-600" title="Delete">Delete</button>
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
        <div class="text-sm text-gray-500 dark:text-gray-400">Page {{ page.current }} / {{ page.last }}</div>
        <button :disabled="!page.next" @click="go(page.current + 1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">Next</button>
      </div>
    </div>

    <!-- Modal: Create/Edit -->
    <div v-if="modal.open && modal.mode !== 'view'" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">
          {{ modal.mode === 'create' ? 'New Contract' : 'Edit Contract' }}
        </h3>

        <div class="grid gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Contract No</label>
            <input v-model="form.contract_no" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Employee</label>
            <select v-model="form.employee_id" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option value="">Select Employee</option>
              <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Position</label>
            <input v-model="form.position" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Salary</label>
            <input v-model.number="form.salary" type="number" min="0" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Start Date</label>
            <input v-model="form.start_date" type="date" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">End Date</label>
            <input v-model="form.end_date" type="date" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
          </div>

          <div class="flex items-center gap-2 mt-2">
            <input id="is_active" type="checkbox" v-model="form.is_active" class="w-4 h-4 border dark:border-gray-600 dark:bg-gray-800" />
            <label for="is_active" class="text-sm dark:text-gray-300">Active</label>
          </div>
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open = false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="save" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">{{ saving ? 'Saving…' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <!-- Modal: View -->
    <div v-if="modal.open && modal.mode === 'view'" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Contract Detail</h3>
        <div class="grid gap-3 text-sm">
          <p><span class="text-gray-500">Contract No:</span> {{ form.contract_no || '-' }}</p>
          <p><span class="text-gray-500">Employee:</span> {{ getEmpName(form.employee_id) }}</p>
          <p><span class="text-gray-500">Position:</span> {{ form.position || '-' }}</p>
          <p><span class="text-gray-500">Salary:</span> Rp{{ formatNumber(form.salary) }}</p>
          <p><span class="text-gray-500">Start Date:</span> {{ form.start_date || '-' }}</p>
          <p><span class="text-gray-500">End Date:</span> {{ form.end_date || '-' }}</p>
          <p>
            <span class="text-gray-500">Status:</span>
            <span v-if="form.is_active" class="ml-1 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">Active</span>
            <span v-else class="ml-1 px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">Expired</span>
          </p>
        </div>
        <div class="mt-5 flex justify-end">
          <button @click="modal.open = false" class="px-4 py-2 rounded border dark:border-gray-600">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Swal from "sweetalert2";
import { Icon } from "@iconify/vue";

export default {
  name: "Contracts",
  components: { Icon },

  data() {
    return {
      loading: false,
      rows: [],
      employees: [],
      q: { page: 1, perPage: 10, search: "" },
      page: { current: 1, last: 1, total: 0, from: 0, to: 0, prev: false, next: false },
      modal: { open: false, mode: "create" },
      form: {
        id: null,
        contract_no: "",
        employee_id: "",
        position: "",
        salary: 0,
        start_date: "",
        end_date: "",
        is_active: true,
      },
      saving: false,
      error: "",
      _searchTimer: null,
    };
  },

  mounted() {
    this.loadEmployees();
    this.reload();
  },

  methods: {
    toast(icon, title) {
      const T = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 1500 });
      T.fire({ icon, title });
    },
    resolveBaseUrl() {
      const raw = import.meta?.env?.VITE_API_BASE || "http://localhost:8000";
      return String(raw).trim().replace(/\/+$/, "");
    },
    api() {
      const token = localStorage.getItem("token");
      const base = this.resolveBaseUrl();
      return axios.create({
        baseURL: `${base}/api/hr`,
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
    },
    formatNumber(n) {
      return Number(n || 0).toLocaleString("id-ID");
    },
    getEmpName(id) {
      const e = this.employees.find((v) => String(v.id) === String(id));
      return e?.name || "-";
    },
    async loadEmployees() {
      try {
        const { data } = await this.api().get("/employees");
        this.employees = Array.isArray(data.data) ? data.data : data;
      } catch {
        this.employees = [];
      }
    },
    debouncedSearch() {
      clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => this.reload(), 350);
    },
    async reload() {
      this.loading = true;
      try {
        const { data } = await this.api().get("/contracts", { params: { ...this.q } });
        this.rows = Array.isArray(data.data) ? data.data : data;
        this.page.current = data.current_page || 1;
        this.page.last = data.last_page || 1;
        this.page.total = data.total || this.rows.length;
        this.page.prev = this.page.current > 1;
        this.page.next = this.page.current < this.page.last;
      } catch (e) {
        this.error = e?.response?.data?.message || "Failed to load contracts";
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
      this.form = { id: null, contract_no: "", employee_id: "", position: "", salary: 0, start_date: "", end_date: "", is_active: true };
    },
    openEdit(r) {
      this.modal = { open: true, mode: "edit" };
      this.form = { ...r, employee_id: r.employee_id || r.employee?.id || "" };
    },
    openView(r) {
      this.modal = { open: true, mode: "view" };
      this.form = { ...r, employee_id: r.employee_id || r.employee?.id || "" };
    },
    async save() {
      this.saving = true;
      try {
        if (this.modal.mode === "create") {
          await this.api().post("/contracts", this.form);
          this.toast("success", "Contract created");
        } else {
          await this.api().put(`/contracts/${this.form.id}`, this.form);
          this.toast("success", "Contract updated");
        }
        this.modal.open = false;
        this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || "Failed to save contract";
        this.toast("error", this.error);
      } finally {
        this.saving = false;
      }
    },
    async confirmDelete(r) {
      const res = await Swal.fire({
        title: `Delete contract "${r.contract_no}"?`,
        text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
      });
      if (!res.isConfirmed) return;
      try {
        await this.api().delete(`/contracts/${r.id}`);
        this.toast("success", "Deleted");
        this.reload();
      } catch (e) {
        this.toast("error", e?.response?.data?.message || "Failed to delete");
      }
    },
  },
};
</script>
