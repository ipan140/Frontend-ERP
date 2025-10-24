<template>
  <!-- App -->
  <div class="flex bg-gray-50 font-lexend dark:bg-gray-900">
    <div
      v-if="!$route.meta.hideNav"
      class="lg:block"
      :class="{ 'lg:block hidden': !sidebar, block: sidebar }"
    >
      <div
        class="lg:flex-auto w-sidebar bg-white dark:bg-gray-800 border-r-2 dark:border-gray-700 lg:z-0 z-20 overflow-auto lg:relative fixed"
      >
        <perfect-scrollbar class="h-screen">
          <Sidebar
            v-if="!$route.meta.hideNav"
            @sidebarToggle="close"
          />
          <!-- <sidebarlist v-if="!$route.meta.hideNav" @sidebarToggle="close" /> -->
        </perfect-scrollbar>
      </div>
    </div>

    <div
      class="flex-auto w-full overflow-auto h-screen transition-colors"
      id="body-scroll"
    >
      <Header
        v-if="!$route.meta.hideNav"
        @sidebarToggle="open"
      />

      <transition name="slide-up" mode="out-in">
        <router-view />
      </transition>

      <Footer v-if="!$route.meta.hideNav" />
    </div>
  </div>
  <!-- End app -->
</template>

<script>
/**
 * Penting:
 * - pakai ekstensi .vue agar resolver tidak bermasalah
 * - inisialisasi smooth-scrollbar dibikin aman (optional/dynamic import)
 */
import Sidebar from "@/components/Sidebar.vue";
import Header from "@/components/Header.vue";
import Footer from "@/components/Footer.vue";

export default {
  name: "App",

  components: { Header, Footer, Sidebar },

  data() {
    return {
      sidebarDark: false,
      sidebar: false,
      _sb: null, // instance smooth-scrollbar (opsional)
    };
  },

  methods: {
    open() {
      this.sidebar = true;
    },
    close() {
      this.sidebar = false;
    },
    async initSmoothScrollbar() {
      try {
        // Optional: hanya kalau paket ada. Tidak bikin crash jika tidak terpasang.
        const mod = await import(/* @vite-ignore */ "smooth-scrollbar").catch(() => null);
        if (!mod || !mod.default) return;

        const Scrollbar = mod.default;
        const el = document.querySelector("#body-scroll");
        if (el) {
          this._sb = Scrollbar.init(el);
        }
      } catch (e) {
        // jangan biarkan error kecil bikin layar putih
        console.warn("[smooth-scrollbar] skip:", e?.message || e);
      }
    },
  },

  watch: {
    $route() {
      this.sidebar = false;
    },
  },

  mounted() {
    this.initSmoothScrollbar();
  },

  beforeUnmount() {
    if (this._sb && this._sb.destroy) {
      this._sb.destroy();
      this._sb = null;
    }
  },
};
</script>

<style>
/*
  Enter and leave animations can use different durations and timing functions.
*/
.slide-up-enter-active {
  transition: all 0.3s ease-out;
}

.slide-up-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
