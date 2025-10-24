<template>
  <div class="p-4">
    <!-- header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">master</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Customers</h1>
      </div>
      <div class="flex gap-2">
        <input
          v-model="q.search"
          @keyup.enter="reload()"
          class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search code/name/email…"
        />
        <button
          @click="reload()"
          class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5"
        >
          Search
        </button>
        <button
          @click="openCreate()"
          class="bg-primary border flex gap-2 text-white hover:bg-primary/80 dark:border-gray-700 rounded py-2.5 px-5"
        >
          <span class="text-2xl"><Icon icon="ic:twotone-plus" /></span>
          <span>New Customer</span>
        </button>
      </div>
    </div>

    <!-- summary cards -->
    <div class="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-3 mt-5">
      <SummaryCard icon-bg="bg-purple-200" icon-color="text-purple-600" title="Total Customers" :value="stats.total" />
      <SummaryCard icon-bg="bg-green-200" icon-color="text-green-600" title="Active" :value="stats.active" />
      <SummaryCard icon-bg="bg-orange-200" icon-color="text-orange-600" title="With Credit Limit" :value="stats.withCredit" />
      <SummaryCard icon-bg="bg-red-200" icon-color="text-red-600" title="Inactive" :value="stats.inactive" />
    </div>

    <!-- table -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 flex flex-wrap gap-3 items-center justify-between">
        <div class="flex gap-2 items-center">
          <label class="text-sm dark:text-gray-300">Active</label>
          <select
            v-model="q.active"
            @change="reload()"
            class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          >
            <option :value="''">All</option>
            <option :value="'1'">Yes</option>
            <option :value="'0'">No</option>
          </select>
          <label class="text-sm ml-3 dark:text-gray-300">Per page</label>
          <select
            v-model.number="q.perPage"
            @change="reload()"
            class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          >
            <option v-for="n in [10,20,50]" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ page.from || 0 }}–{{ page.to || 0 }} of {{ page.total || 0 }}
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">Code</th>
              <th class="px-6 py-3">Name</th>
              <th class="px-6 py-3">Email</th>
              <th class="px-6 py-3">Phone</th>
              <th class="px-6 py-3">Address</th>
              <th class="px-6 py-3">Payment Term</th>
              <th class="px-6 py-3 text-right">Credit Limit</th>
              <th class="px-6 py-3">Active</th>
              <th class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in rows"
              :key="c.id"
              class="bg-white dark:bg-gray-800 border-b dark:border-gray-700"
            >
              <td class="px-6 py-3 font-mono">{{ c.code }}</td>
              <td class="px-6 py-3">{{ c.name }}</td>
              <td class="px-6 py-3">{{ c.email || '-' }}</td>
              <td class="px-6 py-3">{{ c.phone || '-' }}</td>
              <td class="px-6 py-3">{{ c.address || '-' }}</td>
              <td class="px-6 py-3">{{ c.payment_term_name || c.payment_term_id || '-' }}</td>
              <td class="px-6 py-3 text-right">Rp{{ formatNumber(c.credit_limit) }}</td>
              <td class="px-6 py-3">
                <span v-if="c.is_active" class="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Active</span>
                <span v-else class="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Inactive</span>
              </td>
              <td class="px-6 py-3 text-right">
                <button @click="openEdit(c)" class="px-2 py-1 rounded border dark:border-gray-600 mr-2">
                  <Icon icon="mdi:pencil" />
                </button>
                <button @click="confirmDelete(c)" class="px-2 py-1 rounded border dark:border-gray-600">
                  <Icon icon="mdi:trash-can-outline" />
                </button>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="9" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- pagination -->
      <div class="px-5 py-4 flex items-center justify-between">
        <button
          :disabled="!page.prev"
          @click="go(page.current-1)"
          class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40"
        >
          Prev
        </button>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ page.current || 1 }} / {{ page.last || 1 }}
        </div>
        <button
          :disabled="!page.next"
          @click="go(page.current+1)"
          class="px-3 py-2 rounded border dark:border-gray-700 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>

    <!-- modal -->
    <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="modal.open=false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">
          {{ modal.mode==='create' ? 'New Customer' : 'Edit Customer' }}
        </h3>
        <div class="grid md:grid-cols-2 gap-3">
          <FormInput v-model="form.code" label="Code" :required="true" />
          <FormInput v-model="form.name" label="Name" :required="true" />
          <FormInput v-model="form.email" label="Email" type="email" />
          <FormInput v-model="form.phone" label="Phone" />
          <FormInput v-model="form.address" label="Address" />
          <FormInput v-model.number="form.payment_term_id" label="Payment Term ID" placeholder="e.g. 1" />
          <FormInput v-model.number="form.credit_limit" label="Credit Limit" type="number" />
          <div class="flex items-center gap-2 mt-2">
            <input
              id="is_active"
              type="checkbox"
              v-model="form.is_active"
              class="w-4 h-4 rounded border dark:border-gray-600 dark:bg-gray-800"
            />
            <label for="is_active" class="text-sm dark:text-gray-300">Active</label>
          </div>
        </div>
        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>
        <div class="mt-5 flex justify-end gap-2">
          <button @click="modal.open=false" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button
            @click="save()"
            :disabled="saving"
            class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80"
          >
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { Icon } from "@iconify/vue";

