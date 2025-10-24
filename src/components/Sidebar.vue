<template>
  <!-- sidebar -->
  <nav class="sidebar bg-white dark:bg-gray-800">
    <!-- sidebar head -->
    <div class="sidebar-head p-4">
      <router-link to="/" exact class="flex">
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
              to="/"
              exact
              class="w-full flex text-left rounded-md box-border p-3 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <span class="mr-3 text-xl"><Icon icon="bxs:dashboard" /></span>
              <span class="w-full">Dashboard</span>
            </router-link>
          </div>

          <!-- ====== Sales (tanpa counts) ====== -->
          <div class="item mt-3">
            <menu-accordion>
              <template #icon><Icon icon="mdi:cart-outline" /></template>
              <template #title>
                <div class="w-full flex items-center justify-between">
                  <span>Sales</span>
                </div>
              </template>
              <template #content>
                <!-- ✅ Tambahan: Overview → menuju halaman grid modul Sales -->
                <router-link to="/sales" class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">
                  Overview
                </router-link>

                <router-link to="/sales/quotations" class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Quotations</router-link>
                <router-link to="/sales/orders"     class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Sales Orders</router-link>
                <router-link to="/sales/customers"  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Customers</router-link>
              </template>
            </menu-accordion>
          </div>

          <!-- Website -->
          <div class="item mt-3">
            <menu-accordion>
              <template #icon><Icon icon="mdi:web" /></template>
              <template #title>
                <div class="w-full flex items-center justify-between">
                  <span>Website</span>
                </div>
              </template>
              <template #content>
                <router-link to="/website/builder"  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Page Builder</router-link>
                <router-link to="/website/blog"     class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Blog</router-link>
                <router-link to="/website/media"    class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Media</router-link>
                <router-link to="/website/themes"   class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Themes</router-link>
                <router-link to="/website/settings" class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Settings</router-link>
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
                <router-link to="/services/projects"      class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Projects</router-link>
                <router-link to="/services/timesheets"    class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Timesheets</router-link>
                <router-link to="/services/field-service" class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Field Service</router-link>
                <router-link to="/services/helpdesk"      class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Helpdesk</router-link>
                <router-link to="/services/appointments"  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Appointments</router-link>
              </template>
            </menu-accordion>
          </div>

          <!-- Accounting -->
          <div class="item mt-3">
            <menu-accordion>
              <template #icon><Icon icon="mdi:account-cash-outline" /></template>
              <template #title>
                <div class="w-full flex items-center justify-between">
                  <span>Accounting</span>
                </div>
              </template>
              <template #content>
                <router-link to="/accounting/invoicing"      class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Invoicing</router-link>
                <router-link to="/accounting/general-ledger" class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">General Ledger</router-link>
                <router-link to="/accounting/bank-reconcile" class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Bank Reconcile</router-link>
              </template>
            </menu-accordion>
          </div>

          <!-- Supply Chain -->
          <div class="item mt-3">
            <menu-accordion>
              <template #icon><Icon icon="mdi:truck-outline" /></template>
              <template #title>
                <div class="w-full flex items-center justify-between">
                  <span>Supply Chain</span>
                </div>
              </template>
              <template #content>
                <router-link to="/scm/purchase"     class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Purchase</router-link>
                <router-link to="/scm/inventory"    class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Inventory</router-link>
                <router-link to="/scm/wms"          class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">WMS</router-link>
                <router-link to="/scm/mrp"          class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Manufacturing</router-link>
                <router-link to="/scm/plm"          class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">PLM</router-link>
                <router-link to="/scm/quality"      class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Quality</router-link>
                <router-link to="/scm/maintenance"  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Maintenance</router-link>
                <router-link to="/scm/repairs"      class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Repairs</router-link>
              </template>
            </menu-accordion>
          </div>

          <!-- Productivity -->
          <div class="item mt-3">
            <menu-accordion>
              <template #icon><Icon icon="mdi:progress-check" /></template>
              <template #title>
                <div class="w-full flex items-center justify-between">
                  <span>Productivity</span>
                </div>
              </template>
              <template #content>
                <p class="text-gray-800 dark:text-gray-500">Coming soon.</p>
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
                <router-link to="/marketing/email"       class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Email</router-link>
                <router-link to="/marketing/automation"  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Automation</router-link>
                <router-link to="/marketing/sms"         class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">SMS & Social</router-link>
                <router-link to="/marketing/events"      class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Events</router-link>
                <router-link to="/marketing/surveys"     class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Surveys</router-link>
                <router-link to="/marketing/campaigns"   class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Campaigns</router-link>
                <router-link to="/marketing/reports"     class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Reports</router-link>
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
                <router-link to="/hr/employees"    class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Employees</router-link>
                <router-link to="/hr/recruitment"  class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Recruitment</router-link>
                <router-link to="/hr/attendance"   class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Attendance</router-link>
                <router-link to="/hr/time-off"     class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Time Off</router-link>
                <router-link to="/hr/payroll"      class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Payroll</router-link>
                <router-link to="/hr/appraisals"   class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Appraisals</router-link>
                <router-link to="/hr/okr"          class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">OKR</router-link>
                <router-link to="/hr/fleet"        class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Fleet</router-link>
                <router-link to="/hr/contracts"    class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Contracts</router-link>
                <router-link to="/hr/benefits"     class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Benefits</router-link>
                <router-link to="/hr/disciplinary" class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Disciplinary</router-link>
                <router-link to="/hr/training"     class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Training</router-link>
                <router-link to="/hr/calendar"     class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Calendar</router-link>
                <router-link to="/hr/reports"      class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Reports</router-link>
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

          <!-- ESG -->
          <div class="item mt-3">
            <menu-accordion>
              <template #icon><Icon icon="mdi:leaf" /></template>
              <template #title>
                <div class="w-full flex items-center justify-between">
                  <span>ESG</span>
                </div>
              </template>
              <template #content>
                <p class="text-gray-800 dark:text-gray-500">Coming soon.</p>
              </template>
            </menu-accordion>
          </div>

          <!-- Customizations -->
          <div class="item mt-3">
            <menu-accordion>
              <template #icon><Icon icon="mdi:tune" /></template>
              <template #title>
                <div class="w-full flex items-center justify-between">
                  <span>Customizations</span>
                </div>
              </template>
              <template #content>
                <router-link to="/customizations/studio" class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Studio</router-link>
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
                <router-link to="/admin/settings" class="w-full block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Settings</router-link>
              </template>
            </menu-accordion>
          </div>

          <!-- Layouts (kode lama dipertahankan) -->
          <div class="item mt-3">
            <menu-accordion>
              <template #icon><Icon icon="ri:layout-2-fill" /></template>
              <template #title>Layouts</template>
              <template #content>
                <p>Coming soon.</p>
              </template>
            </menu-accordion>
          </div>

          <!-- Pages (kode lama dipertahankan) -->
          <div class="item mt-3">
            <menu-accordion>
              <template #icon><Icon icon="ri:pages-fill" /></template>
              <template #title>Pages</template>
              <template #content>
                <div>
                  <router-link to="/blank" class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Blank Page</router-link>
                  <router-link to="/users" class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Users</router-link>

                  <menu-accordion>
                    <template #title>Error Page</template>
                    <template #content>
                      <router-link to="/404page"     class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">404 page</router-link>
                      <router-link to="/500"         class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">500 page</router-link>
                      <router-link to="/maintenance" class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Maintenance page</router-link>
                    </template>
                  </menu-accordion>

                  <menu-accordion>
                    <template #title>Authentication</template>
                    <template #content>
                      <router-link to="/auth/login"           class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Login</router-link>
                      <router-link to="/auth/register"        class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Register</router-link>
                      <router-link to="/auth/forgot-password" class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Forgot Password</router-link>
                    </template>
                  </menu-accordion>
                </div>
              </template>
            </menu-accordion>
          </div>
        </div>
      </div>

      <!-- group: UI Form & Tables -->
      <div class="pb-5">
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
          <router-link to="/tables">
            <button
              class="text-gray-800 dark:text-gray-500 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 w-full flex text-left rounded-md box-border p-3"
            >
              <span class="mr-3 text-xl"><Icon icon="bi:table" /></span>
              <span class="w-full">Tables</span>
              <span class="box-border mt-1 text-gray-500"></span>
            </button>
          </router-link>
        </div>

        <!-- Components (kode lama dipertahankan) -->
        <div class="item mt-3">
          <menu-accordion>
            <template #icon><Icon icon="gg:components" /></template>
            <template #title>Components</template>
            <template #content>
              <router-link to="/component/alert"     class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Alert</router-link>
              <router-link to="/component/accordion" class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Accordion</router-link>
              <router-link to="/component/badge"     class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Badge</router-link>
              <router-link to="/component/breadcumb" class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Breadcumb</router-link>
              <router-link to="/component/button"    class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Button</router-link>
              <router-link to="/component/card"      class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Card</router-link>
              <router-link to="/component/dropdown"  class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Dropdown</router-link>
              <router-link to="/component/modal"     class="w-full text-left block rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700">Modal</router-link>
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
  components: { Icon, MenuAccordion },
};
</script>
