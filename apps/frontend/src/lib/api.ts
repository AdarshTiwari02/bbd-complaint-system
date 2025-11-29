import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem('bbd-auth');
    if (authData) {
      try {
        const { state } = JSON.parse(authData);
        if (state?.tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${state.tokens.accessToken}`;
        }
      } catch {
        // Ignore parse errors
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authData = localStorage.getItem('bbd-auth');
        if (authData) {
          const { state } = JSON.parse(authData);
          if (state?.tokens?.refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken: state.tokens.refreshToken,
            });

            const { tokens } = response.data.data;
            
            // Update stored tokens
            state.tokens = tokens;
            localStorage.setItem('bbd-auth', JSON.stringify({ state }));

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return api(originalRequest);
          }
        }
      } catch {
        // Refresh failed, clear auth
        localStorage.removeItem('bbd-auth');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const authApi = {
  login: (email: string, password: string, mfaCode?: string) =>
    api.post('/auth/login', { email, password, mfaCode }),
  register: (data: Record<string, unknown>) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
  getProfile: () => api.get('/auth/me'),
  setupMfa: () => api.post('/auth/mfa/setup'),
  verifyMfa: (code: string) => api.post('/auth/mfa/verify', { code }),
};

export const ticketApi = {
  create: (data: Record<string, unknown>) => api.post('/tickets', data),
  getAll: (params?: Record<string, unknown>) => api.get('/tickets', { params }),
  getById: (id: string) => api.get(`/tickets/${id}`),
  track: (ticketNumber: string) => api.get(`/tickets/track/${ticketNumber}`),
  update: (id: string, data: Record<string, unknown>) => api.put(`/tickets/${id}`, data),
  addMessage: (id: string, data: Record<string, unknown>) =>
    api.post(`/tickets/${id}/messages`, data),
  escalate: (id: string, reason: string) =>
    api.post(`/tickets/${id}/escalate`, { reason }),
  rate: (id: string, rating: number, comment?: string) =>
    api.post(`/tickets/${id}/rate`, { rating, comment }),
  getTimeline: (id: string) => api.get(`/tickets/${id}/timeline`),
  getSimilar: (id: string) => api.get(`/tickets/${id}/similar`),
  getReplyDraft: (id: string) => api.get(`/tickets/${id}/reply-draft`),
};

export const organizationApi = {
  getCampuses: () => api.get('/organization/campuses'),
  getColleges: (campusId?: string) =>
    api.get('/organization/colleges', { params: { campusId } }),
  getDepartments: (collegeId?: string) =>
    api.get('/organization/departments', { params: { collegeId } }),
};

export const suggestionApi = {
  getPublic: (params?: Record<string, unknown>) => api.get('/suggestions', { params }),
  vote: (id: string, isUpvote: boolean) =>
    api.post(`/suggestions/${id}/vote`, { isUpvote }),
};

export const analyticsApi = {
  getOverview: (params?: Record<string, unknown>) =>
    api.get('/analytics/overview', { params }),
  getByCollege: (params?: Record<string, unknown>) =>
    api.get('/analytics/by-college', { params }),
  getSla: (params?: Record<string, unknown>) => api.get('/analytics/sla', { params }),
  getSatisfaction: (params?: Record<string, unknown>) =>
    api.get('/analytics/satisfaction', { params }),
  getHeatmap: (params?: Record<string, unknown>) =>
    api.get('/analytics/heatmap', { params }),
  getAiInsights: (params?: Record<string, unknown>) =>
    api.get('/analytics/ai-insights', { params }),
  getTrends: (period: string, params?: Record<string, unknown>) =>
    api.get('/analytics/trends', { params: { period, ...params } }),
};

export const aiApi = {
  classify: (text: string, title?: string) =>
    api.post('/ai/classify', { text, title }),
  predictPriority: (text: string, title?: string) =>
    api.post('/ai/priority', { text, title }),
  chatbot: (messages: Array<{ role: string; content: string }>, currentStep?: string) =>
    api.post('/ai/chatbot', { messages, currentStep }),
  enhanceText: (text: string, title?: string, type?: 'complaint' | 'suggestion') =>
    api.post('/ai/enhance', { text, title, type }),
};

export const fileApi = {
  upload: (file: File, ticketId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (ticketId) formData.append('ticketId', ticketId);
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultiple: (files: File[], ticketId?: string) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (ticketId) formData.append('ticketId', ticketId);
    return api.post('/files/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const moderationApi = {
  getFlagged: (params?: Record<string, unknown>) =>
    api.get('/moderation/flagged', { params }),
  getQueue: () => api.get('/moderation/queue'),
  getStats: () => api.get('/moderation/stats'),
  approve: (id: string) => api.post(`/moderation/tickets/${id}/approve`),
  reject: (id: string, reason: string) =>
    api.post(`/moderation/tickets/${id}/reject`, { reason }),
};

export const userApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post('/users', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  updateProfile: (data: Record<string, unknown>) => api.put('/users/me/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/me/password', data),
  assignRoles: (id: string, roleIds: string[]) => api.post(`/users/${id}/roles`, { roleIds }),
  exportData: () => api.get('/users/me/export'),
  requestDeletion: () => api.post('/users/me/delete-request'),
  // Verification endpoints
  getPendingVerifications: () => api.get('/users/verification/pending'),
  verifyUser: (id: string, note?: string) => api.post(`/users/verification/${id}/verify`, { note }),
  rejectUser: (id: string, reason: string) => api.post(`/users/verification/${id}/reject`, { reason }),
  getVerificationRequirements: (role: string) => api.get(`/users/verification/requirements/${role}`),
};

