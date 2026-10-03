import { createContext, useContext, useEffect, useState } from "react";
import authApi from "../api/authApi";

const AuthContext = createContext();
// Matches host-shell/src/lib/authClient.js -- see api/axios.js for why.
const ACCESS_KEY = "platform.access_token";
const REFRESH_KEY = "platform.refresh_token";
const USER_KEY = "authUser";

const extractApiError = (err, fallback = "Une erreur est survenue.") => {
  const detail = err?.response?.data?.detail;
  if (Array.isArray(detail)) {
    const message = detail.map((item) => item?.msg).filter(Boolean).join(" | ");
    return message || fallback;
  }
  if (typeof detail === "string" && detail.trim()) return detail;
  return err?.message || fallback;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      const storedToken = localStorage.getItem(ACCESS_KEY);
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (err) {
      console.error("Erreur parsing stored user:", err);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persistSession = (userPayload, access, refresh) => {
    setUser(userPayload);
    setToken(access);
    localStorage.setItem(USER_KEY, JSON.stringify(userPayload));
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  };

  // DEPRECATED as an entry point: when this app runs embedded under
  // host-shell, the user is already authenticated by svc-iam before this
  // iframe mounts (see host-shell/src/pages/Login.jsx), and the tokens
  // above are already in localStorage under the shared keys. This function
  // now points at nocode-core's auth router, which is itself deprecated
  // (see backend/svc-nocode-core/app/modules/auth/router.py) -- calling it
  // will 404. Left in place only for standalone/local development of this
  // app outside the shell; real login always goes through svc-iam.
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await authApi.login(email, password);
      // save tokens first to authorize the /auth/me call
      localStorage.setItem(ACCESS_KEY, data.access_token);
      localStorage.setItem(REFRESH_KEY, data.refresh_token);
      const profile = await authApi.me();
      const sessionUser = profile.data;
      persistSession(sessionUser, data.access_token, data.refresh_token);
      return { user: sessionUser, token: data.access_token };
    } catch (err) {
      const message = extractApiError(err, "Échec de connexion.");
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload, plan = "free") => {
    setIsLoading(true);
    setError(null);
    try {
      const cleaned = {
        ...payload,
        email: payload.email?.trim(),
        name: payload.name?.trim(),
        surname: payload.surname?.trim(),
        birth_place: payload.birth_place?.trim() || null,
        birth_date: payload.birth_date || null,
        country: payload.country?.trim() || null,
        phone: payload.phone?.trim() || null,
        password: payload.password,
      };
      const registerCall =
        plan === "enterprise" ? authApi.registerEnterprise(cleaned) : authApi.registerFree(cleaned);
      await registerCall;
      // registration endpoints return the created user, but no tokens
      // log the user in right after
      const loginRes = await authApi.login(cleaned.email, cleaned.password);
      localStorage.setItem(ACCESS_KEY, loginRes.data.access_token);
      localStorage.setItem(REFRESH_KEY, loginRes.data.refresh_token);
      const profile = await authApi.me();
      persistSession(profile.data, loginRes.data.access_token, loginRes.data.refresh_token);
      return { user: profile.data, token: loginRes.data.access_token };
    } catch (err) {
      const message = extractApiError(err, "Échec d'inscription.");
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  };

  const value = {
    user,
    token,
    error,
    isAuthenticated: !!token || !!localStorage.getItem(ACCESS_KEY),
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
