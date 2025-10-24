<template>
  <div class="w-full h-screen">
    <div class="flex shadow bg-waves rounded-md h-screen">
      <div class="bg-white dark:bg-gray-900 w-full">
        <form>
          <div
            class="form-body max-w-xl mx-auto lg:p-20 p-8 lg:mt-10 mt-5 space-y-8"
          >
            <div
              class="form-head cursor-pointer"
              @click="$router.push('/')"
            >
              <img
                src="../../../assets/logo/logo.svg"
                alt=""
                class="w-10"
              />
            </div>
            <div class="space-y-3">
              <h2 class="dark:text-white font-semibold text-gray-800 text-4xl">
                Create new account?
              </h2>
              <p class="dark:text-gray-400 text-gray-700">
                Please enter your information to register account.
              </p>
            </div>
            <button
              type="button"
              class="dark:text-white text-gray-700 flex justify-center gap-2 dark:bg-gray-700 bg-gray-100 hover:bg-gray-100/50 p-2 w-full rounded-md"
            >
              <img
                class="w-8"
                src="../../../assets/logo/google-logo.svg"
                alt=""
              />
              <p class="mt-1 dark:text-white text-gray-700">
                Sign up with Google
              </p>
            </button>
            <span class="flex items-center justify-center space-x-2">
              <span class="h-px dark:bg-gray-600 bg-gray-200 w-full"></span>
              <span class="font-normal text-gray-500">or </span>
              <span class="h-px dark:bg-gray-600 bg-gray-200 w-full"></span>
            </span>
            <div class="space-y-5">
              <div class="relative z-0 w-full mb-6 group">
                <input
                  type="text"
                  name="floating_text"
                  id="floating_text"
                  class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-primary focus:outline-none focus:ring-0 focus:border-primary peer"
                  placeholder=" "
                  required
                />
                <label
                  for="floating_text"
                  class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-primary peer-focus:dark:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                  >Username</label
                >
              </div>
              <div class="relative z-0 w-full mb-6 group">
                <input
                  type="email"
                  name="floating_email"
                  id="floating_email"
                  class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-primary focus:outline-none focus:ring-0 focus:border-primary peer"
                  placeholder=" "
                  required
                />
                <label
                  for="floating_email"
                  class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-primary peer-focus:dark:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                  >Email address</label
                >
              </div>
              <div class="relative z-0 w-full mb-6 group">
                <input
                  type="password"
                  name="floating_password"
                  id="floating_password"
                  class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-primary focus:outline-none focus:ring-0 focus:border-primary peer"
                  placeholder=" "
                  required
                />
                <label
                  for="floating_password"
                  class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-primary peer-focus:dark:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                  >Create new password</label
                >
              </div>
              <div class="relative z-0 w-full mb-6 group">
                <input
                  type="password"
                  name="floating_password"
                  id="floating_password"
                  class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-primary focus:outline-none focus:ring-0 focus:border-primary peer"
                  placeholder=" "
                  required
                />
                <label
                  for="floating_password"
                  class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-primary peer-focus:dark:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                  >Confirm password</label
                >
              </div>
            </div>
            <div class="flex justify-between">
              <div class="flex items-start">
                <div class="flex items-center h-5">
                  <input
                    id="remember"
                    type="checkbox"
                    value=""
                    autocomplete="off"
                    class="accent-primary focus:ring-4 cursor-pointer w-4 h-4 border border-gray-300 rounded dark:bg-gray-700 bg-gray-50 focus:ring-3 focus:ring-primary/30"
                  />
                </div>
                <label
                  for="remember"
                  class="ml-2 text-sm cursor-pointer font-normal dark:text-white text-gray-500"
                  >I accept term of service
                </label>
              </div>
            </div>

            <button
              class="text-white bg-primary hover:bg-primary/80 p-3 w-full rounded-md"
            >
              Submit, and Register
            </button>
            <p class="dark:text-white text-center text-gray-700">
              Already have an account?<button
                type="button"
                @click="$router.push('/auth/login')"
                class="ml-2 text-primary"
              >
                Login here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
