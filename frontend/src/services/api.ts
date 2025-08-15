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
  (response) => {
    console.log('=== API Response Interceptor ===');
    console.log('Response status:', response.status);
    console.log('Response URL:', response.config.url);
    return response;
  },
  (error) => {
    console.error('=== API Error Interceptor ===');
    console.error('Error status:', error.response?.status);
    console.error('Error URL:', error.config?.url);
    console.error('Error message:', error.message);
    console.error('Error response data:', error.response?.data);

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
  getNotes: (params?: any) => {
    console.log('=== notesAPI.getNotes called ===');
    console.log('Params:', params);
    return api.get('/notes', { params });
  },
  getNote: (id: string) => api.get(`/notes/${id}`),
  updateNote: (id: string, data: any) => api.put(`/notes/${id}`, data),
  deleteNote: (id: string) => api.delete(`/notes/${id}`),
  approveNote: (id: string) => api.put(`/notes/${id}/approve`),
  rejectNote: (id: string, reason: string) => api.put(`/notes/${id}/reject`, { reason }),
  exportPDF: (id: string) => api.get(`/notes/${id}/pdf`, { responseType: 'blob' }),
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

// Patients API
export const patientsAPI = {
  getPatients: (params?: any) => api.get('/patients', { params }),
  getPatient: (id: string) => api.get(`/patients/${id}`),
  createPatient: (data: any) => api.post('/patients', data),
  updatePatient: (id: string, data: any) => api.put(`/patients/${id}`, data),
  deletePatient: (id: string) => api.delete(`/patients/${id}`),
  getActivePatients: (params?: any) => api.get('/patients/active', { params }),
  getPatientConsultations: (id: string, params?: any) => api.get(`/patients/${id}/consultations`, { params }),
};

export default api;