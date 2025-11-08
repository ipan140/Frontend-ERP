<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">accounting</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Journal Entries (Moves)</h1>
      </div>

      <div class="flex flex-wrap gap-2 w-full lg:w-auto">
        <select v-model="flt.journal_id" @change="load(1)" class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
          <option value="">All journals</option>
          <option v-for="j in journals" :key="j.id" :value="j.id">{{ j.code }} — {{ j.name }}</option>
        </select>
        <select v-model="flt.status" @change="load(1)" class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200">
          <option value="">Any status</option>
          <option value="draft">draft</option>
          <option value="posted">posted</option>
        </select>
        <input type="date" v-model="flt.date_from" class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
        <input type="date" v-model="flt.date_to"   class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200" />
        <input v-model="search" @keyup.enter="load(1)" placeholder="Search ref/memo…" class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"/>
        <button @click="load(1)" class="px-4 py-2 rounded border dark:border-gray-700">Apply</button>
        <button @click="openCreate" class="bg-primary text-white rounded px-4 py-2">New Entry</button>
      </div>
    </div>

    <!-- Table -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md overflow-x-auto">
      <table class="min-w-full text-sm text-left">
        <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th class="px-6 py-3">Date</th>
            <th class="px-6 py-3">Journal</th>
            <th class="px-6 py-3">Ref</th>
            <th class="px-6 py-3">Memo</th>
            <th class="px-6 py-3 text-right">Debit</th>
            <th class="px-6 py-3 text-right">Credit</th>
            <th class="px-6 py-3">Status</th>
            <th class="px-6 py-3 w-32"></th>
          </tr>
        </thead>
        <tbody class="text-gray-700 dark:text-gray-200">
          <tr v-for="m in rows" :key="m.id" class="border-b dark:border-gray-700">
            <td class="px-6 py-3">{{ m.date }}</td>
            <td class="px-6 py-3">{{ m.journal?.code || m.journal_id }}</td>
            <td class="px-6 py-3">{{ m.ref || '—' }}</td>
            <td class="px-6 py-3">{{ m.memo || '—' }}</td>
            <td class="px-6 py-3 text-right">{{ money(sum(m.lines,'debit')) }}</td>
            <td class="px-6 py-3 text-right">{{ money(sum(m.lines,'credit')) }}</td>
            <td class="px-6 py-3 capitalize">
              <span :class="m.status==='posted' ? 'text-green-600' : 'text-yellow-600'">{{ m.status }}</span>
            </td>
            <td class="px-6 py-3">
              <div class="flex gap-2">
                <button class="px-3 py-1 border rounded" @click="openEdit(m)" :disabled="m.status==='posted'">Edit</button>
                <button class="px-3 py-1 border rounded text-red-600" @click="confirmDelete(m)" :disabled="m.status==='posted'">Delete</button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && !rows.length">
            <td colspan="8" class="px-6 py-6 text-center text-gray-400">No data</td>
          </tr>
        </tbody>
      </table>

      <!-- Footer / Pagination -->
      <div class="p-4 flex items-center justify-between text-sm">
        <div class="text-gray-500 dark:text-gray-400">
          Page {{ meta.current_page }} / {{ meta.last_page }}
          <span v-if="meta.total"> • total {{ nf(meta.total) }}</span>
        </div>
        <div class="flex gap-2">
          <button :disabled="meta.current_page<=1" @click="load(meta.current_page-1)" class="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <button :disabled="meta.current_page>=meta.last_page" @click="load(meta.current_page+1)" class="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>

    <!-- Modal: Create/Edit Move -->
    <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="closeModal"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-4xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">
          {{ modal.mode==='create' ? 'Create Entry' : 'Edit Entry' }}
        </h3>

        <div class="grid md:grid-cols-4 gap-3">
          <div>
            <label class="block text-sm mb-1">Company ID</label>
            <input v-model.number="form.company_id" type="number" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm mb-1">Journal</label>
            <select v-model.number="form.journal_id" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700">
              <option :value="null">— pilih —</option>
              <option v-for="j in journals" :key="j.id" :value="j.id">{{ j.code }} — {{ j.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm mb-1">Date</label>
            <input v-model="form.date" type="date" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div class="md:col-span-3">
            <label class="block text-sm mb-1">Reference</label>
            <input v-model="form.ref" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" placeholder="optional ref"/>
          </div>
        </div>

        <!-- Lines editor -->
        <div class="mt-4">
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-semibold dark:text-gray-200">Lines</h4>
            <div class="flex items-center gap-2">
              <input v-model="accountSearch" placeholder="Cari akun…" class="border rounded px-3 py-1 text-sm dark:bg-gray-800 dark:border-gray-700" />
              <button class="px-3 py-1 rounded border dark:border-gray-700" @click="addLine">+ Add line</button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th class="px-3 py-2">Account</th>
                  <th class="px-3 py-2">Label</th>
                  <th class="px-3 py-2 text-right">Debit</th>
                  <th class="px-3 py-2 text-right">Credit</th>
                  <th class="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(l,idx) in form.lines" :key="idx" class="border-b dark:border-gray-700">
                  <td class="px-3 py-2">
                    <select v-model.number="l.account_id" class="w-64 border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-700">
                      <option :value="null">— pilih akun —</option>
                      <option
                        v-for="a in filteredAccounts"
                        :key="a.id"
                        :value="a.id"
                      >{{ a.code }} — {{ a.name }}</option>
                    </select>
                  </td>
                  <td class="px-3 py-2">
                    <input v-model="l.label" class="w-full border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-700"/>
                  </td>
                  <td class="px-3 py-2 text-right">
                    <input v-model.number="l.debit" type="number" min="0" step="0.01"
                      @input="onAmountInput(l,'debit')"
                      class="w-32 text-right border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-700"/>
                  </td>
                  <td class="px-3 py-2 text-right">
                    <input v-model.number="l.credit" type="number" min="0" step="0.01"
                      @input="onAmountInput(l,'credit')"
                      class="w-32 text-right border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-700"/>
                  </td>
                  <td class="px-3 py-2 text-right">
                    <button class="px-2 py-1 border rounded text-red-600" @click="removeLine(idx)">Del</button>
                  </td>
                </tr>

                <tr v-if="!form.lines.length">
                  <td colspan="5" class="px-3 py-4 text-center text-gray-400">No lines</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="font-medium">
                  <td class="px-3 py-2" colspan="2">Total</td>
                  <td class="px-3 py-2 text-right">{{ money(totalDebit) }}</td>
                  <td class="px-3 py-2 text-right">{{ money(totalCredit) }}</td>
                  <td></td>
                </tr>
                <tr>
                  <td class="px-3 py-1 text-sm" colspan="5">
                    <span :class="isBalanced ? 'text-green-600' : 'text-red-600'">
                      {{ isBalanced ? 'Balanced' : 'Not balanced' }}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="mt-4 text-right flex gap-2 justify-end">
          <button @click="closeModal" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="submit" class="px-4 py-2 rounded bg-primary text-white" :disabled="!canSubmit">
            {{ modal.mode==='create' ? 'Create' : 'Save' }}
          </button>
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
  name: 'AccountingMoves',
  data(){
    return {
      loading: false,
      // list
      rows: [],
      meta: { current_page: 1, last_page: 1, total: 0 },
      search: '',
      flt: { journal_id: '', status: '', date_from: '', date_to: '' },

      // refs for dropdowns
      journals: [],
      accounts: [],
      accountSearch: '',

      // modal
      modal: { open: false, mode: 'create', editingId: null },
      form: {
        company_id: null,
        journal_id: null,
        date: new Date().toISOString().slice(0,10),
        ref: '',
        lines: [],
      },
    }
  },
  computed: {
    filteredAccounts(){
      const s = this.accountSearch.trim().toLowerCase()
      if(!s) return this.accounts
      return this.accounts.filter(a =>
        String(a.code ?? '').toLowerCase().includes(s) ||
        String(a.name ?? '').toLowerCase().includes(s)
      )
    },
    totalDebit(){ return this.form.lines.reduce((sum,l)=>sum + Number(l.debit||0), 0) },
    totalCredit(){ return this.form.lines.reduce((sum,l)=>sum + Number(l.credit||0), 0) },
    isBalanced(){ return Number(this.totalDebit.toFixed(2)) === Number(this.totalCredit.toFixed(2)) && this.totalDebit>0 },
    canSubmit(){
      if(!this.form.company_id || !this.form.journal_id || !this.form.date) return false
      if(this.form.lines.length < 2) return false
      if(!this.isBalanced) return false
      // each line: one side only & account chosen
      return this.form.lines.every(l=>{
        const d = Number(l.debit||0), c = Number(l.credit||0)
        const oneSide = (d>0 && c===0) || (c>0 && d===0)
        return l.account_id && oneSide
      })
    }
  },
  mounted(){
    this.load(1)
    this.loadRefs()
  },
  methods: {
    api(){ return accountingApi() },
    nf(v){ try { return new Intl.NumberFormat().format(v ?? 0) } catch { return v } },
    money(n){ return (Number(n||0)).toLocaleString(undefined,{ minimumFractionDigits:2, maximumFractionDigits:2 }) },
    sum(lines, key){ return (lines||[]).reduce((s,l)=>s + Number(l?.[key]||0), 0) },

    unpackRows(payload){
      const p = payload?.data
      if (Array.isArray(p?.data)) return p.data
      if (Array.isArray(p)) return p
      return []
    },
    unpackMeta(payload){
      const p = payload?.data
      return {
        current_page: p?.current_page ?? 1,
        last_page: p?.last_page ?? 1,
        total: p?.total ?? (Array.isArray(p) ? p.length : 0),
      }
    },

    async load(page=1){
      this.loading = true
      try{
        const params = {
          page, per_page: 20,
          journal_id: this.flt.journal_id || undefined,
          status: this.flt.status || undefined,
          date_from: this.flt.date_from || undefined,
          date_to: this.flt.date_to || undefined,
        }
        const { data } = await this.api().get('/moves', { params })
        let rows = this.unpackRows(data)

        // client-side search over ref/memo
        if(this.search.trim()){
          const s = this.search.trim().toLowerCase()
          rows = rows.filter(m =>
            String(m.ref ?? '').toLowerCase().includes(s) ||
            String(m.memo ?? '').toLowerCase().includes(s)
          )
        }

        this.rows = rows
        this.meta = this.unpackMeta(data)
      } catch(e){
        this.alert('error', 'Load Moves gagal', e?.response?.data?.message || e.message)
      } finally { this.loading = false }
    },

    async loadRefs(){
      try {
        const [jr, ac] = await Promise.all([
          this.api().get('/journals', { params: { per_page: 200, page: 1 } }),
          this.api().get('/accounts', { params: { per_page: 500, page: 1 } }),
        ])
        this.journals = this.unpackRows(jr?.data)
        this.accounts = this.unpackRows(ac?.data)
      } catch(e){ /* ignore */ }
    },

    openCreate(){
      this.modal = { open: true, mode: 'create', editingId: null }
      this.form = {
        company_id: null,
        journal_id: null,
        date: new Date().toISOString().slice(0,10),
        ref: '',
        lines: [
          { account_id: null, label: '', debit: 0, credit: 0 },
          { account_id: null, label: '', debit: 0, credit: 0 },
        ],
      }
      this.accountSearch = ''
    },
    openEdit(row){
      if(row.status==='posted'){
        return this.alert('info','Locked','Posted entry is locked.')
      }
      this.modal = { open: true, mode: 'edit', editingId: row.id }
      this.form = {
        company_id: row.company_id ?? null,
        journal_id: row.journal_id ?? null,
        date: row.date ?? new Date().toISOString().slice(0,10),
        ref: row.ref ?? '',
        lines: (row.lines || []).map(l=>({
          account_id: l.account_id ?? l.account?.id ?? null,
          label: l.label ?? '',
          debit: Number(l.debit||0),
          credit: Number(l.credit||0),
        })),
      }
      this.accountSearch = ''
    },
    closeModal(){ this.modal.open = false },

    addLine(){ this.form.lines.push({ account_id: null, label:'', debit: 0, credit: 0 }) },
    removeLine(i){ this.form.lines.splice(i,1) },

    onAmountInput(line, key){
      // force one side only
      if(key==='debit'){
        line.debit = Number(line.debit||0)
        if(line.debit>0) line.credit = 0
      } else {
        line.credit = Number(line.credit||0)
        if(line.credit>0) line.debit = 0
      }
    },

    async submit(){
      if(!this.canSubmit){
        return this.alert('warning', 'Validasi', 'Lengkapi header & lines, pastikan balanced.')
      }
      this.loading = true
      try{
        const payload = {
          company_id: Number(this.form.company_id),
          journal_id: Number(this.form.journal_id),
          date: this.form.date,
          ref: this.form.ref || null,
          lines: this.form.lines.map(l=>({
            account_id: Number(l.account_id),
            label: l.label || null,
            debit: Number(l.debit||0),
            credit: Number(l.credit||0),
          })),
        }
        if(this.modal.mode==='create'){
          await this.api().post('/moves', payload)
          this.toast('success','Entry created')
        } else {
          await this.api().put(`/moves/${this.modal.editingId}`, payload)
          this.toast('success','Entry updated')
        }
        this.closeModal()
        await this.load(this.meta.current_page)
      } catch(e){
        this.alert('error', 'Simpan gagal', e?.response?.data?.message || e.message)
      } finally { this.loading = false }
    },

    async confirmDelete(row){
      const res = await Swal.fire({
        icon:'warning', title:'Delete entry?', text:`#${row.id} • ${row.date} • ${row.ref||'-'}`,
        confirmButtonText:'Yes, delete', showCancelButton:true
      })
      if(!res.isConfirmed) return
      this.loading = true
      try{
        await this.api().delete(`/moves/${row.id}`)
        this.toast('success','Entry deleted')
        await this.load(this.meta.current_page)
      } catch(e){
        this.alert('error','Delete gagal', e?.response?.data?.message || e.message)
      } finally { this.loading=false }
    },

    // SweetAlert helpers
    toast(icon, title){
      const T = Swal.mixin({ toast:true, position:'top-end', showConfirmButton:false, timer:1600, timerProgressBar:true })
      T.fire({ icon, title })
    },
    alert(icon, title, text){ return Swal.fire({ icon, title, text }) },
  }
}
</script>

<style scoped>
:root { --primary: #8245ec; }
.bg-primary { background-color: var(--primary); }
.text-primary { color: var(--primary); }
.border-primary { border-color: var(--primary); }
</style>
