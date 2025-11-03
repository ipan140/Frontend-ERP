<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">hr</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Leave Allocations</h1>
      </div>

      <div class="flex gap-2 w-full lg:w-auto">
        <input v-model="q.search" @keyup.enter="reload"
          class="flex-1 lg:flex-none border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search notes…" />
        <button @click="reload"
          class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5">
          Search
        </button>
        <button @click="openCreate"
          class="inline-flex items-center justify-center gap-2 bg-primary text-white rounded py-2.5 px-5 hover:bg-primary/90">
          <Icon icon="ic:round-add" class="text-xl" />
          <span class="font-medium">New Allocation</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 grid gap-3 md:grid-cols-5">
        <div>
          <label class="block text-sm dark:text-gray-300 mb-1">Employee</label>
          <select v-model="q.employee_id" @change="reload" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
            <option value="">All</option>
            <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm dark:text-gray-300 mb-1">Leave type</label>
          <select v-model="q.leave_type_id" @change="reload" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
            <option value="">All</option>
            <option v-for="t in leaveTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm dark:text-gray-300 mb-1">Year</label>
          <input type="number" v-model.number="q.year" @change="reload"
            class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
        </div>
        <div class="w-40">
          <label class="block text-sm dark:text-gray-300 mb-1">Per page</label>
          <select v-model.number="q.perPage" @change="reload"
            class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
            <option v-for="n in [10,20,50]" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400 flex items-end justify-end">
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
              <th class="px-6 py-3">Year</th>
              <th class="px-6 py-3">Allocated</th>
              <th class="px-6 py-3">Used</th>
              <th class="px-6 py-3">Remaining</th>
              <th class="px-6 py-3">Notes</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3">{{ r.employee?.name || r.employee_name || '-' }}</td>
              <td class="px-6 py-3">{{ r.leave_type?.name || r.leave_type_name || '-' }}</td>
              <td class="px-6 py-3">{{ r.year }}</td>
              <td class="px-6 py-3">{{ r.days }}</td>
              <td class="px-6 py-3">{{ r.used_days ?? 0 }}</td>
              <td class="px-6 py-3">{{ (r.days ?? 0) - (r.used_days ?? 0) }}</td>
              <td class="px-6 py-3 truncate max-w-[320px]" :title="r.notes">{{ r.notes || '-' }}</td>
              <td class="px-6 py-3 text-right space-x-2">
                <button @click="openView(r)" class="px-2 py-1 rounded border dark:border-gray-600">View</button>
                <button @click="openEdit(r)" class="px-2 py-1 rounded border dark:border-gray-600">Edit</button>
                <button @click="confirmDelete(r)" class="px-2 py-1 rounded border dark:border-gray-600" :disabled="saving">Delete</button>
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
          {{ modal.mode === 'create' ? 'New Allocation' : 'Edit Allocation' }}
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
            <label class="block text-sm mb-1 dark:text-gray-300">Year<span class="text-red-500">*</span></label>
            <input type="number" v-model.number="form.year" min="2000"
              class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.year" class="text-xs text-red-500 mt-1">{{ fieldErrors.year[0] }}</p>
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Allocated days<span class="text-red-500">*</span></label>
            <input type="number" v-model.number="form.days" min="0"
              class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
            <p v-if="fieldErrors.days" class="text-xs text-red-500 mt-1">{{ fieldErrors.days[0] }}</p>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Notes</label>
            <input v-model="form.notes" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
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
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Allocation Detail</h3>
        <div class="grid md:grid-cols-2 gap-3 text-sm">
          <p><span class="text-gray-500">Employee:</span> {{ findName(employees, form.employee_id) || '-' }}</p>
          <p><span class="text-gray-500">Type:</span> {{ findName(leaveTypes, form.leave_type_id) || '-' }}</p>
          <p><span class="text-gray-500">Year:</span> {{ form.year || '-' }}</p>
          <p><span class="text-gray-500">Allocated:</span> {{ form.days || 0 }}</p>
          <p><span class="text-gray-500">Used:</span> {{ form.used_days ?? 0 }}</p>
          <p><span class="text-gray-500">Remaining:</span> {{ (form.days||0) - (form.used_days||0) }}</p>
          <p class="md:col-span-2"><span class="text-gray-500">Notes:</span> {{ form.notes || '-' }}</p>
        </div>
        <div class="mt-5 flex justify-end">
          <button @click="modal.open = false" class="px-4 py-2 rounded border dark:border-gray-600">Close</button>
        </div>
      </div>
    </div>

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
  name: "LeaveAllocations",
  components: { Icon },
  data() {
    const y = new Date().getFullYear();
    return {
      loading: false,
      rows: [],
      q: { page: 1, perPage: 10, search: "", employee_id: "", leave_type_id: "", year: y },
      page: { current: 1, last: 1, total: 0, from: 0, to: 0, prev: false, next: false },

      employees: [],
      leaveTypes: [],

      modal: { open: false, mode: "create" },
      form: { id: null, employee_id: "", leave_type_id: "", year: y, days: 0, used_days: 0, notes: "" },

      saving: false,
      error: "",
      fieldErrors: {},
    };
  },
  mounted() { Promise.all([this.loadEmployees(), this.loadLeaveTypes()]).then(() => this.reload()); },
  methods: {
    toast(icon, title) { Swal.mixin({ toast:true, position:"top-end", showConfirmButton:false, timer:1500, timerProgressBar:true }).fire({ icon, title }); },
    resolveBaseUrl() { const raw = import.meta?.env?.VITE_API_BASE || "http://localhost:8000"; return String(raw).trim().replace(/\/+$/, ""); },
    api() {
      const token = localStorage.getItem("token");
      const API_BASE = this.resolveBaseUrl();
      const instance = axios.create({ baseURL: `${API_BASE}/api/hr`, headers: { Accept:"application/json", ...(token ? { Authorization:`Bearer ${token}` } : {}) } });
      instance.interceptors.response.use(r=>r, e=>{ if(e?.response?.status===401){ localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href="/auth/login"; } return Promise.reject(e); });
      return instance;
    },
    findName(arr, id) { const f = arr.find(x => String(x.id) === String(id)); return f?.name || ""; },
    cleanParams(p) { const q={...p}; for(const k of ["search","employee_id","leave_type_id","year"]) { if(!String(q[k] ?? "").trim()) delete q[k]; } return q; },

    async loadEmployees() {
      try {
        const { data } = await this.api().get("/employees", { params: { per_page: 1000, status: "active" } });
        const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.employees = rows.map(e => ({ id: e.id, name: e.full_name || e.name || [e.first_name, e.last_name].filter(Boolean).join(" ") || `Emp#${e.id}` }));
      } catch { this.employees = []; }
    },
    async loadLeaveTypes() {
      try {
        const { data } = await this.api().get("/leave-types", { params: { per_page: 1000 } });
        this.leaveTypes = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      } catch { this.leaveTypes = []; }
    },

    async reload() {
      this.loading = true; this.error=""; this.fieldErrors={};
      try {
        const params = this.cleanParams({ page:this.q.page, per_page:this.q.perPage, search:this.q.search, employee_id:this.q.employee_id, leave_type_id:this.q.leave_type_id, year:this.q.year });
        const { data } = await this.api().get("/leave-allocations", { params });
        const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.rows = rows;
        this.page = {
          current:Number(data.current_page||1), last:Number(data.last_page||1),
          total:Number(data.total||this.rows.length), from:Number(data.from||(this.rows.length?1:0)), to:Number(data.to||this.rows.length),
          prev:Number(data.current_page||1)>1, next:Number(data.current_page||1)<Number(data.last_page||1),
        };
      } catch (e) { this.error = e?.response?.data?.message || "Failed to load allocations"; }
      finally { this.loading = false; }
    },
    go(p){ this.q.page=Math.max(1,p); this.reload(); },

    openCreate(){ this.modal={open:true,mode:"create"}; this.error=""; this.fieldErrors={}; const y=new Date().getFullYear(); this.form={ id:null, employee_id:"", leave_type_id:"", year:y, days:0, used_days:0, notes:"" }; },
    openEdit(r){ this.modal={open:true,mode:"edit"}; this.error=""; this.fieldErrors={}; this.form={ id:r.id, employee_id:r.employee_id||r.employee?.id||"", leave_type_id:r.leave_type_id||r.leave_type?.id||"", year:Number(r.year||new Date().getFullYear()), days:Number(r.days||0), used_days:Number(r.used_days||0), notes:r.notes||"" }; },
    openView(r){ this.modal={open:true,mode:"view"}; this.form={ id:r.id, employee_id:r.employee_id||r.employee?.id||"", leave_type_id:r.leave_type_id||r.leave_type?.id||"", year:Number(r.year||new Date().getFullYear()), days:Number(r.days||0), used_days:Number(r.used_days||0), notes:r.notes||"" }; },

    toPayload(){ return { employee_id:Number(this.form.employee_id), leave_type_id:Number(this.form.leave_type_id), year:Number(this.form.year), days:Number(this.form.days||0), notes:this.form.notes||null }; },

    async save(){
      this.saving=true; this.error=""; this.fieldErrors={};
      if(!this.form.employee_id){ this.error="Employee wajib dipilih."; this.saving=false; return; }
      if(!this.form.leave_type_id){ this.error="Leave type wajib dipilih."; this.saving=false; return; }
      if(!this.form.year){ this.error="Year wajib diisi."; this.saving=false; return; }

      try{
        const payload=this.toPayload();
        if(this.modal.mode==="create"){ await this.api().post("/leave-allocations", payload); this.toast("success","Allocation created"); }
        else { await this.api().put(`/leave-allocations/${this.form.id}`, payload); this.toast("success","Allocation updated"); }
        this.modal.open=false; await this.reload();
      }catch(e){
        if(e?.response?.status===422){ this.fieldErrors=e.response.data?.errors||{}; this.error=Object.values(this.fieldErrors)[0]?.[0]||e.response.data?.message||"Validasi gagal"; this.toast("error", this.error); }
        else { this.error=e?.response?.data?.message||"Gagal menyimpan allocation"; this.toast("error", this.error); }
      }finally{ this.saving=false; }
    },

    async confirmDelete(r){
      const res = await Swal.fire({ title:`Hapus alokasi ${r.employee?.name||''}?`, text:"Tindakan ini tidak dapat dibatalkan.", icon:"warning", showCancelButton:true, confirmButtonText:"Yes, delete", cancelButtonText:"Cancel", reverseButtons:true, focusCancel:true });
      if(!res.isConfirmed) return;
      this.saving=true; this.error="";
      try{ await this.api().delete(`/leave-allocations/${r.id}`); this.toast("success","Deleted"); await this.reload(); }
      catch(e){ this.error=e?.response?.data?.message||"Gagal menghapus"; this.toast("error", this.error); }
      finally{ this.saving=false; }
    },
  },
};
</script>
