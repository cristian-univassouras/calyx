const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
export const API_BASE = BASE;

const TOKEN_KEY = "calyx_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = "GET", body, form, auth = true } = {}) {
  const headers = {};
  const opts = { method, headers };

  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    opts.body = new URLSearchParams(form).toString();
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, opts);
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg).join("; ")
          : `Erro ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  // auth
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      form: { username: email, password },
      auth: false,
    }),
  register: (payload) =>
    request("/auth/register", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),

  // categories
  listCategories: () => request("/categories"),

  // products
  listProducts: () => request("/products"),
  createProduct: (payload) =>
    request("/products", { method: "POST", body: payload }),
  updateProduct: (id, payload) =>
    request(`/products/${id}`, { method: "PATCH", body: payload }),
  deleteProduct: (id) =>
    request(`/products/${id}`, { method: "DELETE" }),

  // cabinets (armarios)
  listCabinets: () => request("/cabinets"),
  getCabinet: (id) => request(`/cabinets/${id}`),
  createCabinet: (payload) =>
    request("/cabinets", { method: "POST", body: payload }),
  updateCabinet: (id, payload) =>
    request(`/cabinets/${id}`, { method: "PATCH", body: payload }),
  deleteCabinet: (id) =>
    request(`/cabinets/${id}`, { method: "DELETE" }),

  // recipients
  listRecipients: () => request("/recipients"),
  getRecipient: (id) => request(`/recipients/${id}`),
  createRecipient: (payload) =>
    request("/recipients", { method: "POST", body: payload }),
  updateRecipient: (id, payload) =>
    request(`/recipients/${id}`, { method: "PATCH", body: payload }),
  deleteRecipient: (id) =>
    request(`/recipients/${id}`, { method: "DELETE" }),

  // measurements / calculo
  createMeasurement: (id, distance) =>
    request(`/recipients/${id}/measurements`, {
      method: "POST",
      body: { distance_from_lid: distance },
    }),
  currentFill: (id) => request(`/recipients/${id}/fill`),
};
