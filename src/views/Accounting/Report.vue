<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">accounting</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Reports</h1>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 border-b dark:border-gray-700 w-full lg:w-auto">
        <button
          v-for="t in tabs"
          :key="t.key"
          @click="activeTab = t.key"
          class="px-4 py-2 -mb-[1px] border-b-2"
          :class="activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500'"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <!-- ===================== Trial Balance ===================== -->
    <div v-if="activeTab==='tb'" class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <!-- Filters -->
      <div class="px-5 py-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3 w-full">
          <div>
            <label class="block text-xs mb-1">Company ID</label>
            <input v-model.number="tb.f.company_id" type="number" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div>
            <label class="block text-xs mb-1">Date From</label>
            <input v-model="tb.f.date_from" type="date" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div>
            <label class="block text-xs mb-1">Date To</label>
            <input v-model="tb.f.date_to" type="date" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div class="md:col-span-2 flex items-end gap-2">
            <button @click="loadTB" class="px-4 py-2 border rounded dark:border-gray-700">Run</button>
            <button @click="exportTBCsv" class="px-4 py-2 border rounded dark:border-gray-700">Export CSV</button>
          </div>
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ tb.rows.length }} rows
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">Code</th>
              <th class="px-6 py-3">Name</th>
              <th class="px-6 py-3">Type</th>
              <th class="px-6 py-3 text-right">Debit</th>
              <th class="px-6 py-3 text-right">Credit</th>
              <th class="px-6 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody class="text-gray-700 dark:text-gray-200">
            <tr v-for="r in tb.rows" :key="r.account_id" class="border-b dark:border-gray-700">
              <td class="px-6 py-3 font-mono">{{ r.code }}</td>
              <td class="px-6 py-3">{{ r.name }}</td>
              <td class="px-6 py-3 capitalize">{{ r.type }}</td>
              <td class="px-6 py-3 text-right">{{ money(r.debit) }}</td>
              <td class="px-6 py-3 text-right">{{ money(r.credit) }}</td>
              <td class="px-6 py-3 text-right">{{ money(r.balance) }}</td>
            </tr>
            <tr v-if="!loading && !tb.rows.length">
              <td colspan="6" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
          <tfoot v-if="tb.rows.length">
            <tr class="font-semibold bg-gray-50/70 dark:bg-gray-900/30">
              <td class="px-6 py-3" colspan="3">TOTAL</td>
              <td class="px-6 py-3 text-right">{{ money(tbTotals.debit) }}</td>
              <td class="px-6 py-3 text-right">{{ money(tbTotals.credit) }}</td>
              <td class="px-6 py-3 text-right">{{ money(tbTotals.balance) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- ===================== General Ledger ===================== -->
    <div v-if="activeTab==='gl'" class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <!-- Filters -->
      <div class="px-5 py-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div class="grid grid-cols-1 md:grid-cols-6 gap-3 w-full">
          <div class="md:col-span-2">
            <label class="block text-xs mb-1">Account</label>
            <div class="flex gap-2">
              <select v-model.number="gl.f.account_id" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700">
                <option :value="null">— pilih akun —</option>
                <option v-for="a in gl.accounts" :key="a.id" :value="a.id">{{ a.code }} — {{ a.name }}</option>
              </select>
              <input v-model="gl.accountSearch" placeholder="Cari akun…" class="w-40 border rounded px-2 py-2 dark:bg-gray-800 dark:border-gray-700"/>
              <button class="px-3 py-2 border rounded dark:border-gray-700" @click="filterAccountList">Filter</button>
            </div>
          </div>
          <div>
            <label class="block text-xs mb-1">Company ID</label>
            <input v-model.number="gl.f.company_id" type="number" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div>
            <label class="block text-xs mb-1">Date From</label>
            <input v-model="gl.f.date_from" type="date" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div>
            <label class="block text-xs mb-1">Date To</label>
            <input v-model="gl.f.date_to" type="date" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div class="flex items-center gap-2">
            <input id="ob" type="checkbox" v-model="gl.f.include_opening" class="h-4 w-4"/>
            <label for="ob" class="text-sm">Include Opening</label>
          </div>

          <div class="md:col-span-6 flex items-end gap-2">
            <select v-model.number="gl.f.per_page" class="border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700">
              <option :value="0">No pagination</option>
              <option :value="20">20 / page</option>
              <option :value="50">50 / page</option>
              <option :value="100">100 / page</option>
            </select>
            <button @click="loadGL( gl.meta.current_page || 1 )" class="px-4 py-2 border rounded dark:border-gray-700">Run</button>
            <button @click="exportGLCsv" class="px-4 py-2 border rounded dark:border-gray-700">Export CSV</button>
          </div>
        </div>

        <div class="text-sm text-gray-500 dark:text-gray-400">
          <template v-if="gl.meta.total">
            {{ gl.meta.current_page }} / {{ gl.meta.last_page }} • total {{ nf(gl.meta.total) }}
          </template>
        </div>
      </div>

      <!-- Opening -->
      <div v-if="gl.opening !== null" class="px-5 text-sm text-gray-600 dark:text-gray-300">
        Opening Balance: <span class="font-medium">{{ money(gl.opening) }}</span>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto mt-2">
        <table class="min-w-full text-sm text-left">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">Date</th>
              <th class="px-6 py-3">Number</th>
              <th class="px-6 py-3">Ref</th>
              <th class="px-6 py-3">Label</th>
              <th class="px-6 py-3 text-right">Debit</th>
              <th class="px-6 py-3 text-right">Credit</th>
            </tr>
          </thead>
          <tbody class="text-gray-700 dark:text-gray-200">
            <tr v-for="(r,i) in gl.rows" :key="i" class="border-b dark:border-gray-700">
              <td class="px-6 py-3">{{ r.date }}</td>
              <td class="px-6 py-3 font-mono">{{ r.number || '—' }}</td>
              <td class="px-6 py-3">{{ r.ref || '—' }}</td>
              <td class="px-6 py-3">{{ r.label || '—' }}</td>
              <td class="px-6 py-3 text-right">{{ money(r.debit) }}</td>
              <td class="px-6 py-3 text-right">{{ money(r.credit) }}</td>
            </tr>
            <tr v-if="!loading && !gl.rows.length">
              <td colspan="6" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
          <tfoot v-if="gl.rows.length">
            <tr class="font-semibold bg-gray-50/70 dark:bg-gray-900/30">
              <td class="px-6 py-3" colspan="4">TOTAL</td>
              <td class="px-6 py-3 text-right">{{ money(glTotals.debit) }}</td>
              <td class="px-6 py-3 text-right">{{ money(glTotals.credit) }}</td>
            </tr>
            <tr>
              <td class="px-6 py-2 text-sm" colspan="6">
                Ending Balance:
                <span class="font-semibold">{{ money(glTotals.balance) }}</span>
                <span class="text-gray-500"> (opening {{ money(gl.opening || 0) }} + debit {{ money(glTotals.debit) }} − credit {{ money(glTotals.credit) }})</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="gl.meta.last_page && gl.meta.last_page > 1" class="p-4 flex items-center justify-between text-sm">
        <div>Page {{ gl.meta.current_page }} / {{ gl.meta.last_page }}</div>
        <div class="flex gap-2">
          <button :disabled="gl.meta.current_page<=1" @click="loadGL(gl.meta.current_page-1)" class="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <button :disabled="gl.meta.current_page>=gl.meta.last_page" @click="loadGL(gl.meta.current_page+1)" class="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="fixed left-0 right-0 top-0 h-1 bg-primary animate-pulse"></div>
  </div>
</template>

<script>
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import { accountingApi } from '@/lib/accountingApi' // helper axios modular

export default {
  name: 'AccountingReports',
  data(){
    return {
      loading: false,
      tabs: [
        { key: 'tb', label: 'Trial Balance' },
        { key: 'gl', label: 'General Ledger' },
      ],
      activeTab: 'tb',

      // Trial Balance state
      tb: {
        f: { company_id: null, date_from: '', date_to: '' },
        rows: [],
      },

      // General Ledger state
      gl: {
        f: { account_id: null, company_id: null, date_from: '', date_to: '', include_opening: true, per_page: 50, page: 1 },
        rows: [],
        opening: null,
        meta: { current_page: 1, last_page: 1, total: 0 },
        accounts: [],
        allAccounts: [],
        accountSearch: '',
      },
    }
  },
  computed: {
    tbTotals(){
      const d = this.tb.rows.reduce((s,x)=>s + Number(x.debit||0), 0)
      const c = this.tb.rows.reduce((s,x)=>s + Number(x.credit||0), 0)
      const b = this.tb.rows.reduce((s,x)=>s + Number(x.balance||0), 0)
      return { debit: d, credit: c, balance: b }
    },
    glTotals(){
      const d = this.gl.rows.reduce((s,x)=>s + Number(x.debit||0), 0)
      const c = this.gl.rows.reduce((s,x)=>s + Number(x.credit||0), 0)
      const bal = Number((Number(this.gl.opening||0) + d - c).toFixed(2))
      return { debit: d, credit: c, balance: bal }
    },
  },
  mounted(){
    // default jalankan TB
    this.loadTB()
    // muat akun untuk GL dropdown
    this.fetchAccounts()
  },
  methods: {
    api(){ return accountingApi() },
    nf(v){ try { return new Intl.NumberFormat().format(v ?? 0) } catch { return v } },
    money(n){ return (Number(n||0)).toLocaleString(undefined,{ minimumFractionDigits:2, maximumFractionDigits:2 }) },

    alert(icon, title, text){ return Swal.fire({ icon, title, text }) },
    toast(icon, title){
      const T = Swal.mixin({ toast:true, position:'top-end', showConfirmButton:false, timer:1600, timerProgressBar:true })
      T.fire({ icon, title })
    },

    /* ================= TB ================= */
    async loadTB(){
      this.loading = true
      try{
        const { data } = await this.api().get('/reports/trial-balance', { params: { ...this.tb.f } })
        // server sudah mengembalikan array rows final
        this.tb.rows = Array.isArray(data) ? data : (data?.data || [])
      } catch(e){
        this.alert('error','Trial Balance gagal', e?.response?.data?.message || e.message)
      } finally { this.loading = false }
    },
    exportTBCsv(){
      const header = ['code','name','type','debit','credit','balance']
      const lines = this.tb.rows.map(r => [r.code, r.name, r.type, r.debit, r.credit, r.balance])
      const csv = [header, ...lines, ['TOTAL','','',this.tbTotals.debit,this.tbTotals.credit,this.tbTotals.balance]]
        .map(row => row.map(v => `"${String(v??'').replace(/"/g,'""')}"`).join(','))
        .join('\n')
      this.downloadText(csv, `trial_balance_${this.tb.f.date_from||'all'}_${this.tb.f.date_to||'all'}.csv`)
    },

    /* ================= GL ================= */
    async fetchAccounts(){
      // ambil banyak akun untuk dropdown
      try{
        const res = await this.api().get('/accounts', { params: { per_page: 500, page: 1 } })
        const rows = this.unpackRows(res?.data)
        this.gl.allAccounts = rows
        this.gl.accounts = rows
      } catch(e){ /* ignore */ }
    },
    filterAccountList(){
      const s = (this.gl.accountSearch||'').toLowerCase().trim()
      if(!s) { this.gl.accounts = this.gl.allAccounts; return }
      this.gl.accounts = this.gl.allAccounts.filter(a =>
        String(a.code ?? '').toLowerCase().includes(s) ||
        String(a.name ?? '').toLowerCase().includes(s)
      )
    },
    unpackRows(payload){
      const p = payload?.data
      if (Array.isArray(p?.data)) return p.data
      if (Array.isArray(p)) return p
      return []
    },
    async loadGL(page=1){
      if(!this.gl.f.account_id){
        return this.alert('warning','Validasi','Pilih akun terlebih dahulu.')
      }
      this.loading = true
      try{
        const params = { ...this.gl.f, page }
        const { data } = await this.api().get('/reports/general-ledger', { params })

        // response shape:
        // - jika per_page > 0: { account, opening, rows, totals, meta }
        // - jika per_page = 0: { account, opening, rows, totals }
        this.gl.opening = data?.opening ?? 0
        this.gl.rows = Array.isArray(data?.rows) ? data.rows : []
        this.gl.meta = data?.meta || { current_page: 1, last_page: 1, total: this.gl.rows.length }
      } catch(e){
        this.alert('error','General Ledger gagal', e?.response?.data?.message || e.message)
      } finally { this.loading = false }
    },
    exportGLCsv(){
      const header = ['date','number','ref','label','debit','credit']
      const lines = this.gl.rows.map(r => [r.date, r.number, r.ref, r.label, r.debit, r.credit])
      const totalLine = ['TOTAL','','','', this.glTotals.debit, this.glTotals.credit]
      const endLine = ['ENDING BALANCE','','','', '', this.glTotals.balance]
      const csv = [header, ...lines, totalLine, endLine]
        .map(row => row.map(v => `"${String(v??'').replace(/"/g,'""')}"`).join(','))
        .join('\n')
      this.downloadText(csv, `general_ledger_${this.gl.f.account_id}_${this.gl.f.date_from||'all'}_${this.gl.f.date_to||'all'}.csv`)
    },

    /* ====== util ====== */
    downloadText(content, filename){
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
    },
  }
}
</script>

<style scoped>
:root { --primary: #8245ec; }
.bg-primary { background-color: var(--primary); }
.text-primary { color: var(--primary); }
.border-primary { border-color: var(--primary); }
</style>
