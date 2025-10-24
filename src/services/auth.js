import api from '@/lib/api';

export async function register(payload) {
  const { data } = await api.post('/register', {
    ...payload,
    // device_name opsional, cuma buat penanda
    device_name: 'vue-frontend'
  });
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
}

export async function login(email, password) {
  const { data } = await api.post('/login', {
    email, password, device_name: 'vue-frontend'
  });
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
}

export async function profile() {
  const { data } = await api.get('/profile');
  return data.user;
}

export async function logout(all = false) {
  await api.post('/logout', null, { params: { all } });
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
