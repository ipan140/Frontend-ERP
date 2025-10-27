<template>
  <!-- Header -->
  <header class="bg-white dark:bg-gray-800 p-2 border-b-2 dark:border-gray-700">
    <div class="wrap-header flex items-center gap-5 justify-between flex-wrap">
      <div class="flex flex-no-shrink items-center">
        <!-- Sidebar toggle (mobile) -->
        <button class="text-gray-500 lg:hidden ml-3 block" @click="$emit('sidebarToggle', true)">
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="2em" height="2em" viewBox="0 0 16 16">
            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M2.75 12.25h10.5m-10.5-4h10.5m-10.5-4h10.5" />
          </svg>
        </button>

        <!-- Search (desktop) -->
        <div
          class="input-box border dark:bg-gray-900 lg:ml-0 ml-5 dark:border-gray-700 rounded-md hidden lg:w-search w-full box-border lg:flex md:flex focus-within:bg-gray-100 dark:focus-within:bg-gray-700">
          <span class="text-3xl p-2 text-gray-400">
            <Icon icon="ei:search" />
          </span>
          <input type="text" placeholder="Search..."
            class="p-3 w-full bg-white dark:bg-gray-900 dark:text-gray-400 rounded-md outline-none focus:bg-gray-100 dark:focus:bg-gray-700" />
        </div>
      </div>

      <div class="mr-5 flex gap-3">
        <!-- Mobile search -->
        <button class="lg:hidden block mr-5 text-2xl text-gray-500 relative">
          <i>
            <Icon icon="ic:outline-search" />
          </i>
        </button>

        <!-- Fullscreen -->
        <button @click="fullscreenToggle" class="mr-5 text-2xl text-gray-500 relative">
          <i v-if="!fullscreenMode">
            <Icon icon="ic:outline-fullscreen" />
          </i>
          <i v-else>
            <Icon icon="ic:outline-fullscreen-exit" />
          </i>
        </button>

        <!-- Theme -->
        <button v-if="!darkMode" @click="setTheme(true)" class="mr-5 text-2xl text-gray-500">
          <Icon icon="ph:sun-dim" />
        </button>
        <button v-else @click="setTheme(false)" class="mr-5 text-2xl text-gray-500">
          <Icon icon="ri:moon-fill" />
        </button>

        <!-- Notifications -->
        <button @click="notifToggle" class="mr-5 text-2xl text-gray-500 relative">
          <i class="bg-red-500 rounded-full p-1.5 border border-white dark:border-gray-700 -mt-1 absolute"></i>
          <Icon icon="clarity:notification-line" />
        </button>

        <transition name="fade">
          <div id="notificaitons" v-show="notification"
            class="block absolute lg:right-56 right-28 mt-12 z-50 w-96 border dark:border-gray-700 bg-white dark:bg-gray-800 rounded divide-y dark:divide-gray-700 divide-gray-100 shadow">
            <div class="flex justify-between p-3 text-gray-800 dark:text-gray-300">
              <h2>Notifications</h2>
              <button class="text-blue-500 text-sm">Mark all as Read</button>
            </div>

            <div class="p-5 text-center" v-if="!notifList.length">
              <p class="text-gray-800 dark:text-gray-300">No notifications yet.</p>
            </div>

            <div class="p-2 pl-3 w-full" v-for="(item, index) in notifList" :key="index">
              <div class="flex gap-5">
                <div>
                  <img class="w-9 rounded-full" :src="imageAssets(item.image)" alt="" />
                </div>
                <div class="mt-1">
                  <div class="flex gap-3">
                    <h2 class="dark:text-gray-200">{{ item.name }}</h2>
                    <p class="dark:text-gray-500 text-gray-400 text-xs">{{ limitText(item.message) }}</p>
                  </div>
                  <p class="text-sm dark:text-gray-500 text-gray-400">{{ item.hours }}</p>
                </div>
              </div>
            </div>

            <div class="p-2">
              <button class="w-full p-2 text-gray-800 dark:text-gray-300">View All</button>
            </div>
          </div>
        </transition>

        <!-- User menu -->
        <button @blur="menuToggleBlur" @click="menuToggle">
          <div class="user-avatar flex p-1 cursor-pointer rounded-md">
            <div>
              <img :src="avatarSrc"
                class="rounded-full mr-4 w-10 h-10 p-1 ring-1 ring-gray-300 dark:ring-gray-500 object-cover"
                alt="avatar" />
            </div>
            <div class="text-left lg:block md:block hidden">
              <h2 class="dark:text-white text-gray-800">
                {{ displayHi }}
              </h2>
              <p class="text-xs text-gray-400 dark:text-gray-500">
                {{ displaySubtitle }}
              </p>
            </div>
          </div>
        </button>

        <transition name="fade">
          <div id="dropdownSmall" v-show="menu"
            class="block absolute right-10 mt-12 z-50 w-52 border dark:border-gray-700 bg-white dark:bg-gray-800 rounded divide-y dark:divide-gray-700 divide-gray-100 shadow">
            <div class="py-3 px-4 text-sm text-gray-900 dark:text-gray-200">
              <div>Logged As</div>
              <div class="font-medium truncate">{{ currentUser?.name || 'User' }}</div>
            </div>

            <ul class="py-1 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownSmallButton">
              <li>
                <a href="#" class="block py-2 px-4 hover:bg-primary hover:text-white">User Profile</a>
              </li>
              <li>
                <a href="#" class="block py-2 px-4 hover:bg-primary hover:text-white">Settings</a>
              </li>
            </ul>

            <div class="py-1">
              <a href="#" @click.prevent="handleLogout"
                class="block py-2 px-4 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary hover:text-white">
                Sign out
              </a>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<script>