export default {
  name: "Customers",
  components: { Icon },

  data() {
    return {
      loading: false,
      rows: [],
      stats: { total: 0, active: 0, inactive: 0, withCredit: 0 },
      q: { page: 1, perPage: 10, search: "", active: "" },
      page: { current: 1, last: 1, total: 0, from: 0, to: 0, prev: false, next: false },

      modal: { open: false, mode: "create" },
      form: {
        id: null,
        code: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        payment_term_id: null,
        credit_limit: 0,
        is_active: true
      },
      saving: false,
      error: ""
    };
  },

  mounted() { this.reload(); },

  methods: {
    /* ========= CHANGED: gunakan VITE_API_BASE_URL ========= */
    api() {
      const token = localStorage.getItem("token");
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      return axios.create({
        baseURL: `${API_BASE}/api`,
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          Accept: "application/json"
        }
      });
    },

    async reload() {
      this.loading = true;
      try {
        const params = {
          page: this.q.page,
          per_page: this.q.perPage,
          search: this.q.search,
          active: this.q.active
        };
        const { data } = await this.api().get("/customers", { params });

        this.rows = data.data || data;
        const meta = data.meta || {};
        const total = meta.total ?? data.total ?? this.rows.length;
        const from  = meta.from  ?? data.from  ?? (this.rows.length ? 1 : 0);
        const to    = meta.to    ?? data.to    ?? this.rows.length;
        const last  = meta.last_page ?? data.last_page ?? 1;
        const cur   = meta.current_page ?? data.current_page ?? 1;

        this.page = { current: cur, last, total, from, to, prev: cur > 1, next: cur < last };

        const all = this.rows;
        this.stats.total = total;
        this.stats.active = all.filter(x => x.is_active).length;
        this.stats.inactive = all.filter(x => !x.is_active).length;
        this.stats.withCredit = all.filter(x => Number(x.credit_limit) > 0).length;
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },

    go(p) { this.q.page = Math.max(1, p); this.reload(); },

    openCreate() {
      this.modal = { open: true, mode: "create" };
      this.form = {
        id: null, code: "", name: "", email: "", phone: "", address: "",
        payment_term_id: null, credit_limit: 0, is_active: true
      };
      this.error = "";
    },

    openEdit(row) {
      this.modal = { open: true, mode: "edit" };
      this.form = { ...row };
      this.error = "";
    },

    async save() {
      this.saving = true; this.error = "";
      try {
        if (this.modal.mode === "create") {
          await this.api().post("/customers", this.form);
        } else {
          await this.api().put(`/customers/${this.form.id}`, this.form);
        }
        this.modal.open = false;
        await this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || "Failed to save";
        console.error(e);
      } finally { this.saving = false; }
    },

    async confirmDelete(row) {
      if (!confirm(`Delete ${row.name}?`)) return;
      try {
        await this.api().delete(`/customers/${row.id}`);
        this.reload();
      } catch (e) { console.error(e); }
    },

    formatNumber(n) {
      const v = Number(n || 0);
      return v.toLocaleString("id-ID");
    }
  }
};

/* small presentational subcomponents */
const SummaryCard = {
  name: "SummaryCard",
  props: { title: String, value: [String, Number], iconBg: String, iconColor: String },
  components: { Icon },
  template: `
  <div class="bg-white dark:bg-gray-800 rounded-md p-5 border dark:border-gray-700 flex">
    <div class="p-2 max-w-sm">
      <div :class="iconBg + ' rounded-full w-14 h-14 text-lg p-3 ' + iconColor + ' mx-auto'">
        <Icon icon="mdi:account-group" class="text-2xl" />
      </div>
    </div>
    <div class="block p-2 w-full">
      <p class="font-semibold text-gray-900 dark:text-gray-200 text-xl">{{ value }}</p>
      <h2 class="font-normal text-gray-400 text-md mt-1">{{ title }}</h2>
    </div>
  </div>
  `
};

const FormInput = {
  name: "FormInput",
  props: { modelValue: [String, Number], label: String, type: { default: "text" }, required: Boolean, placeholder: String },
  emits: ["update:modelValue"],
  template: `
    <label class="block">
      <span class="text-sm text-gray-600 dark:text-gray-300">{{ label }} <b v-if="required" class="text-red-500">*</b></span>
      <input :type="type" :placeholder="placeholder"
             class="mt-1 w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
             :required="required"
             :value="modelValue"
             @input="$emit('update:modelValue', $event.target.value)"/>
    </label>
  `
};
</script>
