<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">accounting</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Chart of Accounts</h1>
      </div>
      <div class="flex gap-2 w-full lg:w-auto">
        <input
          v-model="search"
          @keyup.enter="load(1)"
          class="flex-1 lg:flex-none border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search code/name…"
        />
        <select
          v-model="type"
          @change="load(1)"
          class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
        >
          <option value="">All types</option>
          <option value="asset">asset</option>
          <option value="liability">liability</option>
          <option value="equity">equity</option>
          <option value="revenue">revenue</option>
          <option value="expense">expense</option>
        </select>
        <button @click="openCreate" class="bg-primary text-white rounded px-4 py-2">
          New Account
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md overflow-x-auto">
      <table class="min-w-full text-sm text-left">
        <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th class="px-6 py-3">Code</th>
            <th class="px-6 py-3">Name</th>
            <th class="px-6 py-3">Type</th>
            <th class="px-6 py-3">Parent</th>
            <th class="px-6 py-3">Active</th>
            <th class="px-6 py-3 w-32"></th>
          </tr>
        </thead>
        <tbody class="text-gray-700 dark:text-gray-200">
          <tr v-for="r in rows" :key="r.id" class="border-b dark:border-gray-700">
            <td class="px-6 py-3 font-mono">{{ r.code }}</td>
            <td class="px-6 py-3">
              <div class="font-medium">{{ r.name }}</div>
              <div v-if="r.level > 1" class="text-xs text-gray-500">Level {{ r.level }}</div>
            </td>
            <td class="px-6 py-3 capitalize">{{ r.type }}</td>
            <td class="px-6 py-3">
              <span v-if="r.parent" class="text-sm">{{ r.parent.name }}</span>
              <span v-else class="text-gray-400">—</span>
            </td>
            <td class="px-6 py-3">
              <span :class="r.active ? 'text-green-600' : 'text-gray-400'">
                {{ r.active ? 'Yes' : 'No' }}
              </span>
            </td>
            <td class="px-6 py-3">
              <div class="flex gap-2">
                <button class="px-3 py-1 border rounded" @click="openEdit(r)">Edit</button>
                <button class="px-3 py-1 border rounded text-red-600" @click="confirmDelete(r)">Delete</button>
              </div>
            </td>
          </tr>

          <tr v-if="!loading && !rows.length">
            <td colspan="6" class="px-6 py-6 text-center text-gray-400">No data</td>
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
          <button
            :disabled="meta.current_page <= 1"
            @click="load(meta.current_page - 1)"
            class="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            :disabled="meta.current_page >= meta.last_page"
            @click="load(meta.current_page + 1)"
            class="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Create/Edit -->
    <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="closeModal"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">
          {{ modal.mode === 'create' ? 'Create Account' : 'Edit Account' }}
        </h3>

        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">Company ID</label>
            <input v-model="form.company_id" type="number" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" />
          </div>
          <div>
            <label class="block text-sm mb-1">Type</label>
            <select v-model="form.type" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700">
              <option value="asset">asset</option>
              <option value="liability">liability</option>
              <option value="equity">equity</option>
              <option value="revenue">revenue</option>
              <option value="expense">expense</option>
            </select>
          </div>
          <div>
            <label class="block text-sm mb-1">Code</label>
            <input v-model.trim="form.code" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" />
          </div>
          <div>
            <label class="block text-sm mb-1">Name</label>
            <input v-model.trim="form.name" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" />
          </div>
          <div>
            <label class="block text-sm mb-1">Parent</label>
            <!-- JANGAN pakai .number agar null tetap null -->
            <select v-model="form.parent_id" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700">
              <option :value="null">— none —</option>
              <option v-for="p in parents" :key="p.id" :value="p.id">
                {{ p.code }} — {{ p.name }}
              </option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <input id="active" type="checkbox" v-model="form.active" class="h-4 w-4" />
            <label for="active" class="text-sm">Active</label>
          </div>
        </div>

        <div class="mt-4 text-right flex gap-2 justify-end">
          <button @click="closeModal" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="submit" class="px-4 py-2 rounded bg-primary text-white">
            {{ modal.mode === 'create' ? 'Create' : 'Save' }}
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
import { accountingApi } from '@/lib/accountingApi'

