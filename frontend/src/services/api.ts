import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  setToken: (token: string | null) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  },
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: any) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
};

// Medical Notes API
export const notesAPI = {
  uploadAudio: (formData: FormData, onUploadProgress?: (progressEvent: any) => void) =>
    api.post('/upload-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  generateNotes: (data: { transcriptId: string }) =>
    api.post('/generate-notes', data),
  getNotes: (params?: any) => api.get('/notes', { params }),
  getNote: (id: string) => api.get(`/notes/${id}`),
  updateNote: (id: string, data: any) => api.put(`/notes/${id}`, data),
  deleteNote: (id: string) => api.delete(`/notes/${id}`),
  exportToPDF: (id: string) => api.get(`/notes/${id}/pdf`, { responseType: 'blob' }),
};

// Translation API
export const translationAPI = {
  translate: (data: { text: string; targetLanguage: string; sourceLanguage?: string }) =>
    api.post('/translate', data),
  getSupportedLanguages: () => api.get('/translate/languages'),
};

// Text-to-Speech API
export const ttsAPI = {
  generateSpeech: (data: { text: string; language?: string }) =>
    api.post('/tts', data, { responseType: 'blob' }),
};

// Analytics API
export const analyticsAPI = {
  getDashboardStats: () => api.get('/analytics/dashboard'),
  getUsageStats: (params?: any) => api.get('/analytics/usage', { params }),
  getPerformanceMetrics: () => api.get('/analytics/performance'),
};

export default api;