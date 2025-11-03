<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">hr • payroll</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Salary Rules</h1>
      </div>

      <div class="flex gap-2 w-full lg:w-auto">
        <select v-model="q.structure_id" @change="reload" class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
          <option value="">All Structures</option>
          <option v-for="s in structures" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <input v-model="q.search" @keyup.enter="reload" class="flex-1 lg:flex-none border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="Search code/name…" />
        <button @click="reload" class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5">Search</button>
        <button @click="openCreate" class="inline-flex items-center justify-center gap-2 bg-primary text-white rounded py-2.5 px-5 hover:bg-primary/90">New Rule</button>
      </div>
    </div>

    <!-- Card -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <!-- Filters -->
      <div class="px-5 py-4 flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
        <div class="flex gap-3 flex-1">
          <div class="w-40">
            <label class="block text-sm dark:text-gray-300 mb-1">Per page</label>
            <select v-model.number="q.perPage" @change="reload" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option v-for="n in [10,20,50]" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">{{ page.from || 0 }}–{{ page.to || 0 }} of {{ page.total || 0 }}</div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">Code</th>
              <th class="px-6 py-3">Name</th>
              <th class="px-6 py-3">Type</th>
              <th class="px-6 py-3">Compute</th>
              <th class="px-6 py-3">Amount/Base</th>
              <th class="px-6 py-3">Structure</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <td class="px-6 py-3 font-mono">{{ r.code || '-' }}</td>
              <td class="px-6 py-3">{{ r.name }}</td>
              <td class="px-6 py-3">{{ r.type }}</td>
              <td class="px-6 py-3">{{ r.compute_method }}</td>
              <td class="px-6 py-3">
                <span v-if="r.compute_method==='fixed'">Rp{{ formatNumber(r.amount) }}</span>
                <span v-else-if="r.compute_method==='percentage'">{{ r.percentage }}% of {{ r.base_rule_code || r.base_rule_name || 'Basic' }}</span>
                <span v-else>{{ r.formula || '-' }}</span>
              </td>
              <td class="px-6 py-3">{{ getStructureName(r.structure_id) || '-' }}</td>
              <td class="px-6 py-3 text-right space-x-2">
                <button @click="openEdit(r)" class="px-2 py-1 rounded border dark:border-gray-600">Edit</button>
                <button @click="confirmDelete(r)" class="px-2 py-1 rounded border dark:border-gray-600" :disabled="saving">Delete</button>
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
        <button :disabled="!page.prev" @click="go(page.current-1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">Prev</button>
        <div class="text-sm text-gray-500 dark:text-gray-400">Page {{ page.current || 1 }} / {{ page.last || 1 }}</div>
        <button :disabled="!page.next" @click="go(page.current+1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">Next</button>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open=false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-3xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">{{ modal.mode==='create' ? 'New Rule' : 'Edit Rule' }}</h3>

        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Code</label>
            <input v-model="form.code" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Name<span class="text-red-500">*</span></label>
            <input v-model="form.name" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Structure<span class="text-red-500">*</span></label>
            <select v-model="form.structure_id" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option value="">-- choose --</option>
              <option v-for="s in structures" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Type</label>
            <select v-model="form.type" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option value="allowance">Allowance</option>
              <option value="deduction">Deduction</option>
            </select>
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Compute Method</label>
            <select v-model="form.compute_method" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
              <option value="fixed">Fixed</option>
              <option value="percentage">Percentage</option>
              <option value="formula">Formula</option>
            </select>
          </div>

          <div v-if="form.compute_method==='fixed'">
            <label class="block text-sm mb-1 dark:text-gray-300">Amount</label>
            <input v-model.number="form.amount" type="number" min="0" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
          </div>

          <div v-if="form.compute_method==='percentage'">
            <label class="block text-sm mb-1 dark:text-gray-300">Percentage (%)</label>
            <input v-model.number="form.percentage" type="number" min="0" max="100" step="0.01" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
            <label class="block text-sm mt-2 mb-1 dark:text-gray-300">Base Rule (optional)</label>
            <input v-model="form.base_rule_code" placeholder="e.g. BASIC" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
          </div>

          <div class="md:col-span-2" v-if="form.compute_method==='formula'">
            <label class="block text-sm mb-1 dark:text-gray-300">Formula</label>
            <input v-model="form.formula" placeholder="e.g. BASIC * 0.1 + TRANSPORT" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Notes</label>
            <textarea v-model="form.note" rows="2" class="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"></textarea>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open=false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="save" :disabled="saving" class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">{{ saving ? 'Saving…' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <div v-if="error" class="fixed bottom-4 right-4 bg-red-600 text-white text-sm px-4 py-3 rounded shadow">{{ error }}</div>
  </div>
</template>

<script>
import axios from "axios";
import Swal from "sweetalert2";

