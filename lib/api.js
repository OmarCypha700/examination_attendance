import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ── Axios instance ────────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Token refresh logic ───────────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;
    const refresh = Cookies.get("refresh_token");

    if (!refresh) {
      clearAuth();
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    isRefreshing = true;

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
        refresh,
      });
      const newAccess = data.access;

      saveAuth(newAccess, data.refresh || refresh);
      refreshQueue.forEach(({ resolve }) => resolve(newAccess));
      refreshQueue = [];

      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (err) {
      refreshQueue.forEach(({ reject }) => reject(err));
      refreshQueue = [];
      clearAuth();
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── Auth helpers ──────────────────────────────────────────────────────────────
export function saveAuth(access, refresh) {
  Cookies.set("access_token", access, { expires: 1, sameSite: "Strict" });
  Cookies.set("refresh_token", refresh, { expires: 7, sameSite: "Strict" });
}

export function clearAuth() {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
}

export function getAccessToken() {
  return Cookies.get("access_token") || null;
}

// ── QR Code helpers ───────────────────────────────────────────────────────────

/**
 * Returns a URL for generating a QR code image for a student's index number.
 * Uses the free qrserver.com API – no installation required.
 * The QR code encodes ONLY the student's index_number.
 *
 * @param {string} indexNumber - The student's index number
 * @param {number} size        - Size in pixels (default 200)
 * @returns {string} Image URL
 */
export function getQRCodeUrl(indexNumber, size = 200) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(indexNumber)}&format=png&ecc=M`;
}

// ── API surface ───────────────────────────────────────────────────────────────

export const authApi = {
  login: (username, password) =>
    api.post("/accounts/login/", { username, password }),
  logout: (refresh) => api.post("/accounts/logout/", { refresh }),
  me: () => api.get("/accounts/me/"),
  changePassword: (data) => api.post("/accounts/change-password/", data),
  users: {
    list: (params) => api.get("/accounts/users/", { params }),
    create: (data) => api.post("/accounts/users/", data),
    update: (id, data) => api.patch(`/accounts/users/${id}/`, data),
    delete: (id) => api.delete(`/accounts/users/${id}/`),
  },
};

export const coreApi = {
  dashboard: () => api.get("/dashboard/"),

  programs: {
    list: (params) => api.get("/programs/", { params }),
    create: (data) => api.post("/programs/", data),
    update: (id, data) => api.patch(`/programs/${id}/`, data),
    delete: (id) => api.delete(`/programs/${id}/`),
  },

  levels: {
    list: (params) => api.get("/levels/", { params }),
    create: (data) => api.post("/levels/", data),
    update: (id, data) => api.patch(`/levels/${id}/`, data),
    delete: (id) => api.delete(`/levels/${id}/`),
  },

  students: {
    list: (params) => api.get("/students/", { params }),
    create: (data) => api.post("/students/", data),
    update: (id, data) => api.patch(`/students/${id}/`, data),
    delete: (id) => api.delete(`/students/${id}/`),
    bulk: (data) => api.post("/students/bulk/", data),
  },

  courses: {
    list: (params) => api.get("/courses/", { params }),
    create: (data) => api.post("/courses/", data),
    update: (id, data) => api.patch(`/courses/${id}/`, data),
    delete: (id) => api.delete(`/courses/${id}/`),
  },

  sessions: {
    list: (params) => api.get("/exam-sessions/", { params }),
    get: (id) => api.get(`/exam-sessions/${id}/`),
    create: (data) => api.post("/exam-sessions/", data),
    update: (id, data) => api.patch(`/exam-sessions/${id}/`, data),
    delete: (id) => api.delete(`/exam-sessions/${id}/`),
    setStatus: (id, status) =>
      api.patch(`/exam-sessions/${id}/status/`, { status }),
    attendance: (sessionId, params) =>
      api.get(`/exam-sessions/${sessionId}/attendance/`, { params }),
    exportUrl: (sessionId, format = "xlsx", section = "") => {
      const s = section ? `&section=${section}` : "";
      return `${BASE_URL}/exam-sessions/${sessionId}/export/?format=${format}${s}`;
    },
  },

  /**
   * Record attendance by sending the index_number decoded from the QR code.
   * The QR code encodes only the student's index_number – all lookup is done server-side.
   *
   * @param {{ index_number: string, exam_session: number, section: string }} data
   */
  scan: (data) => api.post("/scan/", data),
};
