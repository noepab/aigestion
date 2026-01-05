import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Crear instancia de Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
apiClient.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem('nexus_v1_token') || localStorage.getItem('nexus_v1_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      sessionStorage.removeItem('nexus_v1_token');
      sessionStorage.removeItem('nexus_v1_user');
      localStorage.removeItem('nexus_v1_token');
      localStorage.removeItem('nexus_v1_user');
      window.location.href = 'http://localhost:4001';
    }
    return Promise.reject(error);
  },
);

/**
 * Servicio API centralizado
 */
export const apiService = {
  // Métodos genéricos
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((res) => res.data),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then((res) => res.data),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then((res) => res.data),

  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((res) => res.data),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config).then((res) => res.data),

  // Docker API
  docker: {
    getContainers: () => apiService.get('/docker/containers'),
    getContainerStats: (id: string) => apiService.get(`/docker/containers/${id}/stats`),
    startContainer: (id: string) => apiService.post(`/docker/containers/${id}/start`),
    stopContainer: (id: string) => apiService.post(`/docker/containers/${id}/stop`),
    restartContainer: (id: string) => apiService.post(`/docker/containers/${id}/restart`),
    getImages: () => apiService.get('/docker/images'),
    getVolumes: () => apiService.get('/docker/volumes'),
    getNetworks: () => apiService.get('/docker/networks'),
  },

  // System Metrics API
  system: {
    getMetrics: () => apiService.get('/system/metrics'),
    getCPUUsage: () => apiService.get('/system/cpu'),
    getMemoryUsage: () => apiService.get('/system/memory'),
    getDiskUsage: () => apiService.get('/system/disk'),
    getNetworkStats: () => apiService.get('/system/network'),
    getHistory: (metric: string) => apiService.get(`/v1/system/history/${metric}`),
  },

  // AI Engine API
  ai: {
    getModels: () => apiService.get('/ai/models'),
    getActiveModel: () => apiService.get('/ai/active-model'),
    setActiveModel: (modelId: string) => apiService.post('/ai/set-model', { modelId }),
    chat: (message: string, context?: any) => apiService.post('/ai/chat', { message, context }),
    getUsageStats: () => apiService.get('/ai/usage-stats'),
  },

  // Logs API
  logs: {
    getRecent: (limit = 100) => apiService.get(`/logs/recent?limit=${limit}`),
    stream: (callback: (log: any) => void) => {
      // WebSocket implementation
      const ws = new WebSocket(`ws://localhost:3000/logs/stream`);
      ws.onmessage = (event) => {
        const log = JSON.parse(event.data);
        callback(log);
      };
      return ws;
    },
  },

  // Users API
  users: {
    getAll: () => apiService.get('/users'),
    getById: (id: string) => apiService.get(`/users/${id}`),
    create: (userData: any) => apiService.post('/users', userData),
    update: (id: string, userData: any) => apiService.put(`/users/${id}`, userData),
    delete: (id: string) => apiService.delete(`/users/${id}`),
    getStats: () => apiService.get('/users/stats'),
  },

  // Analytics API
  analytics: {
    getOverview: () => apiService.get('/analytics/overview'),
    getUserActivity: (timeRange?: string) =>
      apiService.get(`/analytics/user-activity${timeRange ? `?range=${timeRange}` : ''}`),
    getSystemUsage: () => apiService.get('/analytics/system-usage'),
    getErrorRates: () => apiService.get('/analytics/error-rates'),
    getDashboardData: () => apiService.get('/analytics/dashboard-data'),
    exportReport: async () => {
      const response = await apiClient.get('/analytics/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
  },

  // Git API (for Developer Dashboard)
  git: {
    getRecentCommits: (limit = 10) => apiService.get(`/git/commits?limit=${limit}`),
    getBranches: () => apiService.get('/git/branches'),
    getStats: () => apiService.get('/git/stats'),
  },

  // Social API (Facebook/Meta)
  social: {
    publishFacebook: (message: string, link?: string) =>
      apiService.post('/social/facebook/publish', { message, link }),
    getFacebookStats: () => apiService.get('/social/facebook/stats'),
  },

  // Stripe API
  stripe: {
    createCheckoutSession: (
      priceId: string,
      successUrl: string,
      cancelUrl: string,
      userId?: string,
    ) => apiService.post('/v1/stripe/checkout', { priceId, successUrl, cancelUrl, userId }),
  },

  // YouTube API
  youtube: {
    transcribe: (videoUrl: string, recipientEmail: string) =>
      apiService.post('/v1/youtube/transcribe', { videoUrl, recipientEmail }),
  },

  // Health Check
  health: {
    check: () => apiService.get('/health'),
    checkServices: () => apiService.get('/health/services'),
  },
};

export default apiService;

