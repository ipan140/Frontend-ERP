<!-- src/views/accounting/Journals.vue -->
<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">accounting</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Journals</h1>
      </div>

      <!-- Action bar: Search + Create (sejajar) -->
      <div class="flex flex-wrap gap-2 items-center">
        <!-- Search -->
        <div class="flex items-center gap-2">
          <input
            ref="searchEl"
            v-model="q.search"
            @keyup.enter="reload(1)"
            class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
            placeholder="Search code/name…"
          />
          <button
            @click="reload(1)"
            class="p-2 rounded border dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Search"
            aria-label="Search"
          >
            <Icon icon="mdi:magnify" class="text-[20px]" />
          </button>
        </div>

        <!-- Create (di samping Search) -->
        <button
          @click="openCreate()"
          class="flex items-center gap-2 p-2 rounded bg-primary text-white hover:bg-primary/80"
          title="Create new journal"
        >
          <Icon icon="mdi:plus" class="text-[20px]" />
          <span class="hidden sm:inline">New Journal</span>
        </button>
      </div>
    </div>

    <!-- Filters (Type, Status, Per page) -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 flex flex-wrap gap-3 items-center justify-between">
        <div class="flex flex-wrap gap-3 items-center">
          <div class="flex items-center gap-2">
            <label class="text-sm dark:text-gray-300">Type</label>
            <select
              v-model="q.type"
              @change="reload(1)"
              class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">All</option>
              <option value="bank">bank</option>
              <option value="cash">cash</option>
              <option value="sale">sale</option>
              <option value="purchase">purchase</option>
              <option value="general">general</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-sm dark:text-gray-300">Status</label>
            <select
              v-model="q.active"
              @change="reload(1)"
              class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">Any</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-sm dark:text-gray-300">Per page</label>
            <select
              v-model.number="q.perPage"
              @change="reload(1)"
              class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
            >
              <option v-for="n in [10,20,50]" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>

        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ page.from || 0 }}–{{ page.to || 0 }} of {{ page.total || 0 }}
        </div>
      </div>

      <!-- Desktop Table -->
      <div class="overflow-x-auto hidden md:block">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">Code</th>
              <th class="px-6 py-3">Name</th>
              <th class="px-6 py-3">Type</th>
              <th class="px-6 py-3">Seq. Prefix</th>
              <th class="px-6 py-3">Seq. Padding</th>
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
              <td class="px-6 py-3 font-mono">{{ r.code }}</td>
              <td class="px-6 py-3">{{ r.name }}</td>
              <td class="px-6 py-3 capitalize">{{ r.type }}</td>
              <td class="px-6 py-3">{{ r.sequence_prefix || '—' }}</td>
              <td class="px-6 py-3">{{ r.sequence_padding ?? '—' }}</td>
              <td class="px-6 py-3">
                <span :class="r.active ? 'text-green-600' : 'text-gray-400'">
                  {{ r.active ? 'Yes' : 'No' }}
                </span>
              </td>
              <td class="px-6 py-3 text-right space-x-1">
                <button class="p-1.5 rounded border dark:border-gray-600" @click="openEdit(r)" title="Edit" aria-label="Edit">
                  <Icon icon="mdi:pencil-outline" class="text-[18px]" />
                </button>
                <button class="p-1.5 rounded border dark:border-gray-600 text-red-600" @click="confirmDelete(r)" title="Delete" aria-label="Delete">
                  <Icon icon="mdi:trash-can-outline" class="text-[18px]" />
                </button>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="7" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile list -->
      <div class="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
        <div v-for="r in rows" :key="r.id" class="bg-white dark:bg-gray-800 px-4 py-3">
          <div class="flex items-center justify-between">
            <div class="font-mono text-sm">{{ r.code }}</div>
            <span class="capitalize text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">
              {{ r.type }}
            </span>
          </div>
          <div class="mt-1 text-sm">{{ r.name }}</div>
          <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Prefix: {{ r.sequence_prefix || '—' }} • Pad: {{ r.sequence_padding ?? '—' }}
            • <span :class="r.active ? 'text-green-600' : 'text-gray-400'">{{ r.active ? 'Active' : 'Inactive' }}</span>
          </div>
          <div class="mt-3 flex justify-end gap-2">
            <button class="p-2 rounded border dark:border-gray-600" @click="openEdit(r)" title="Edit" aria-label="Edit">
              <Icon icon="mdi:pencil-outline" class="text-[18px]" />
            </button>
            <button class="p-2 rounded border dark:border-gray-600 text-red-600" @click="confirmDelete(r)" title="Delete" aria-label="Delete">
              <Icon icon="mdi:trash-can-outline" class="text-[18px]" />
            </button>
          </div>
        </div>
        <div v-if="!loading && !rows.length" class="px-4 py-6 text-center text-gray-400">No data</div>
      </div>

      <!-- Pagination -->
      <div class="px-5 py-4 flex items-center justify-between">
        <button :disabled="!page.prev" @click="go(page.current - 1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">Prev</button>
        <div class="text-sm text-gray-500 dark:text-gray-400">Page {{ page.current || 1 }} / {{ page.last || 1 }}</div>
        <button :disabled="!page.next" @click="go(page.current + 1)" class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40">Next</button>
      </div>
    </div>

    <!-- Modal: Create/Edit -->
    <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="closeModal"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold dark:text-gray-200">
            {{ modal.mode==='create' ? 'Create Journal' : 'Edit Journal' }}
          </h3>
          <button class="p-1.5 rounded border dark:border-gray-600" @click="closeModal" aria-label="Close">
            <Icon icon="mdi:close" class="text-[18px]" />
          </button>
        </div>

        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">Company ID</label>
            <input v-model.number="form.company_id" type="number" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div>
            <label class="block text-sm mb-1">Type</label>
            <select v-model="form.type" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700">
              <option value="bank">bank</option>
              <option value="cash">cash</option>
              <option value="sale">sale</option>
              <option value="purchase">purchase</option>
              <option value="general">general</option>
            </select>
          </div>

          <div>
            <label class="block text-sm mb-1">Code</label>
            <input v-model="form.code" :disabled="modal.mode==='edit'" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" />
          </div>
          <div>
            <label class="block text-sm mb-1">Name</label>
            <input v-model="form.name" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>

          <div>
            <label class="block text-sm mb-1">Sequence Prefix</label>
            <input v-model="form.sequence_prefix" placeholder="e.g. BNK/%Y/%m/" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>
          <div>
            <label class="block text-sm mb-1">Sequence Padding</label>
            <input v-model.number="form.sequence_padding" type="number" min="3" max="10" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"/>
          </div>

          <div class="flex items-center gap-2">
            <input id="active" type="checkbox" v-model="form.active" class="h-4 w-4"/>
            <label for="active" class="text-sm">Active</label>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-end gap-2">
          <button @click="closeModal" class="p-2 rounded border dark:border-gray-600" title="Cancel">
            <Icon icon="mdi:close" class="text-[18px]" />
          </button>
          <button @click="submit" class="p-2 rounded bg-primary text-white hover:bg-primary/80" title="Save">
            <Icon icon="mdi:content-save-outline" class="text-[18px]" />
          </button>
        </div>
      </div>
    </div>

    <!-- Loading bar -->
    <div v-if="loading" class="fixed left-0 right-0 top-0 h-1 bg-primary animate-pulse"></div>
  </div>
