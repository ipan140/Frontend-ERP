<template>
  <!-- sidebar -->
  <nav class="sidebar bg-white dark:bg-gray-8 00">
    <!-- sidebar head -->
    <div class="sidebar-head p-4">
      <router-link to="/dashboard" class="flex">
        <img class="w-8 mt-1" src="@/assets/logo/logo.svg" alt="logo windzo" />
        <h2 class="text-2xl font-normal ml-3 mt-2 text-gray-800 dark:text-gray-200" translate="no">
          Dashboard<span class="text-primary">.</span>
        </h2>
      </router-link>

      <div class="bg-gray-700 absolute mt-3 dark:block hidden rounded-md py-1 px-2 text-xs text-gray-200">
        Dark mode
      </div>

      <button
        class="lg:hidden block dark:text-gray-400 float-right -mt-7"
        @click="$emit('sidebarToggle')"
        aria-label="Close sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="25" height="25" viewBox="0 0 32 32">
          <path fill="currentColor" d="M7.219 5.781L5.78 7.22L14.563 16L5.78 24.781l1.44 1.439L16 17.437l8.781 8.782l1.438-1.438L17.437 16l8.782-8.781L24.78 5.78L16 14.563z"/>
        </svg>
      </button>
    </div>

    <!-- sidebar list -->
    <div class="sidebar-list p-4 mt-4 divide-y dark:divide-gray-700">
      <!-- group: menu -->
      <div class="pb-5">
        <p class="font-medium text-gray-400 dark:text-gray-400">Menu</p>

        <div class="wrap-item mt-4 dark:text-gray-500">
          <!-- Dashboard -->
          <div class="item">
            <router-link
              to="/dashboard"
              class="w-full flex text-left rounded-md box-border p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
              :class="isActiveExact('/dashboard') ? 'bg-gray-200 dark:bg-gray-700' : ''"
              @click="closeOnMobile"
            >
              <span class="mr-3 text-xl"><Icon icon="bxs:dashboard" /></span>
              <span class="w-full">Dashboard</span>
            </router-link>
          </div>

          <!-- ====== Sales ====== -->
          <div class="item mt-3">
            <menu-accordion>
              <template #icon><Icon icon="mdi:cart-outline" /></template>
              <template #title>
                <div class="w-full flex items-center justify-between">
                  <span :class="startsWith('/sales') ? 'text-primary font-semibold' : ''">Sales</span>
                </div>
              </template>

              <template #content>
                <router-link
                  to="/sales/products"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/sales/products') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Products</router-link>

                <router-link
                  to="/sales/quotations"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/sales/quotations') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Quotations</router-link>

                <router-link
                  to="/sales/invoices"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/sales/invoices') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Invoices</router-link>

                <router-link
                  to="/sales/orders"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/sales/orders') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Sales Orders</router-link>

                <router-link
                  to="/sales/customers"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/sales/customers') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Customers</router-link>

                <router-link
                  to="/sales/pricelists"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/sales/pricelists') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Pricelists</router-link>
              </template>
            </menu-accordion>
          </div>

          <!-- Services -->
          <div class="item mt-3">
            <menu-accordion>
              <template #icon><Icon icon="mdi:toolbox-outline" /></template>
              <template #title>
                <div class="w-full flex items-center justify-between">
                  <span>Services</span>
                </div>
              </template>
              <template #content>
                <router-link to="/services/projects"      class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Projects</router-link>
                <router-link to="/services/timesheets"    class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Timesheets</router-link>
                <router-link to="/services/field-service" class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Field Service</router-link>
                <router-link to="/services/helpdesk"      class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Helpdesk</router-link>
                <router-link to="/services/appointments"  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Appointments</router-link>
              </template>
            </menu-accordion>
          </div>

          <!-- ====== Accounting (UPDATED) ====== -->
          <div class="item mt-3">
            <menu-accordion>
              <template #icon><Icon icon="mdi:account-cash-outline" /></template>
              <template #title>
                <div class="w-full flex items-center justify-between">
                  <span :class="startsWith('/accounting') ? 'text-primary font-semibold' : ''">Accounting</span>
                </div>
              </template>
              <template #content>
                <!-- Masters -->
                <router-link
                  to="/accounting/accounts"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/accounting/accounts') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Chart of Accounts</router-link>

                <router-link
                  to="/accounting/journals"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/accounting/journals') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Journals</router-link>

                <router-link
                  to="/accounting/moves"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/accounting/moves') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Journal Entries</router-link>

                <hr class="my-3 border-gray-200 dark:border-gray-700" />

                <!-- Reports (single entry only) -->
                <router-link
                  to="/accounting/reports"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/accounting/reports') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Reports</router-link>
              </template>
            </menu-accordion>
          </div>

          <!-- Supply Chain -->
          <div class="item mt-3">
            <menu-accordion>
              <template #icon><Icon icon="mdi:truck-outline" /></template>
              <template #title>
                <div class="w-full flex items-center justify-between">
                  <span :class="startsWith('/scm') ? 'text-primary font-semibold' : ''">Supply Chain</span>
                </div>
              </template>
              <template #content>
                <router-link
                  to="/scm/purchase"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/scm/purchase') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Purchases</router-link>

                <router-link
                  to="/scm/inventory"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/scm/inventory') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Inventory</router-link>

                <router-link
                  to="/scm/logistics"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/scm/logistics') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Logistics</router-link>

                <router-link
                  to="/scm/processing"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/scm/processing') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Manufacturing</router-link>

                <router-link
                  to="/scm/quality"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/scm/quality') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Quality</router-link>

                <router-link
                  to="/scm/maintenance"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/scm/maintenance') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Maintenance</router-link>

                <router-link
                  to="/scm/replenishment"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/scm/replenishment') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Replenishment</router-link>

                <router-link
                  to="/scm/vendor"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/scm/vendor') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Vendors</router-link>

                <router-link
                  to="/scm/report"
                  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
                  :class="startsWith('/scm/report') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Reports</router-link>
              </template>
            </menu-accordion>
          </div>

          <!-- Marketing -->
          <div class="item mt-3">
            <menu-accordion>
              <template #icon><Icon icon="mdi:bullhorn-outline" /></template>
              <template #title>
                <div class="w-full flex items-center justify-between">
                  <span>Marketing</span>
                </div>
              </template>
              <template #content>
                <router-link to="/marketing/email"       class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Email</router-link>
                <router-link to="/marketing/automation"  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Automation</router-link>
                <router-link to="/marketing/sms"         class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">SMS & Social</router-link>
                <router-link to="/marketing/events"      class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Events</router-link>
                <router-link to="/marketing/surveys"     class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Surveys</router-link>
                <router-link to="/marketing/campaigns"   class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Campaigns</router-link>
              </template>
            </menu-accordion>
          </div>

          <!-- Human Resources -->
          <div class="item mt-3">
            <menu-accordion>
              <template #icon><Icon icon="mdi:account-group-outline" /></template>
              <template #title>
                <div class="w-full flex items-center justify-between">
                  <span>Human Resources</span>
                </div>
              </template>
              <template #content>
                <!-- Master -->
                <router-link
                  to="/hr/employees"
                  class="block p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                  :class="startsWith('/hr/employees') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Employees</router-link>

                <router-link
                  to="/hr/contracts"
                  class="block p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                  :class="startsWith('/hr/contracts') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Contracts</router-link>

                <router-link
                  to="/hr/departments"
                  class="block p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                  :class="startsWith('/hr/departments') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Departments</router-link>

                <router-link
                  to="/hr/jobs"
                  class="block p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                  :class="startsWith('/hr/jobs') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Jobs</router-link>

                <router-link
                  to="/hr/holidays"
                  class="block p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                  :class="startsWith('/hr/holidays') ? 'bg-gray-200 dark:bg-gray-700' : ''"
                  @click="closeOnMobile"
                >Holidays</router-link>

                <hr class="my-3 border-gray-200 dark:border-gray-700" />

                <!-- Leaves -->
                <router-link to="/hr/leave-types" class="block p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md" :class="startsWith('/hr/leave-types') ? 'bg-gray-200 dark:bg-gray-700' : ''" @click="closeOnMobile">Leave Types</router-link>
                <router-link to="/hr/leave-allocations" class="block p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md" :class="startsWith('/hr/leave-allocations') ? 'bg-gray-200 dark:bg-gray-700' : ''" @click="closeOnMobile">Leave Allocations</router-link>
                <router-link to="/hr/leaves" class="block p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md" :class="startsWith('/hr/leaves') ? 'bg-gray-200 dark:bg-gray-700' : ''" @click="closeOnMobile">Leaves</router-link>

                <hr class="my-3 border-gray-200 dark:border-gray-700" />

                <!-- Attendance -->
                <router-link to="/hr/shifts" class="block p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md" :class="startsWith('/hr/shifts') ? 'bg-gray-200 dark:bg-gray-700' : ''" @click="closeOnMobile">Shifts</router-link>
                <router-link to="/hr/attendances" class="block p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md" :class="startsWith('/hr/attendances') ? 'bg-gray-200 dark:bg-gray-700' : ''" @click="closeOnMobile">Attendances</router-link>
                <router-link to="/hr/attendance-history" class="block p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md" :class="startsWith('/hr/attendance-history') ? 'bg-gray-200 dark:bg-gray-700' : ''" @click="closeOnMobile">Attendance History</router-link>
                <router-link to="/hr/my-attendance" class="block p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md" :class="startsWith('/hr/my-attendance') ? 'bg-gray-200 dark:bg-gray-700' : ''" @click="closeOnMobile">My Attendance</router-link>

                <hr class="my-3 border-gray-200 dark:border-gray-700" />

                <!-- Payroll -->
                <router-link to="/hr/salary-structures" class="block p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md" :class="startsWith('/hr/salary-structures') ? 'bg-gray-200 dark:bg-gray-700' : ''" @click="closeOnMobile">Salary Structures</router-link>
                <router-link to="/hr/salary-rules" class="block p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md" :class="startsWith('/hr/salary-rules') ? 'bg-gray-200 dark:bg-gray-700' : ''" @click="closeOnMobile">Salary Rules</router-link>
                <router-link to="/hr/payslips" class="block p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md" :class="startsWith('/hr/payslips') ? 'bg-gray-200 dark:bg-gray-700' : ''" @click="closeOnMobile">Payslips</router-link>
              </template>
            </menu-accordion>
          </div>

          <!-- Shipping Connectors -->
          <div class="item mt-3">
            <menu-accordion>
              <template #icon><Icon icon="mdi:package-variant-closed" /></template>
              <template #title>
                <div class="w-full flex items-center justify-between">
                  <span>Shipping Connectors</span>
                </div>
              </template>
              <template #content>
                <p class="text-gray-800 dark:text-gray-500">Coming soon.</p>
              </template>
            </menu-accordion>
          </div>

          <!-- Administration -->
          <div class="item mt-3">
            <menu-accordion>
              <template #icon><Icon icon="mdi:cog-outline" /></template>
              <template #title>
                <div class="w-full flex items-center justify-between">
                  <span>Administration</span>
                </div>
              </template>
              <template #content>
                <router-link to="/admin/settings" class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Settings</router-link>
              </template>
            </menu-accordion>
          </div>
        </div>
      </div>

      <!-- group: UI Form & Tables (HIDDEN, not deleted) -->
      <div class="pb-5" v-show="showUiFormTables">
        <p class="font-medium text-gray-400 mt-4 dark:text-gray-400">UI Form & Tables</p>

        <div class="item mt-3">
          <menu-accordion>
            <template #icon><Icon icon="ant-design:form-outlined" /></template>
            <template #title>Form Element</template>
            <template #content>
              <p class="text-gray-800 dark:text-gray-500">Coming soon.</p>
            </template>
          </menu-accordion>
        </div>

        <div class="item mt-3">
          <router-link to="/tables" @click="closeOnMobile">
            <button
              class="text-gray-800 dark:text-gray-500 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 w-full flex text-left rounded-md box-border p-3"
            >
              <span class="mr-3 text-xl"><Icon icon="bi:table" /></span>
              <span class="w-full">Tables</span>
              <span class="box-border mt-1 text-gray-500"></span>
            </button>
          </router-link>
        </div>

        <!-- Components -->
        <div class="item mt-3">
          <menu-accordion>
            <template #icon><Icon icon="gg:components" /></template>
            <template #title>Components</template>
            <template #content>
              <router-link to="/component/alert"     class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Alert</router-link>
              <router-link to="/component/accordion" class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Accordion</router-link>
              <router-link to="/component/badge"     class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Badge</router-link>
              <router-link to="/component/breadcumb" class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Breadcumb</router-link>
              <router-link to="/component/button"    class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Button</router-link>
              <router-link to="/component/card"      class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Card</router-link>
              <router-link to="/component/dropdown"  class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Dropdown</router-link>
              <router-link to="/component/modal"     class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Modal</router-link>
            </template>
          </menu-accordion>
        </div>

        <!-- Pages -->
        <div class="item mt-3">
          <menu-accordion>
            <template #icon><Icon icon="ri:pages-fill" /></template>
            <template #title>Pages</template>
            <template #content>
              <div>
                <router-link to="/blank" class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Blank Page</router-link>
                <router-link to="/users" class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Users</router-link>

                <menu-accordion>
                  <template #title>Error Page</template>
                  <template #content>
                    <router-link to="/404page"     class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">404 page</router-link>
                    <router-link to="/500"         class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">500 page</router-link>
                    <router-link to="/maintenance" class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Maintenance page</router-link>
                  </template>
                </menu-accordion>

                <menu-accordion>
                  <template #title>Authentication</template>
                  <template #content>
                    <router-link to="/auth/login"           class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Login</router-link>
                    <router-link to="/auth/register"        class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Register</router-link>
                    <router-link to="/auth/forgot-password" class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700" @click="closeOnMobile">Forgot Password</router-link>
                  </template>
                </menu-accordion>
              </div>
            </template>
          </menu-accordion>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { Icon } from "@iconify/vue";
import MenuAccordion from "./MenuAccordion.vue";

export default {
  name: "Sidebar",
  components: { Icon, MenuAccordion },
  data() {
    return { showUiFormTables: false };
  },
  methods: {
    startsWith(prefix) { return this.$route.path.startsWith(prefix); },
    isActiveExact(path) { return this.$route.path === path; },
    closeOnMobile() { this.$emit("sidebarToggle"); },
  },
};
</script>
