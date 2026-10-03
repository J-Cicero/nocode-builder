import axios from "axios";

const IAM_BASE_URL = process.env.REACT_APP_IAM_URL || "/api/iam";
const ACCESS_KEY = "platform.access_token";

const iamClient = axios.create({
  baseURL: IAM_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

iamClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (email, password) => iamClient.post("/auth/login", { email, password }),

  register: (payload) => iamClient.post("/auth/register", {
    email: payload.email,
    name: payload.name,
    surname: payload.surname,
    password: payload.password,
    tenant_id: payload.tenant_id || null,
    preferred_locale: payload.preferred_locale || "fr",
  }),

  // Alias pour rétro-compatibilité
  registerFree: (payload) => authApi.register(payload),
  registerEnterprise: (payload) => authApi.register(payload),

  refresh: (refresh_token) => iamClient.post("/auth/refresh", { refresh_token }),

  me: () => iamClient.get("/auth/me"),
};

export default authApi;