</template>

<script>
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import { Icon } from '@iconify/vue'
import { accountingApi } from '@/lib/accountingApi'

export default {
  name: 'AccountingJournals',
  components: { Icon },
  data(){
    return {
      loading: false,
      rows: [],
      q: { page: 1, perPage: 10, search: '', type: '', active: '' },
      page: { current: 1, last: 1, total: 0, from: 0, to: 0, prev: false, next: false },

      modal: { open: false, mode: 'create', editingId: null },
      form: {
        company_id: null,
        code: '',
        name: '',
        type: 'general',
        sequence_prefix: '',
        sequence_padding: 6,
        active: true,
      },
    }
  },
  mounted(){
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (user?.company_id) this.form.company_id = Number(user.company_id)

    this.reload(1)

    // Hotkeys: N to create, / to focus search
    window.addEventListener('keydown', this.onKeydown)
  },
  beforeUnmount(){
    window.removeEventListener('keydown', this.onKeydown)
  },
  methods: {
    api(){ return accountingApi() },

    onKeydown(e){
      const typing = ['INPUT','TEXTAREA','SELECT'].includes((e.target?.tagName||'').toUpperCase()) || e.target?.isContentEditable
      if (!typing && (e.key === '/' )) { e.preventDefault(); this.$refs.searchEl?.focus?.(); }
      if (!typing && (e.key === 'n' || e.key === 'N' || (e.key === 'N' && (e.ctrlKey||e.metaKey)))) {
        e.preventDefault(); this.openCreate()
      }
    },

    async reload(page = 1){
      this.loading = true
      try{
        this.q.page = page
        const params = {
          page: this.q.page,
          per_page: this.q.perPage,
          search: this.q.search || undefined,
          type: this.q.type || undefined,
          active: this.q.active !== '' ? this.q.active : undefined,
        }
        const { data } = await this.api().get('/journals', { params })
        const raw = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
        this.rows = raw
        this.page = {
          current: Number(data.current_page || 1),
          last: Number(data.last_page || 1),
          total: Number(data.total || raw.length || 0),
          from: Number(data.from || (raw.length ? 1 : 0)),
          to: Number(data.to || raw.length || 0),
          prev: Number(data.current_page || 1) > 1,
          next: Number(data.current_page || 1) < Number(data.last_page || 1),
        }
      } catch(e){
        this.alert('error','Load Journals gagal', e?.response?.data?.message || e.message)
      } finally { this.loading = false }
    },
    go(p){ if (p<1) return; this.reload(p) },

    openCreate(){
      this.modal = { open: true, mode: 'create', editingId: null }
      this.form = {
        company_id: this.form.company_id ?? null,
        code: '',
        name: '',
        type: 'general',
        sequence_prefix: '',
        sequence_padding: 6,
        active: true,
      }
      this.$nextTick(() => {
        const inputs = document.querySelectorAll('input')
        inputs?.[0]?.focus?.()
      })
    },
    openEdit(r){
      this.modal = { open: true, mode: 'edit', editingId: r.id }
      this.form = {
        company_id: r.company_id ?? this.form.company_id ?? null,
        code: r.code ?? '',
        name: r.name ?? '',
        type: r.type ?? 'general',
        sequence_prefix: r.sequence_prefix ?? '',
        sequence_padding: r.sequence_padding ?? 6,
        active: !!r.active,
      }
    },
    closeModal(){ this.modal.open = false },

    async submit(){
      if(!this.form.company_id || !String(this.form.code).trim() || !String(this.form.name).trim()){
        return this.alert('warning','Validasi','Company, code, dan name wajib diisi')
      }
      if(this.form.sequence_padding && (this.form.sequence_padding < 3 || this.form.sequence_padding > 10)){
        return this.alert('warning','Validasi','Sequence padding harus 3-10')
      }
      const payload = { ...this.form, code: String(this.form.code).toUpperCase().trim() }

      this.loading = true
      try{
        if(this.modal.mode === 'create'){
          await this.api().post('/journals', payload)
          this.toast('success','Journal created')
        } else {
          const { code, ...upd } = payload // code tidak boleh diubah
          await this.api().put(`/journals/${this.modal.editingId}`, upd)
          this.toast('success','Journal updated')
        }
        this.closeModal()
        await this.reload(this.page.current)
      } catch(e){
        this.alert('error','Simpan gagal', e?.response?.data?.message || e.message)
      } finally { this.loading = false }
    },

    async confirmDelete(r){
      const res = await Swal.fire({
        icon: 'warning', title: 'Delete journal?',
        text: `#${r.code} ${r.name}`,
        showCancelButton: true, confirmButtonText: 'Yes, delete'
      })
      if(!res.isConfirmed) return
      this.loading = true
      try{
        await this.api().delete(`/journals/${r.id}`)
        this.toast('success','Journal deleted')
        await this.reload(this.page.current)
      } catch(e){
        this.alert('error','Delete gagal', e?.response?.data?.message || e.message)
      } finally { this.loading = false }
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