import { Icon } from "@iconify/vue";
import { fullscreen } from "@/helper/fullscreen";
import { setDarkMode, loadDarkMode } from "@/helper/theme";

export default {
  components: { Icon },

  data() {
    return {
      menu: false,
      darkMode: false,
      notification: false,
      fullscreenMode: false,

      currentUser: null,

      notifList: [
        { name: "Elizabeth Begum", image: "user1.png", message: "Lorem ipsum dolor sit amet...", hours: "12 hours ago" },
        { name: "Ethan Roger", image: "user2.png", message: "Lorem ipsum dolor sit amet...", hours: "12 hours ago" },
        { name: "Taylor Neal", image: "user4.png", message: "Lorem ipsum dolor sit amet...", hours: "2 days ago" },
      ],
    };
  },

  computed: {
    displayHi() {
      const name = this.currentUser?.name || this.currentUser?.username || "user";
      return `Hi, ${name}`;
    },
    displaySubtitle() {
      return this.currentUser?.email || "Welcome back";
    },
    avatarSrc() {
      return this.currentUser?.avatar || require("@/assets/img/user.jpg");
    },
  },

  methods: {
    fullscreen,
    setDarkMode,
    loadDarkMode,

    // ===== UI toggles
    menuToggle() { this.menu = !this.menu; },
    menuToggleBlur() { this.menu = false; },
    notifToggle() { this.notification = !this.notification; },
    notifToggleBlur() { this.notification = false; },
    limitText(msg) { return msg.length > 25 ? msg.substring(0, 25) + "..." : msg; },
    fullscreenToggle() { this.fullscreenMode = !this.fullscreenMode; this.fullscreen(this.fullscreenMode); },
    setTheme(bool) { this.darkMode = bool; this.setDarkMode(bool); },
    imageAssets(url) { return require("@/assets/img/" + url); },

    // ===== Storage helpers
    _loadUserFromStorage() {
      try {
        const raw = JSON.parse(localStorage.getItem("user") || "null");
        // kalau datanya punya key "user", ambil isinya
        this.currentUser = raw?.user || raw;
        console.log("Header final currentUser:", this.currentUser);
      } catch {
        this.currentUser = null;
      }
    }
    ,

    // ===== Env helper (Vue-CLI/Webpack first; fallback default)
    _resolveApiBase() {
      const cli = (typeof process !== "undefined" && process.env && (process.env.VUE_APP_API_BASE || process.env.VITE_API_BASE)) || undefined;
      const injected = (typeof window !== "undefined" && window.__VITE_API_BASE__) || undefined;
      const raw = cli || injected || "http://localhost:8000";
      return String(raw).replace(/\/+$/, "");
    },

    // ===== Auth fetch (inject Bearer header)
    _authFetch(path, options = {}) {
      const base = this._resolveApiBase();
      const token = localStorage.getItem("token");
      const headers = {
        Accept: "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      return fetch(base + path, { ...options, headers });
    },

    // ===== Ambil profil dari token (dipanggil saat mount/refresh)
    async _fetchMe() {
      try {
        const res = await this._authFetch("/api/profile");
        console.log("profile status:", res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const me = await res.json();
        console.log("profile json:", me);
        this.currentUser = me;
        localStorage.setItem("user", JSON.stringify(me));
      } catch (e) {
        console.warn("fetch profile failed:", e?.message || e);
        this.currentUser = null;
        // Jika token invalid/expired, boleh bersihkan:
        // localStorage.removeItem("token"); localStorage.removeItem("user");
      }
    },

    // ===== Logout (Bearer)
    async handleLogout() {
      this.menu = false; this.notification = false;

      try {
        const res = await this._authFetch("/api/logout", { method: "POST" });
        console.log("logout status:", res.status);
      } catch (e) {
        console.warn("Logout request failed:", e?.message || e);
      } finally {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        this.currentUser = null;
        this.$router.push({ name: "Login" }); // pastikan route bernama "Login" ada
      }
    },
  },

  watch: {
    $route() {
      this.menu = false; this.notification = false;
      this._loadUserFromStorage();
    },
  },

  mounted() {
    console.log("===== HEADER MOUNTED =====");

    // cek isi localStorage
    console.log("LocalStorage token:", localStorage.getItem("token"));
    console.log("LocalStorage user:", localStorage.getItem("user"));

    this._loadUserFromStorage();
    console.log("Loaded currentUser from storage:", this.currentUser);

    // kalau belum ada user tapi ada token, fetch ke API
    if (!this.currentUser && localStorage.getItem("token")) {
      console.log("No user in storage, fetching profile...");
      this._fetchMe();
    }

    // dengarkan event login
    window.addEventListener("auth:login", (e) => {
      console.log("Received auth:login event:", e.detail);
      const { user } = e.detail || {};
      if (user) {
        this.currentUser = user;
        localStorage.setItem("user", JSON.stringify(user));
        console.log("Header updated user from event:", this.currentUser);
      } else {
        console.log("auth:login event missing user, calling _fetchMe()");
        this._fetchMe();
      }
    });
  },

  async _fetchMe() {
    const token = localStorage.getItem("token");
    console.log("Fetching /api/profile with token:", token);

    try {
      const res = await this._authFetch("/api/profile");
      console.log("Profile fetch status:", res.status);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const me = await res.json();
      console.log("Profile fetch JSON result:", me);

      this.currentUser = me;
      localStorage.setItem("user", JSON.stringify(me));
    } catch (e) {
      console.warn("Fetch profile failed:", e?.message || e);
      this.currentUser = null;
    }
  },

  beforeUnmount() {
    window.removeEventListener("auth:login", this._onAuthLogin);
  },

};
</script>

<style>
/* optional: transition fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity .15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
