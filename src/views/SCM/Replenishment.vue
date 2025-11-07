<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <p class="uppercase text-xs text-gray-700 font-semibold">scm</p>
        <h1 class="text-2xl text-gray-900 dark:text-gray-200 font-medium">Replenishments</h1>
      </div>

      <div class="flex gap-2 w-full lg:w-auto">
        <input
          v-model="q.search"
          @keyup.enter="reload"
          class="flex-1 lg:flex-none border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search item/warehouse…"
        />
        <button
          @click="reload"
          class="border rounded py-2 px-5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-100"
        >
          Search
        </button>
        <button
          @click="openCreate"
          class="bg-primary text-white rounded py-2 px-5 hover:bg-primary/80"
        >
          New Rule
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mt-4 border-b dark:border-gray-700 flex gap-2">
      <button
        v-for="t in tabs"
        :key="t.key"
        @click="activeTab = t.key"
        class="px-4 py-2 -mb-[1px] border-b-2 transition"
        :class="activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500'"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- === RULES TABLE === -->
    <div
      v-if="activeTab === 'rules'"
      class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md"
    >
      <div class="px-5 py-4 flex items-center justify-between">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ rows.length }} rule(s)
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-6 py-3">#</th>
              <th class="px-6 py-3">Item</th>
              <th class="px-6 py-3">Warehouse</th>
              <th class="px-6 py-3">Min</th>
              <th class="px-6 py-3">Max</th>
              <th class="px-6 py-3">Reorder</th>
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
              <td class="px-6 py-3 font-mono">#{{ r.id }}</td>
              <td class="px-6 py-3">{{ r.item?.name || `#${r.item_id}` }}</td>
              <td class="px-6 py-3">{{ r.warehouse?.name || `#${r.warehouse_id}` }}</td>
              <td class="px-6 py-3">{{ r.min_qty }}</td>
              <td class="px-6 py-3">{{ r.max_qty }}</td>
              <td class="px-6 py-3">{{ r.reorder_qty }}</td>
              <td class="px-6 py-3">
                <span
                  class="px-2 py-1 text-xs rounded"
                  :class="r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
                >
                  {{ r.active ? 'Yes' : 'No' }}
                </span>
              </td>
              <td class="px-6 py-3 text-right space-x-2">
                <button
                  @click="openEdit(r)"
                  class="px-2 py-1 rounded border dark:border-gray-600"
                >
                  Edit
                </button>
                <button
                  @click="destroyRow(r)"
                  class="px-2 py-1 rounded border dark:border-gray-600"
                >
                  Delete
                </button>
              </td>
            </tr>

            <tr v-if="!loading && !rows.length">
              <td colspan="8" class="px-6 py-6 text-center text-gray-400">No rules found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- === CHECK TAB === -->
    <div
      v-if="activeTab === 'actions'"
      class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md"
    >
      <div class="p-5 space-y-4">
        <div class="flex items-center gap-3">
          <button
            @click="runCheck"
            class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80"
          >
            Run Check
          </button>
        </div>

        <div v-if="checkResult.length" class="mt-2">
          <h3 class="font-semibold mb-2 dark:text-gray-200">Suggestions</h3>
          <pre
            class="text-xs overflow-auto p-3 bg-gray-50 dark:bg-gray-900 rounded border dark:border-gray-700"
          >{{ JSON.stringify(checkResult, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <!-- === MODAL CREATE/EDIT === -->
    <div
      v-if="modal.open"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div class="absolute inset-0 bg-black/40" @click="closeModal"></div>
      <div
        class="relative bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 w-full max-w-2xl p-5"
      >
        <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">
          {{ modal.mode === 'create' ? 'Create Rule' : 'Edit Rule' }}
        </h3>

        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Item ID</label>
            <input
              v-model.number="form.item_id"
              type="number"
              min="1"
              class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Warehouse ID</label>
            <input
              v-model.number="form.warehouse_id"
              type="number"
              min="1"
              class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Min Qty</label>
            <input
              v-model.number="form.min_qty"
              type="number"
              min="0"
              step="0.0001"
              class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Max Qty</label>
            <input
              v-model.number="form.max_qty"
              type="number"
              min="0"
              step="0.0001"
              class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Reorder Qty</label>
            <input
              v-model.number="form.reorder_qty"
              type="number"
              min="0"
              step="0.0001"
              class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div>
            <label class="block text-sm mb-1 dark:text-gray-300">Active</label>
            <select
              v-model.number="form.active"
              class="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
            >
              <option :value="1">Yes</option>
              <option :value="0">No</option>
            </select>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="closeModal" class="px-4 py-2 rounded border dark:border-gray-600">
            Cancel
          </button>
          <button
            @click="submit"
            :disabled="saving"
            class="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80"
          >
            {{ saving ? 'Saving…' : modal.mode === 'create' ? 'Create' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading bar -->
    <div
      v-if="loading"
      class="fixed left-0 right-0 top-0 h-1 bg-primary animate-pulse"
    ></div>
  </div>
</template>

<script>
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { scmApi } from "@/lib/_scmApi";

export default {
  name: "Replenishments",
  data() {
    return {
      loading: false,
      saving: false,

      tabs: [
        { key: "rules", label: "Rules" },
        { key: "actions", label: "Actions" },
      ],
      activeTab: "rules",

      q: { search: "" },
      rows: [],
      error: "",

      checkResult: [],

      modal: { open: false, mode: "create", id: null },
      form: {
        item_id: null,
        warehouse_id: null,
        min_qty: 0,
        max_qty: 0,
        reorder_qty: 0,
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
      const T = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1600,
        timerProgressBar: true,
      });
      T.fire({ icon, title });
    },
    alert(icon, title, text) {
      return Swal.fire({ icon, title, text });
    },

    async reload() {
      this.loading = true;
      try {
        const { data } = await this.api().get("/replenishments");
        this.rows = data?.data || data?.replenishments || [];
      } catch (e) {
        this.alert("error", "Load gagal", e?.response?.data?.message || e.message);
      } finally {
        this.loading = false;
      }
    },

    openCreate() {
      this.modal = { open: true, mode: "create", id: null };
      this.form = {
        item_id: null,
        warehouse_id: null,
        min_qty: 0,
        max_qty: 0,
        reorder_qty: 0,
        active: 1,
      };
    },

    async openEdit(row) {
      this.modal = { open: true, mode: "edit", id: row.id };
      try {
        const { data } = await this.api().get(`/replenishments/${row.id}`);
        const v = data?.replenishment || row;
        this.form = {
          item_id: v.item_id,
          warehouse_id: v.warehouse_id,
          min_qty: v.min_qty,
          max_qty: v.max_qty,
          reorder_qty: v.reorder_qty,
          active: Number(v.active),
        };
      } catch (e) {
        this.alert("error", "Load rule gagal", e?.response?.data?.message || e.message);
      }
    },

    closeModal() {
      this.modal.open = false;
    },

    async submit() {
      this.saving = true;
      try {
        if (this.modal.mode === "create") {
          await this.api().post("/replenishments", this.form);
          this.toast("success", "Rule created");
        } else {
          await this.api().put(`/replenishments/${this.modal.id}`, this.form);
          this.toast("success", "Rule updated");
        }
        this.closeModal();
        this.reload();
      } catch (e) {
        this.alert("error", "Save gagal", e?.response?.data?.message || e.message);
      } finally {
        this.saving = false;
      }
    },

    async destroyRow(row) {
      const s = await Swal.fire({
        icon: "warning",
        title: "Delete rule?",
        text: `#${row.id} item ${row.item_id} @warehouse ${row.warehouse_id}`,
        showCancelButton: true,
        confirmButtonText: "Delete",
      });
      if (!s.isConfirmed) return;

      try {
        await this.api().delete(`/replenishments/${row.id}`);
        this.toast("success", "Rule deleted");
        this.reload();
      } catch (e) {
        this.alert("error", "Delete gagal", e?.response?.data?.message || e.message);
      }
    },

    async runCheck() {
      try {
        const { data } = await this.api().post("/replenishments/check");
        this.checkResult = data?.results || [];
        this.toast("success", "Check done");
      } catch (e) {
        this.alert("error", "Check gagal", e?.response?.data?.message || e.message);
      }
    },
  },
};
</script>
