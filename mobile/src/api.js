import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'calyx_token';
const BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080';

export const getToken   = ()    => AsyncStorage.getItem(TOKEN_KEY);
export const setToken   = (t)   => AsyncStorage.setItem(TOKEN_KEY, t);
export const clearToken = ()    => AsyncStorage.removeItem(TOKEN_KEY);

async function request(path, { method = 'GET', body, form, auth } = {}) {
  const headers = {};
  if (auth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  if (body)  headers['Content-Type'] = 'application/json';
  if (form)  headers['Content-Type'] = 'application/x-www-form-urlencoded';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body
      ? JSON.stringify(body)
      : form
      ? Object.entries(form).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
      : undefined,
  });

  if (!res.ok) {
    let msg;
    try {
      const j = await res.json();
      msg = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail ?? j);
    } catch {
      msg = `HTTP ${res.status}`;
    }
    throw new Error(msg);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Auth
  login:    (email, password) => request('/auth/login',    { method: 'POST', form: { username: email, password } }),
  register: (payload)         => request('/auth/register', { method: 'POST', body: payload }),
  me:       ()                => request('/auth/me',       { auth: true }),

  // Categories
  listCategories:  ()        => request('/categories',     { auth: true }),
  createCategory:  (payload) => request('/categories',     { method: 'POST', body: payload, auth: true }),

  // Products
  listProducts:   ()            => request('/products',          { auth: true }),
  createProduct:  (payload)     => request('/products',          { method: 'POST', body: payload, auth: true }),
  updateProduct:  (id, payload) => request(`/products/${id}`,    { method: 'PATCH', body: payload, auth: true }),
  deleteProduct:  (id)          => request(`/products/${id}`,    { method: 'DELETE', auth: true }),

  // Recipients
  listRecipients:   ()            => request('/recipients',           { auth: true }),
  getRecipient:     (id)          => request(`/recipients/${id}`,     { auth: true }),
  createRecipient:  (payload)     => request('/recipients',           { method: 'POST', body: payload, auth: true }),
  updateRecipient:  (id, payload) => request(`/recipients/${id}`,     { method: 'PATCH', body: payload, auth: true }),
  deleteRecipient:  (id)          => request(`/recipients/${id}`,     { method: 'DELETE', auth: true }),

  // Measurements
  createMeasurement: (id, distance) =>
    request(`/recipients/${id}/measurements`, { method: 'POST', body: { distance_from_lid: distance }, auth: true }),
  currentFill:      (id)          => request(`/recipients/${id}/fill`,                    { auth: true }),
  listMeasurements: (id, limit = 50) =>
    request(`/recipients/${id}/measurements?limit=${limit}`,                              { auth: true }),
};
