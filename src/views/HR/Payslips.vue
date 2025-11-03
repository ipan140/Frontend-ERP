<template>
  <div class="p-4">
    <!-- ===== Header ===== -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">hr</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Payroll</h1>
      </div>

      <div class="flex gap-2 w-full lg:w-auto">
        <input
          v-model="q.search"
          @keyup.enter="reload"
          class="flex-1 lg:flex-none border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search employee/notes…"
        />
        <button @click="reload" class="border rounded py-2 px-5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
          Search
        </button>
        <button
          @click="openCreate"
          class="inline-flex items-center gap-2 bg-primary text-white rounded py-2.5 px-5 hover:bg-primary/90 focus:ring-2 focus:ring-primary/40 transition"
        >
          <Icon icon="ic:round-add" class="text-xl" />
          New Payslip
        </button>
      </div>
    </div>

    <!-- ===== Filters ===== -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 grid gap-3 md:grid-cols-5">
        <FilterSelect label="Year" v-model="q.year" :options="years" @change="reload" />
        <FilterSelect
          label="Month"
          v-model="q.month"
          :options="months.map((m,i)=>({label:m,value:String(i+1).padStart(2,'0')}))"
          @change="reload"
        />
        <FilterSelect
          label="Department"
          v-model="q.department_id"
          :options="departments.map(d=>({label:d.name,value:d.id}))"
          @change="reload"
        />
        <FilterSelect
          label="Status"
          v-model="q.status"
          :options="[{label:'Draft',value:'draft'},{label:'Approved',value:'approved'},{label:'Paid',value:'paid'}]"
          @change="reload"
        />
        <FilterSelect
          label="Per Page"
          v-model.number="q.perPage"
          :options="[10,20,50].map(n=>({label:n,value:n}))"
          @change="reload"
        />
      </div>

      <div class="px-5 pb-3 text-sm text-gray-500 dark:text-gray-400">
        {{ page.from || 0 }}–{{ page.to || 0 }} of {{ page.total || 0 }}
      </div>

      <!-- ===== Table ===== -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">Employee</th>
              <th class="px-6 py-3">Period</th>
              <th class="px-6 py-3 text-right">Basic</th>
              <th class="px-6 py-3 text-right">Allowance</th>
              <th class="px-6 py-3 text-right">Overtime</th>
              <th class="px-6 py-3 text-right">Deductions</th>
              <th class="px-6 py-3 text-right">Tax</th>
              <th class="px-6 py-3 text-right">Net Pay</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3">
                <div class="font-medium">{{ r.employee_name }}</div>
                <div class="text-xs text-gray-500">{{ r.department_name || '-' }}</div>
              </td>
              <td class="px-6 py-3 font-mono">{{ r.year }}-{{ r.month }}</td>
              <td class="px-6 py-3 text-right">Rp{{ num(r.basic_salary) }}</td>
              <td class="px-6 py-3 text-right">Rp{{ num(r.allowances) }}</td>
              <td class="px-6 py-3 text-right">Rp{{ num(r.overtime_pay) }}</td>
              <td class="px-6 py-3 text-right">Rp{{ num(r.deductions) }}</td>
              <td class="px-6 py-3 text-right">Rp{{ num(r.tax_amount) }}</td>
              <td class="px-6 py-3 text-right font-semibold">Rp{{ num(r.net_pay) }}</td>
              <td class="px-6 py-3">
                <span :class="statusClass(r.status)" class="px-2 py-1 text-xs rounded">{{ r.status }}</span>
              </td>
              <td class="px-6 py-3 text-right space-x-2">
                <button @click="openView(r)" class="px-2 py-1 rounded border dark:border-gray-600">View</button>
                <button @click="openEdit(r)" class="px-2 py-1 rounded border dark:border-gray-600" :disabled="r.status!=='draft'">Edit</button>
                <button @click="approve(r)" class="px-2 py-1 rounded border dark:border-gray-600" :disabled="r.status!=='draft'">Approve</button>
                <button @click="pay(r)" class="px-2 py-1 rounded border dark:border-gray-600" :disabled="r.status!=='approved'">Pay</button>
                <button @click="confirmDelete(r)" class="px-2 py-1 rounded border dark:border-gray-600" :disabled="saving">Delete</button>
              </td>
            </tr>

            <tr v-if="!loading && !rows.length">
              <td colspan="10" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== Pagination ===== -->
      <div class="px-5 py-4 flex items-center justify-between">
        <button :disabled="!page.prev" @click="go(page.current-1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">Prev</button>
        <div class="text-sm text-gray-500 dark:text-gray-400">Page {{ page.current }} / {{ page.last }}</div>
        <button :disabled="!page.next" @click="go(page.current+1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">Next</button>
      </div>
    </div>

    <!-- ===== Modal: Create/Edit ===== -->
    <div v-if="modal.open && modal.mode!=='view'" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open=false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-3xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">
          {{ modal.mode === 'create' ? 'New Payslip' : 'Edit Payslip' }}
        </h3>

        <div class="grid md:grid-cols-3 gap-3">
          <!-- Employee -->
          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Employee<span class="text-red-500">*</span></label>
            <select v-model="form.employee_id" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option value="">Select employee…</option>
              <option v-for="e in employees" :key="e.id" :value="e.id">
                {{ e.full_name || e.name || ('Emp #' + e.id) }} — {{ e.department?.name || e.department_name || '-' }}
              </option>
            </select>
          </div>

          <!-- Period -->
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Period<span class="text-red-500">*</span></label>
            <div class="flex gap-2">
              <select v-model="form.year" class="flex-1 border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
                <option v-for="y in years" :key="y" :value="String(y)">{{ y }}</option>
              </select>
              <select v-model="form.month" class="flex-1 border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
                <option v-for="(m,idx) in months" :key="idx" :value="String(idx+1).padStart(2,'0')">{{ m }}</option>
              </select>
            </div>
          </div>

          <!-- Numbers -->
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Basic Salary (Rp)<span class="text-red-500">*</span></label>
            <input v-model.number="form.basic_salary" type="number" min="0" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Allowances (Rp)</label>
            <input v-model.number="form.allowances" type="number" min="0" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Deductions (Rp)</label>
            <input v-model.number="form.deductions" type="number" min="0" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
          </div>

          <!-- Overtime -->
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Overtime Hours</label>
            <input v-model.number="form.overtime_hours" type="number" min="0" step="0.5" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Overtime Rate (Rp/hour)</label>
            <input v-model.number="form.overtime_rate" type="number" min="0" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Tax Rate (%)</label>
            <input v-model.number="form.tax_rate" type="number" min="0" step="0.1" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
          </div>

          <!-- Notes -->
          <div class="md:col-span-3">
            <label class="block text-sm mb-1 dark:text-gray-300">Notes</label>
            <input v-model="form.notes" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
          </div>

          <!-- Calculated preview -->
          <div class="md:col-span-3 grid sm:grid-cols-4 gap-3 mt-2 text-sm">
            <div class="p-3 rounded border dark:border-gray-700">
              <div class="text-gray-500">Overtime Pay</div>
              <div class="font-semibold">Rp{{ num(calc.overtime_pay) }}</div>
            </div>
            <div class="p-3 rounded border dark:border-gray-700">
              <div class="text-gray-500">Gross</div>
              <div class="font-semibold">Rp{{ num(calc.gross) }}</div>
            </div>
            <div class="p-3 rounded border dark:border-gray-700">
              <div class="text-gray-500">Tax</div>
              <div class="font-semibold">Rp{{ num(calc.tax_amount) }}</div>
            </div>
            <div class="p-3 rounded border dark:border-gray-700">
              <div class="text-gray-500">Net Pay</div>
              <div class="font-semibold">Rp{{ num(calc.net_pay) }}</div>
            </div>
          </div>
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open=false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="save" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== Modal: View ===== -->
    <div v-if="modal.open && modal.mode==='view'" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open=false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">Payslip Detail</h3>
        <div class="grid md:grid-cols-2 gap-3 text-sm">
          <p><span class="text-gray-500">Employee:</span> {{ viewRow.employee_name }}</p>
          <p><span class="text-gray-500">Period:</span> {{ viewRow.year }}-{{ String(viewRow.month).padStart(2,'0') }}</p>
          <p><span class="text-gray-500">Basic:</span> Rp{{ num(viewRow.basic_salary) }}</p>
          <p><span class="text-gray-500">Allowance:</span> Rp{{ num(viewRow.allowances) }}</p>
          <p><span class="text-gray-500">Overtime Pay:</span> Rp{{ num(viewRow.overtime_pay) }}</p>
          <p><span class="text-gray-500">Deductions:</span> Rp{{ num(viewRow.deductions) }}</p>
          <p><span class="text-gray-500">Tax:</span> Rp{{ num(viewRow.tax_amount) }}</p>
          <p><span class="text-gray-500">Net Pay:</span> <b>Rp{{ num(viewRow.net_pay) }}</b></p>
          <p class="md:col-span-2"><span class="text-gray-500">Status:</span> {{ viewRow.status }}</p>
          <p class="md:col-span-2"><span class="text-gray-500">Notes:</span> {{ viewRow.notes || '-' }}</p>
        </div>
        <div class="mt-5 flex justify-end">
          <button @click="modal.open=false" class="px-4 py-2 rounded border dark:border-gray-600">Close</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="errorToast" class="fixed bottom-4 right-4 bg-red-600 text-white text-sm px-4 py-3 rounded shadow">
      {{ errorToast }}
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import Swal from "sweetalert2";
import { ref, reactive, computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";

/* ---------- Small helper select (inline component) ---------- */
const FilterSelect = {
  name: "FilterSelect",
  props: ["label","modelValue","options"],
  emits:["update:modelValue","change"],
  template: `
  <div>
    <label class="block text-sm dark:text-gray-300 mb-1">{{label}}</label>
    <select
      class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
      :value="modelValue"
      @input="$emit('update:modelValue',$event.target.value);$emit('change')"
    >
      <option value="">All</option>
      <option v-for="opt in options" :key="opt.value || opt" :value="opt.value || opt">{{ opt.label || opt }}</option>
    </select>
  </div>`
};

/* ---------- Refs & State ---------- */
const loading = ref(false);
const rows = ref([]);
const q = reactive({ page:1, perPage:10, search:"", year:String(new Date().getFullYear()), month:"", department_id:"", status:"" });
const page = reactive({ current:1,last:1,total:0,from:0,to:0,prev:false,next:false });
const modal = reactive({ open:false, mode:"create" });

const employees = ref([]);
const departments = ref([]);

const form = reactive({
  id:null,
  employee_id:"",
  year:String(new Date().getFullYear()),
  month:"01",
  basic_salary:0,
  allowances:0,
  overtime_hours:0,
  overtime_rate:0,
  deductions:0,
  tax_rate:0,
  notes:""
});

const viewRow = ref({});
const saving = ref(false);
const errorToast = ref("");

const years = Array.from({length:11},(_,i)=>new Date().getFullYear()-i);
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/* ---------- Utils ---------- */
const num = (n)=>Number(n||0).toLocaleString("id-ID");
const statusClass=(s)=>({
  draft:"bg-gray-100 text-gray-700",
  approved:"bg-yellow-100 text-yellow-700",
  paid:"bg-green-100 text-green-700"
}[s] || "bg-gray-50");

/* ---------- Computed ---------- */
const calc = computed(()=>{
  const overtime_pay = Number(form.overtime_hours||0) * Number(form.overtime_rate||0);
  const gross = Number(form.basic_salary||0) + Number(form.allowances||0) + overtime_pay;
  const preTax = Math.max(0, gross - Number(form.deductions||0));
  const tax_amount = Math.max(0, preTax * Number(form.tax_rate||0) / 100);
  const net_pay = Math.max(0, preTax - tax_amount);
  return { overtime_pay, gross, tax_amount, net_pay };
});

/* ---------- API ---------- */
const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:8000").replace(/\/+$/,'');
const api=()=>{
  const token=localStorage.getItem("token");
  const inst=axios.create({
    baseURL:`${API_BASE}/api`,
    headers:{ Accept:"application/json", ...(token?{Authorization:`Bearer ${token}`}:{}) }
  });
  inst.interceptors.response.use(r=>r,(err)=>{
    if(err?.response?.status===401){ localStorage.clear(); window.location.href="/auth/login"; }
    return Promise.reject(err);
  });
  return inst;
};

/* ---------- Loaders ---------- */
const reload=async()=>{
  loading.value = true;
  try{
    const {data}=await api().get("/payrolls",{params:q});
    const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
    rows.value = list.map(r=>({
      ...r,
      month: String(r.month).padStart(2,'0')
    }));

    Object.assign(page,{
      current: Number(data.current_page||1),
      last: Number(data.last_page||1),
      total: Number(data.total||list.length),
      from: Number(data.from|| (list.length?1:0)),
      to: Number(data.to|| list.length),
      prev: (data.current_page||1) > 1,
      next: (data.current_page||1) < (data.last_page||1)
    });
  }catch(e){
    errorToast.value = e?.response?.data?.message || "Failed to load payrolls";
  }finally{
    loading.value = false;
  }
};

const go=(p)=>{ q.page=Math.max(1,p); reload(); };

const loadEmployees=async()=>{
  try{
    const {data}=await api().get("/employees",{params:{per_page:1000}});
    employees.value = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  }catch{ employees.value=[]; }
};
const loadDepartments=async()=>{
  try{
    const {data}=await api().get("/departments",{params:{per_page:1000}});
    departments.value = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  }catch{ departments.value=[]; }
};

/* ---------- Actions ---------- */
const openCreate=()=>{ 
  modal.open=true; modal.mode="create";
  Object.assign(form,{ id:null, employee_id:"", year:String(new Date().getFullYear()), month:"01",
    basic_salary:0, allowances:0, overtime_hours:0, overtime_rate:0, deductions:0, tax_rate:0, notes:""
  });
};
const openEdit=(r)=>{ modal.open=true; modal.mode="edit"; Object.assign(form,{ ...r }); };
const openView=(r)=>{ modal.open=true; modal.mode="view"; viewRow.value = { ...r }; };

const toPayload=()=>({
  employee_id: Number(form.employee_id),
  year: Number(form.year),
  month: Number(form.month),
  basic_salary: Number(form.basic_salary||0),
  allowances: Number(form.allowances||0),
  overtime_hours: Number(form.overtime_hours||0),
  overtime_rate: Number(form.overtime_rate||0),
  deductions: Number(form.deductions||0),
  tax_rate: Number(form.tax_rate||0),
  notes: String(form.notes||"").trim() || null
});

const save=async()=>{
  // quick client-side checks
  if(!form.employee_id){ errorToast.value="Employee wajib dipilih."; return; }
  if(!form.year || !form.month){ errorToast.value="Period wajib diisi."; return; }
  saving.value = true;
  try{
    if(modal.mode==="create") await api().post("/payrolls", toPayload());
    else await api().put(`/payrolls/${form.id}`, toPayload());
    Swal.fire({toast:true,position:"top-end",icon:"success",title:"Saved",showConfirmButton:false,timer:1500});
    modal.open=false; reload();
  }catch(e){
    errorToast.value = e?.response?.data?.message || "Save failed";
    setTimeout(()=>errorToast.value="",2000);
  }finally{
    saving.value=false;
  }
};

const approve=async(r)=>{
  const res=await Swal.fire({title:`Approve ${r.employee_name}?`,icon:"question",showCancelButton:true});
  if(!res.isConfirmed) return;
  try{ await api().post(`/payrolls/${r.id}/approve`); reload(); Swal.fire({toast:true,icon:"success",title:"Approved",timer:1500,showConfirmButton:false}); }
  catch(e){ errorToast.value=e?.response?.data?.message || "Approve failed"; }
};

const pay=async(r)=>{
  const res=await Swal.fire({title:`Mark ${r.employee_name} paid?`,icon:"question",showCancelButton:true});
  if(!res.isConfirmed) return;
  try{ await api().post(`/payrolls/${r.id}/pay`); reload(); Swal.fire({toast:true,icon:"success",title:"Paid",timer:1500,showConfirmButton:false}); }
  catch(e){ errorToast.value=e?.response?.data?.message || "Pay failed"; }
};

const confirmDelete=async(r)=>{
  const res=await Swal.fire({title:`Delete ${r.employee_name}?`,text:"Cannot be undone",icon:"warning",showCancelButton:true});
  if(!res.isConfirmed) return;
  try{ await api().delete(`/payrolls/${r.id}`); reload(); Swal.fire({toast:true,icon:"success",title:"Deleted",timer:1500,showConfirmButton:false}); }
  catch(e){ errorToast.value=e?.response?.data?.message || "Delete failed"; }
};

/* ---------- Lifecycle ---------- */
onMounted(async()=>{ await loadDepartments(); await loadEmployees(); await reload(); });
</script>

<style scoped>
/* feel free to tweak */
</style>
