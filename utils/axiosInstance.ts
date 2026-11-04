import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { BASE_URL } from "./apiPath";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// AuthContext registers this so an expired session logs the app out, instead of only
// deleting the stored token while the screens still think someone is logged in.
let onSessionExpired: (() => void) | null = null;
export const setSessionExpiredHandler = (fn: (() => void) | null) => {
  onSessionExpired = fn;
};

// Send whichever login is active: patient ("token") or doctor ("dToken"). A request that
// sets its own Authorization header keeps it.
axiosInstance.interceptors.request.use(
  async (config) => {
    if (!config.headers.Authorization) {
      const token = (await SecureStore.getItemAsync("token")) ?? (await SecureStore.getItemAsync("dToken"));
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // a wrong password on the login screen is also a 401: only a logged-in request means "expired"
    const sentToken = !!error.config?.headers?.Authorization;
    if (error.response?.status === 401 && sentToken) onSessionExpired?.();
    return Promise.reject(error);
  },
);

export default axiosInstance;
