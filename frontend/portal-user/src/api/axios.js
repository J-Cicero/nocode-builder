import axios from "axios";

// SSO NOTE: this app is embedded by host-shell under /portal-user/ (same
// origin, so localStorage is shared). host-shell already authenticated the
// user against svc-iam before mounting this iframe -- these key names match
// host-shell/src/lib/authClient.js exactly so a token minted once by
// svc-iam is picked up here with zero extra login step. Do not rename
// without updating both sides.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "/api/nocode/api";
const IAM_REFRESH_URL = process.env.REACT_APP_IAM_REFRESH_URL || "/api/iam/auth/refresh";
const ACCESS_KEY = "platform.access_token";
const REFRESH_KEY = "platform.refresh_token";

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 0,
  headers: { "Content-Type": "application/json" },
});

/**
 * Extrait et formate les erreurs API en messages clairs et lisibles en français.
 * Gère les erreurs de validation FastAPI (422), les erreurs serveur (500) et réseau.
 */
export function formatApiError(error) {
  if (!error) return "Une erreur inconnue est survenue.";

  // Si pas de réponse serveur (Erreur réseau / offline)
  if (!error.response) {
    return "Erreur de connexion réseau. Impossible de joindre le serveur.";
  }

  const status = error.response.status;
  const data = error.response.data;

  // Erreurs de validation FastAPI (422 Pydantic)
  if (status === 422 && data?.detail) {
    if (Array.isArray(data.detail)) {
      const formatted = data.detail.map((item) => {
        const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "champ";
        return `Le champ "${field}" est invalide : ${item.msg}`;
      });
      return formatted.join(" | ");
    }
    if (typeof data.detail === "string") {
      return data.detail;
    }
  }

  // Erreurs serveur (500)
  if (status >= 500) {
    return "Le serveur rencontre un problème technique. Veuillez réessayer ultérieurement.";
  }

  // Message générique renvoyé par l'API
  if (typeof data?.detail === "string") {
    return data.detail;
  }

  return error.message || "Une erreur est survenue lors de la requête.";
}

// Intercepteur de requête : attache le token JWT
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  pendingQueue = [];
};

// Intercepteur de réponse : rafraîchissement 401 et enrichissement de l'erreur
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Enrichit l'objet d'erreur avec un message utilisateur formaté
    error.userMessage = formatApiError(error);

    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(instance(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem(REFRESH_KEY);
        if (!refreshToken) throw error;

        const { data } = await axios.post(IAM_REFRESH_URL, {
          refresh_token: refreshToken,
        });

        localStorage.setItem(ACCESS_KEY, data.access_token);
        localStorage.setItem(REFRESH_KEY, data.refresh_token);
        instance.defaults.headers.Authorization = `Bearer ${data.access_token}`;
        processQueue(null, data.access_token);
        return instance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        if (!window.location.pathname.startsWith("/auth/")) {
          window.location.href = "/auth/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
