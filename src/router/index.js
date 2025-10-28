// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";

/* =====================
   DEFAULT PAGES
===================== */
import Dashboard from "../views/Dashboard.vue";

/* =====================
   COMPONENT PAGES
===================== */
import Valert from "../views/components/alert.vue";
import Vaccrodion from "../views/components/accordion.vue";
import Vbadges from "../views/components/badges.vue";
import Vbreadcumb from "../views/components/breadcumbs.vue";
import Vbutton from "../views/components/button.vue";
import Vcard from "../views/components/card.vue";
import Vdropdown from "../views/components/dropdown.vue";
import Vmodal from "../views/components/modal.vue";

/* =====================
   SALES PAGES
===================== */
import Customers from "../views/sales/Customers.vue";
import Pricelists from "../views/sales/Pricelists.vue";
import Quotations from "../views/sales/Quotations.vue";
import QuotationItems from "../views/sales/QuotationItems.vue";
import QuotationLogs from "../views/sales/QuotationLogs.vue";
import SalesOrders from "../views/sales/SalesOrders.vue";
import Products from "../views/sales/Products.vue"; // ⬅️ ditambahkan
import Invoices from "../views/sales/Invoices.vue"; // ⬅️ NEW

/* =====================
   AUTH PAGES
===================== */
import Login from "../views/layouts/auth/Login.vue";
import Register from "../views/layouts/auth/Register.vue";
import ForgotPassword from "../views/layouts/auth/forgot-password.vue";

/* =====================
   LAYOUTS & ERRORS
===================== */
import Blank from "../views/layouts/Blank.vue";
import Page404 from "../views/layouts/error/404.vue";
import Page500 from "../views/layouts/error/500.vue";
import PageMaintenance from "../views/layouts/error/maintenance.vue";
import Tables from "../views/tables.vue";

/* =====================
   APP TITLE
===================== */
const appname = " - Windzo Dashboard Admin Template";

/* =====================
   ROUTE DEFINITIONS
===================== */
const routes = [
  { path: "/", redirect: "/auth/login" },

  // Dashboard
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
    meta: { title: "Dashboard" + appname, requiresAuth: true },
  },

  /* =====================
     SALES MODULE ROUTES
  ===================== */
  {
    path: "/sales",
    name: "SalesOverview",
    component: Tables, // placeholder ringkasan
    meta: { title: "Sales Overview" + appname, requiresAuth: true },
  },
  {
    path: "/sales/orders",
    name: "SalesOrders",
    component: SalesOrders,
    meta: { title: "Sales Orders" + appname, requiresAuth: true },
  },
  {
    path: "/sales/products",
    name: "Products",
    component: Products,
    meta: { title: "Products" + appname, requiresAuth: true },
  },
  {
    path: "/sales/customers",
    name: "Customers",
    component: Customers,
    meta: { title: "Customers" + appname, requiresAuth: true },
  },
  {
    path: "/sales/pricelists",
    name: "Pricelists",
    component: Pricelists,
    meta: { title: "Pricelists" + appname, requiresAuth: true },
  },
  {
    path: "/sales/quotations",
    name: "Quotations",
    component: Quotations,
    meta: { title: "Quotations" + appname, requiresAuth: true },
  },
  {
    path: "/sales/quotations/:id/items",
    name: "QuotationItems",
    component: QuotationItems,
    props: true,
    meta: { title: "Quotation Items" + appname, requiresAuth: true },
  },
  {
    path: "/sales/quotations/:id/logs",
    name: "QuotationLogs",
    component: QuotationLogs,
    props: true,
    meta: { title: "Quotation Logs" + appname, requiresAuth: true },
  },

  // ⬅️ NEW: Invoices (list & deep-link)
  {
    path: "/sales/invoices",
    name: "Invoices",
    component: Invoices,
    meta: { title: "Invoices" + appname, requiresAuth: true },
  },
  {
    path: "/sales/invoices/:id",
    name: "InvoiceShow",
    component: Invoices,
    props: true,
    meta: { title: "Invoice" + appname, requiresAuth: true },
  },

  /* =====================
     COMPONENT EXAMPLES
  ===================== */
  {
    path: "/component/alert",
    name: "Valert",
    component: Valert,
    meta: { title: "Alert" + appname, requiresAuth: true },
  },
  {
    path: "/component/accordion",
    name: "Vaccordion",
    component: Vaccrodion,
    meta: { title: "Accordion" + appname, requiresAuth: true },
  },
  {
    path: "/component/badge",
    name: "Vbadge",
    component: Vbadges,
    meta: { title: "Badge" + appname, requiresAuth: true },
  },
  {
    path: "/component/breadcumb",
    name: "Vbreadcumb",
    component: Vbreadcumb,
    meta: { title: "Breadcumb" + appname, requiresAuth: true },
  },
  {
    path: "/component/button",
    name: "Vbutton",
    component: Vbutton,
    meta: { title: "Button" + appname, requiresAuth: true },
  },
  {
    path: "/component/card",
    name: "Vcard",
    component: Vcard,
    meta: { title: "Card" + appname, requiresAuth: true },
  },
  {
    path: "/component/dropdown",
    name: "Vdropdown",
    component: Vdropdown,
    meta: { title: "Dropdown" + appname, requiresAuth: true },
  },
  {
    path: "/component/modal",
    name: "Vmodal",
    component: Vmodal,
    meta: { title: "Modal" + appname, requiresAuth: true },
  },

  // Layout
  {
    path: "/blank",
    name: "Blank Page",
    component: Blank,
    meta: { title: "Blank Page" + appname, requiresAuth: true },
  },

  // Auth (Public)
  {
    path: "/auth/login",
    name: "Login",
    component: Login,
    meta: { title: "Login" + appname, hideNav: true },
  },
  {
    path: "/auth/register",
    name: "Register",
    component: Register,
    meta: { title: "Register" + appname, hideNav: true },
  },
  {
    path: "/auth/forgot-password",
    name: "ForgotPassword",
    component: ForgotPassword,
    meta: { title: "Forgot Password" + appname, hideNav: true },
  },

  // Error & others
  {
    path: "/500",
    name: "Page500",
    component: Page500,
    meta: { title: "Server internal Error" + appname, hideNav: true },
  },
  {
    path: "/maintenance",
    name: "maintenance",
    component: PageMaintenance,
    meta: { title: "Maintenance" + appname, hideNav: true },
  },

  // 404 (paling akhir)
  {
    path: "/404page",
    name: "Page404",
    component: Page404,
    meta: { title: "Upps! 404" + appname, hideNav: true },
  },
  { path: "/:pathMatch(.*)*", redirect: "/404page" },
];

/* =====================
   ROUTER INSTANCE
===================== */
const base =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) ||
  (typeof process !== "undefined" && process.env && process.env.BASE_URL) ||
  "/";

const router = createRouter({
  history: createWebHistory(base),
  routes,
  linkExactActiveClass: "exact-active",
  scrollBehavior() {
    return { left: 0, top: 0, behavior: "smooth" };
  },
});

/* =====================
   AUTH GUARD
===================== */
router.beforeEach((to, from, next) => {
  document.title = to.meta?.title || "Windzo";
  const token = localStorage.getItem("token");

  if (to.meta?.requiresAuth && !token) {
    return next({ name: "Login" });
  }
  if (token && (to.name === "Login" || to.name === "Register")) {
    return next({ name: "Dashboard" });
  }
  next();
});

export default router;