export default {
  name: 'AccountingCOA',
  data() {
    return {
      loading: false,
      search: '',
      type: '',
      rows: [],
      meta: { current_page: 1, last_page: 1, total: 0 },
      parents: [],
      modal: { open: false, mode: 'create', editingId: null },
      form: { company_id: null, code: '', name: '', type: 'asset', parent_id: null, active: true },
      _searchTimer: null,
    }
  },
  watch: {
    // debounce pencarian
    search() {
      clearTimeout(this._searchTimer)
      this._searchTimer = setTimeout(() => this.load(1), 400)
    }
  },
  mounted() {
    this.load(1)
    this.loadParents()
  },
  methods: {
    api() { return accountingApi() },

    // normalisasi respons (paginated atau array)
    unpackRows(payload) {
      const p = payload?.data
      if (Array.isArray(p?.data)) return p.data
      if (Array.isArray(p)) return p
      if (Array.isArray(payload)) return payload
      return []
    },
    unpackMeta(payload) {
      const p = payload?.data
      return {
        current_page: p?.current_page ?? 1,
        last_page: p?.last_page ?? 1,
        total: p?.total ?? (Array.isArray(p?.data) ? p.data.length : Array.isArray(p) ? p.length : 0),
      }
    },
    nf(v) { try { return new Intl.NumberFormat().format(v ?? 0) } catch { return v } },

    async load(page = 1) {
      this.loading = true
      try {
        const { data } = await this.api().get('/accounts', {
          params: {
            page,
            per_page: 20,
            search: this.search || undefined,
            type: this.type || undefined,
          }
        })
        this.rows = this.unpackRows(data)
        this.meta = this.unpackMeta(data)
        // lengkapi parent dari cache parents jika belum ada
        this.rows.forEach(r => { if (r.parent_id && !r.parent) r.parent = this.parents.find(p => p.id === r.parent_id) || null })
      } catch (e) {
        this.alert('error', 'Load Accounts gagal', e?.response?.data?.message || e.message)
      } finally {
        this.loading = false
      }
    },

    async loadParents() {
      try {
        const { data } = await this.api().get('/accounts', { params: { per_page: 200, page: 1 } })
        this.parents = this.unpackRows(data)
      } catch { /* ignore */ }
    },

    openCreate() {
      this.modal = { open: true, mode: 'create', editingId: null }
      this.form = { company_id: null, code: '', name: '', type: 'asset', parent_id: null, active: true }
    },
    openEdit(row) {
      this.modal = { open: true, mode: 'edit', editingId: row.id }
      this.form = {
        company_id: row.company_id ?? null,
        code: row.code ?? '',
        name: row.name ?? '',
        type: row.type ?? 'asset',
        parent_id: row.parent_id ?? null,
        active: !!row.active,
      }
    },
    closeModal() { this.modal.open = false },

    async submit() {
      if (!this.form.company_id || !this.form.code.trim() || !this.form.name.trim()) {
        return this.alert('warning', 'Validasi', 'Company, code, dan name wajib diisi')
      }
      this.loading = true
      try {
        if (this.modal.mode === 'create') {
          await this.api().post('/accounts', this.form)
          this.toast('success', 'Account created')
        } else {
          await this.api().put(`/accounts/${this.modal.editingId}`, this.form)
          this.toast('success', 'Account updated')
        }
        this.closeModal()
        await this.load(this.meta.current_page)
        await this.loadParents()
      } catch (e) {
        this.alert('error', 'Simpan gagal', e?.response?.data?.message || e.message)
      } finally {
        this.loading = false
      }
    },

    async confirmDelete(row) {
      const res = await Swal.fire({
        icon: 'warning',
        title: 'Delete account?',
        text: `#${row.code} ${row.name}`,
        confirmButtonText: 'Yes, delete',
        showCancelButton: true,
      })
      if (!res.isConfirmed) return
      this.loading = true
      try {
        await this.api().delete(`/accounts/${row.id}`)
        this.toast('success', 'Account deleted')
        await this.load(this.meta.current_page)
        await this.loadParents()
      } catch (e) {
        this.alert('error', 'Delete gagal', e?.response?.data?.message || e.message)
      } finally {
        this.loading = false
      }
    },

    // sweetalert helpers
    toast(icon, title) {
      const T = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1600, timerProgressBar: true })
      T.fire({ icon, title })
    },
    alert(icon, title, text) { return Swal.fire({ icon, title, text }) },
  }
}
</script>

<style scoped>
:root { --primary: #8245ec; }
.bg-primary { background-color: var(--primary); }
.text-primary { color: var(--primary); }
.border-primary { border-color: var(--primary); }
</style>
