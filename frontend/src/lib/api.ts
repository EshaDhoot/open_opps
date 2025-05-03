import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // If token exists, add it to request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
};

// Jobs API
export const jobsAPI = {
  getJobs: (params?: any) => api.get('/jobs', { params }),
  getJob: (id: number) => api.get(`/jobs/${id}`),
  createJob: (data: any) => api.post('/jobs', data),
  updateJob: (id: number, data: any) => api.put(`/jobs/${id}`, data),
  deleteJob: (id: number) => api.delete(`/jobs/${id}`),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: any) => api.put('/user/profile', data),
  getBookmarks: () => api.get('/user/bookmarks'),
  addBookmark: (jobId: number) => api.post('/user/bookmarks', { job_id: jobId }),
  removeBookmark: (jobId: number) => api.delete(`/user/bookmarks/${jobId}`),
  getReminders: () => api.get('/user/reminders'),
  addReminder: (data: any) => api.post('/user/reminders', data),
  updateReminder: (id: number, data: any) => api.put(`/user/reminders/${id}`, data),
  deleteReminder: (id: number) => api.delete(`/user/reminders/${id}`),
};

// Organization API
export const organizationAPI = {
  getProfile: () => api.get('/organization/profile'),
  updateProfile: (data: any) => api.put('/organization/profile', data),
  getJobs: () => api.get('/organization/jobs'),
};

// Admin API
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  updateUser: (id: number, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  getJobs: (params?: any) => api.get('/admin/jobs', { params }),
  approveJob: (id: number) => api.put(`/admin/jobs/${id}/approve`),
  rejectJob: (id: number) => api.put(`/admin/jobs/${id}/reject`),
  deleteJob: (id: number) => api.delete(`/admin/jobs/${id}`),
  getOrganizations: () => api.get('/admin/organizations'),
  updateOrganization: (id: number, data: any) => api.put(`/admin/organizations/${id}`, data),
  deleteOrganization: (id: number) => api.delete(`/admin/organizations/${id}`),
};

export default api;
