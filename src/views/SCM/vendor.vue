<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">scm</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Vendors</h1>
      </div>

      <div class="flex gap-2 w-full lg:w-auto">
        <input
          v-model="q.search"
          @keyup.enter="reload"
          class="flex-1 lg:flex-none border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search name/email/phone/code…"
        />

        <select
          v-model="q.active"
          @change="reload"
          class="border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
        >
          <option value="">All</option>
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </select>

        <button @click="reload"
          class="bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 border rounded py-2 px-5">
          Search
        </button>

        <button @click="openCreate"
          class="bg-primary border flex gap-2 text-white hover:bg-primary/80 dark:border-gray-700 rounded py-2 px-5">
          Create
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md">
      <div class="px-5 py-4 flex items-center justify-between">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ meta.total }} total • page {{ meta.current_page }}
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm dark:text-gray-300">Per page</label>
          <select v-model.number="q.per_page" @change="reload"
                  class="border dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-200">
            <option :value="10">10</option>
            <option :value="15">15</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">#</th>
              <th class="px-6 py-3">Code</th>
              <th class="px-6 py-3">Name</th>
              <th class="px-6 py-3">Email</th>
              <th class="px-6 py-3">Phone</th>
              <th class="px-6 py-3">Address</th>
              <th class="px-6 py-3">Rating</th>
              <th class="px-6 py-3">Active</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id"
                class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">

              <td class="px-6 py-3">{{ r.id }}</td>
              <td class="px-6 py-3 font-mono">{{ r.code }}</td>
              <td class="px-6 py-3">{{ r.name }}</td>
              <td class="px-6 py-3">{{ r.email || "-" }}</td>
              <td class="px-6 py-3">{{ r.phone || "-" }}</td>
              <td class="px-6 py-3">{{ r.address || "-" }}</td>
              <td class="px-6 py-3">{{ r.rating ?? "-" }}</td>

              <td class="px-6 py-3">
                <span class="px-2 py-1 text-xs rounded"
                      :class="r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'">
                  {{ r.active ? "Active" : "Inactive" }}
                </span>
              </td>

              <td class="px-6 py-3 text-right space-x-2">
                <button @click="openEdit(r)" class="px-2 py-1 rounded border dark:border-gray-600">Edit</button>
                <button @click="destroyRow(r)" class="px-2 py-1 rounded border dark:border-gray-600">Delete</button>
              </td>

            </tr>

            <tr v-if="!loading && !rows.length">
              <td colspan="9" class="px-6 py-6 text-center text-gray-400">No data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Simple pager -->
      <div class="px-5 py-4 flex items-center justify-between">
        <button :disabled="loading || meta.current_page<=1"
                @click="paginate(meta.current_page-1)"
                class="px-3 py-2 rounded border dark:border-gray-700">Prev</button>

        <button :disabled="loading || (meta.current_page * q.per_page) >= meta.total"
                @click="paginate(meta.current_page+1)"
                class="px-3 py-2 rounded border dark:border-gray-700">Next</button>
      </div>
    </div>

    <!-- Modal Create/Edit -->
    <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="closeModal"></div>

      <div class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5">
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">
          {{ modal.mode === 'create' ? 'Create Vendor' : 'Edit Vendor' }}
        </h3>

        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Vendor Code</label>
            <input v-model="form.code" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Name</label>
            <input v-model="form.name" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Email</label>
            <input v-model="form.email" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Phone</label>
            <input v-model="form.phone" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm mb-1 dark:text-gray-300">Address</label>
            <input v-model="form.address" class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Rating (0–5)</label>
            <input v-model.number="form.rating" type="number" min="0" max="5" step="0.01"
                   class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700" />
          </div>

          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Active</label>
            <select v-model.number="form.active"
                    class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700">
              <option :value="1">Yes</option>
              <option :value="0">No</option>
            </select>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="closeModal" class="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
          <button @click="submit" :disabled="saving"
                  class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80">
            {{ saving ? "Saving…" : modal.mode === "create" ? "Create" : "Save" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading bar -->
    <div v-if="loading" class="fixed left-0 right-0 top-0 h-1 bg-primary animate-pulse"></div>
  </div>
</template>

<script>
import Swal from "sweetalert2";
import { scmApi } from "@/lib/_scmApi";

export default {
  name: "Vendors",
  data() {
    return {
      loading: false,
      saving: false,
      error: "",
      q: { search: "", active: "", per_page: 15, page: 1 },

      rows: [],
      meta: { current_page: 1, total: 0 },

      modal: { open: false, mode: "create", id: null },

      form: {
        code: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        rating: 0,
        active: 1,
      },
    };
  },

  mounted() {
    this.reload();
  },

  methods: {
    api() {
      return scmApi();
    },

    toast(icon, title) {
      Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1800,
      }).fire({ icon, title });
    },

    async reload() {
      this.loading = true;

      try {
        const { data } = await this.api().get("/vendors", {
          params: {
            search: this.q.search || undefined,
            active: this.q.active || undefined,
            per_page: this.q.per_page,
            page: this.q.page,
          },
        });

        this.rows = data?.data || [];
        this.meta = data?.meta || { current_page: 1, total: this.rows.length };
      } catch (e) {
        this.error = e?.response?.data?.message || "Failed to load vendors";
        Swal.fire("Error", this.error, "error");
      }

      this.loading = false;
    },

    paginate(page) {
      this.q.page = Math.max(1, page);
      this.reload();
    },

    openCreate() {
      this.modal = { open: true, mode: "create", id: null };
      this.form = {
        code: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        rating: 0,
        active: 1,
      };
      this.error = "";
    },

    async openEdit(row) {
      this.modal = { open: true, mode: "edit", id: row.id };
      this.error = "";

      try {
        const { data } = await this.api().get(`/vendors/${row.id}`);
        const v = data.vendor;

        this.form = {
          code: v.code,
          name: v.name,
          email: v.email,
          phone: v.phone,
          address: v.address,
          rating: v.rating,
          active: Number(v.active),
        };
      } catch (e) {
        Swal.fire("Error", "Failed to load vendor", "error");
      }
    },

    closeModal() {
      this.modal.open = false;
    },

    async submit() {
      this.saving = true;

      try {
        if (this.modal.mode === "create") {
          await this.api().post("/vendors", this.form);
          this.toast("success", "Vendor created");
        } else {
          await this.api().put(`/vendors/${this.modal.id}`, this.form);
          this.toast("success", "Vendor updated");
        }

        this.closeModal();
        this.reload();
      } catch (e) {
        this.error = e?.response?.data?.message || "Save failed";
        Swal.fire("Error", this.error, "error");
      }

      this.saving = false;
    },

    async destroyRow(row) {
      const s = await Swal.fire({
        icon: "warning",
        title: "Delete vendor?",
        text: row.name,
        showCancelButton: true,
      });

      if (!s.isConfirmed) return;

      try {
        await this.api().delete(`/vendors/${row.id}`);
        this.toast("success", "Vendor deleted");
        this.reload();
      } catch (e) {
        Swal.fire("Error", "Delete failed", "error");
      }
    },
  },
};
</script>