export default {
  name: "SalaryRules",
  data(){
    return {
      loading:false, rows:[],
      q:{ page:1, perPage:10, search:"", structure_id:"" },
      page:{ current:1, last:1, total:0, from:0, to:0, prev:false, next:false },
      structures:[],
      modal:{ open:false, mode:"create" },
      form:{ id:null, code:"", name:"", structure_id:"", type:"allowance", compute_method:"fixed", amount:0, percentage:null, base_rule_code:"", formula:"", note:"" },
      saving:false, error:""
    };
  },
  mounted(){ this.loadStructures().then(()=>this.reload()); },
  methods:{
    resolveBaseUrl(){ const raw=import.meta?.env?.VITE_API_BASE||"http://localhost:8000"; return String(raw).trim().replace(/\/+$/,''); },
    api(){ const token=localStorage.getItem("token"); return axios.create({ baseURL:`${this.resolveBaseUrl()}/api/hr`, headers:{Accept:"application/json", ...(token?{Authorization:`Bearer ${token}`}:{})}}); },
    formatNumber(n){ return Number(n||0).toLocaleString("id-ID"); },
    getStructureName(id){ const f=this.structures.find(s=>String(s.id)===String(id)); return f?.name||""; },
    cleanParams(p){ const x={...p}; if(!String(x.search||"").trim()) delete x.search; if(!String(x.structure_id||"")) delete x.structure_id; return x; },

    async loadStructures(){
      try{
        const {data}=await this.api().get("/salary-structures",{params:{per_page:1000}});
        this.structures = Array.isArray(data?.data)?data.data:(Array.isArray(data)?data:[]);
      }catch{ this.structures=[]; }
    },

    async reload(){
      this.loading=true; this.error="";
      try{
        const {data}=await this.api().get("/salary-rules",{ params:this.cleanParams({ page:this.q.page, per_page:this.q.perPage, search:this.q.search, structure_id:this.q.structure_id })});
        const rows = Array.isArray(data?.data)?data.data:(Array.isArray(data)?data:[]);
        this.rows = rows;
        this.page = {
          current:+(data.current_page||1), last:+(data.last_page||1),
          total:+(data.total||this.rows.length), from:+(data.from||(this.rows.length?1:0)),
          to:+(data.to||this.rows.length), prev:+(data.current_page||1)>1, next:+(data.current_page||1)<+(data.last_page||1)
        };
      }catch(e){ this.error=e?.response?.data?.message || "Failed to load rules"; }
      finally{ this.loading=false; }
    },
    go(p){ this.q.page=Math.max(1,p); this.reload(); },
    openCreate(){ this.modal={open:true,mode:'create'}; this.error=""; this.form={ id:null, code:"", name:"", structure_id:this.q.structure_id||"", type:"allowance", compute_method:"fixed", amount:0, percentage:null, base_rule_code:"", formula:"", note:"" }; },
    openEdit(r){ this.modal={open:true,mode:'edit'}; this.error=""; this.form={ id:r.id, code:r.code||"", name:r.name||"", structure_id:r.structure_id||"", type:r.type||"allowance", compute_method:r.compute_method||"fixed", amount:Number(r.amount||0), percentage:r.percentage, base_rule_code:r.base_rule_code||"", formula:r.formula||"", note:r.note||"" }; },
    toPayload(){ const t=v=>typeof v==="string"?v.trim():v; const p={ code:t(this.form.code)||null, name:t(this.form.name), structure_id:this.form.structure_id?Number(this.form.structure_id):null, type:this.form.type, compute_method:this.form.compute_method, note:t(this.form.note)||null }; if(p.compute_method==='fixed') p.amount=Number(this.form.amount||0); if(p.compute_method==='percentage'){ p.percentage=this.form.percentage==null?0:Number(this.form.percentage); p.base_rule_code=t(this.form.base_rule_code)||null; } if(p.compute_method==='formula') p.formula=t(this.form.formula)||null; return p; },
    async save(){
      if(!this.form.structure_id){ this.error="Structure wajib dipilih."; return; }
      if(!String(this.form.name||"").trim()){ this.error="Name wajib diisi."; return; }
      this.saving=true; this.error="";
      try{
        const payload=this.toPayload();
        if(this.modal.mode==='create') await this.api().post("/salary-rules", payload);
        else await this.api().put(`/salary-rules/${this.form.id}`, payload);
        this.modal.open=false; this.reload();
      }catch(e){ this.error=e?.response?.data?.message || "Failed to save rule"; }
      finally{ this.saving=false; }
    },
    async confirmDelete(r){
      const res=await Swal.fire({title:`Hapus "${r.name}"?`,icon:"warning",showCancelButton:true,confirmButtonText:"Yes, delete"});
      if(!res.isConfirmed) return;
      this.saving=true; this.error="";
      try{ await this.api().delete(`/salary-rules/${r.id}`); this.reload(); }
      catch(e){ this.error=e?.response?.data?.message || "Failed to delete"; }
      finally{ this.saving=false; }
    }
  }
}
</script>