/** Ambil base URL API yang kompatibel untuk Vue CLI / Vite / fallback */
function resolveBaseURL() {
  // Vue CLI (WEBPACK): VUE_APP_API_BASE
  const cli =
    (typeof process !== 'undefined' &&
      process.env &&
      (process.env.VUE_APP_API_BASE || process.env.VITE_API_BASE)) ||
    undefined;

  // Vite: akses import.meta.env via eval agar tidak di-parse Babel
  let vite;
  try {
    // eslint-disable-next-line no-eval
    vite = eval('typeof import !== "undefined" && import.meta && import.meta.env && import.meta.env.VITE_API_BASE') || undefined;
  } catch (_) {
    vite = undefined;
  }

  // Injeksi manual opsional
  const injected = (typeof window !== 'undefined' && window.__VITE_API_BASE__) || undefined;

  const raw = vite || cli || injected || 'http://127.0.0.1:8000/api';
  return String(raw).replace(/\/+$/, '');
}

async function apiFetch(path, options = {}) {
  const base = resolveBaseURL();
  const token = localStorage.getItem('token');

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(base + path, {
    method: 'GET',
    ...options,
    headers,
  });

  let data = null;
  try { data = await res.json(); } catch (_) {}

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.errors?.email?.[0] ||
      data?.errors?.password?.[0] ||
      `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export default {
  name: 'RegisterPage',
  data() {
    return { loading: false };
  },
  mounted() {
    const form = this.$el.querySelector('form');
    if (form) form.addEventListener('submit', this.handleSubmit);
  },
  beforeUnmount() {
    const form = this.$el.querySelector('form');
    if (form) form.removeEventListener('submit', this.handleSubmit);
  },
  methods: {
    async handleSubmit(e) {
      e.preventDefault();
      if (this.loading) return;
      this.loading = true;

      // Ambil nilai field dari DOM sesuai id/urutan yang ada (tanpa ubah template)
      const name = this.$el.querySelector('#floating_text')?.value?.trim() || '';
      const email = this.$el.querySelector('#floating_email')?.value?.trim() || '';
      const pwdInputs = Array.from(this.$el.querySelectorAll('input[type="password"]')); // karena id password kembar
      const password = pwdInputs[0]?.value || '';
      const confirm = pwdInputs[1]?.value || '';
      const terms = this.$el.querySelector('#remember')?.checked || false;

      // Validasi sederhana di sisi front-end
      if (!terms) {
        alert('Please accept the terms of service.');
        this.loading = false;
        return;
      }
      if (!name || !email || !password || !confirm) {
        alert('Please fill all fields.');
        this.loading = false;
        return;
      }
      if (password.length < 8) {
        alert('Password must be at least 8 characters.');
        this.loading = false;
        return;
      }
      if (password !== confirm) {
        alert('Password and confirmation do not match.');
        this.loading = false;
        return;
      }

      try {
        // Panggil endpoint register Laravel (sesuai AuthController kamu)
        const data = await apiFetch('/register', {
          method: 'POST',
          body: JSON.stringify({
            name,
            email,
            password,
            password_confirmation: confirm,
            device_name: 'vue-frontend',
          }),
        });

        // Simpan sesi
        if (data?.token) localStorage.setItem('token', data.token);
        if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));

        // Arahkan ke dashboard
        this.$router.push('/dashboard');
      } catch (err) {
        // Tampilkan pesan error dari backend (validasi email duplicate, dsb.)
        const backendErrors = err?.payload?.errors;
        const firstError =
          backendErrors &&
          Object.keys(backendErrors).length &&
          backendErrors[Object.keys(backendErrors)[0]]?.[0];

        alert(firstError || err.message || 'Register failed.');
        console.error('Register error:', err.payload || err);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
