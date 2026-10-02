import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const billService = {
  getAll: (params) => api.get('/bills', { params }),
  getAlerts: () => api.get('/bills/alerts'),
  getOne: (id) => api.get(`/bills/${id}`),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  remove: (id) => api.delete(`/bills/${id}`),
  togglePaid: (id) => api.patch(`/bills/${id}/toggle-paid`),
  updateReceipt: (id, receipt_url) => api.patch(`/bills/${id}/receipt`, { receipt_url }),
  copyFromMonth: (fromMonth, toMonth) => api.post('/bills/copy-from-month', { fromMonth, toMonth }),
};

export const dashboardService = {
  getSummary: (month) => api.get('/dashboard/summary', { params: { month } }),
};

export const statsService = {
  getMonthly: () => api.get('/stats/monthly'),
  getByCategory: (month) => api.get('/stats/category', { params: { month } }),
};

export const adminService = {
  getUsersWithBills: (month) => api.get('/admin/users', { params: { month } }),
  getUserBills: (userId, month) => api.get(`/admin/users/${userId}/bills`, { params: { month } }),
};

export const budgetService = {
  getBudget: (month) => api.get('/budget', { params: { month } }),
  setBudget: (data) => api.post('/budget', data),
  removeBudget: (month) => api.delete('/budget', { params: { month } }),
};
