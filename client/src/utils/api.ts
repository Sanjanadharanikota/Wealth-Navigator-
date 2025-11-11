import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
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
      // Token expired or invalid
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
type RegisterWithPinData = {
  email: string;
  name: string;
  pin: string;
  phone?: string;
  dateOfBirth?: string;
  monthlyIncome?: number;
};

type VerifyPinData = {
  email: string;
  pin: string;
};

// Auth API
export const authAPI = {
  // Legacy methods (keep for compatibility)
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  // New PhonePe-style authentication
  registerWithPin: (data: RegisterWithPinData) =>
    api.post('/auth/register-with-pin', data),

  verifyPin: (data: VerifyPinData) =>
    api.post('/auth/verify-pin', data),

  forgotPin: (data: { email: string }) =>
    api.post('/auth/forgot-pin', data),

  resetPin: (data: { token: string; newPin: string }) =>
    api.post('/auth/reset-pin', data),

  getOnboardingStatus: () =>
    api.get('/auth/onboarding-status'),

  // WebAuthn endpoints
  getWebAuthnRegOptions: (email: string) =>
    api.post('/webauthn/register/options', { email }),

  verifyWebAuthnReg: (data: { email: string; credential: any }) =>
    api.post('/webauthn/register/verify', data),

  getWebAuthnAuthOptions: (email: string) =>
    api.post('/webauthn/authenticate/options', { email }),

  verifyWebAuthnAuth: (data: { email: string; credential: any }) =>
    api.post('/webauthn/authenticate/verify', data),

  // Update user profile with additional details
  updateProfile: (data: {
    phone?: string;
    dateOfBirth?: string;
    monthlyIncome?: number;
  }) => api.patch('/auth/profile', data),
};


// WebAuthn API
export const webauthnAPI = {
  getRegistrationOptions: () => api.post('/webauthn/register/options'),
  verifyRegistration: (data: any) => api.post('/webauthn/register/verify', data),
  getAuthenticationOptions: (email: string) =>
    api.post('/webauthn/authenticate/options', { email }),
  verifyAuthentication: (email: string, response: any) =>
    api.post('/webauthn/authenticate/verify', { email, response }),
};

// Plaid API
export const plaidAPI = {
  createLinkToken: () => api.post('/plaid/create-link-token'),
  exchangeToken: (publicToken: string) =>
    api.post('/plaid/exchange-token', { public_token: publicToken }).catch(error => {
      console.error('Plaid exchange token error:', error);
      throw error;
    }),
  syncTransactions: () => api.post('/plaid/sync-transactions'),
  unlink: () => api.post('/plaid/unlink'),
};

// Accounts API
export const accountsAPI = {
  getAccounts: () => api.get('/accounts'),
  getBalances: () => api.get('/accounts/balances'),
};

// Transactions API
export const transactionsAPI = {
  getTransactions: (params?: any) => api.get('/transactions', { params }),
  getTransaction: (id: string) => api.get(`/transactions/${id}`),
  updateTransaction: (id: string, data: any) => api.patch(`/transactions/${id}`, data),
  getLatest: () => api.get('/transactions/latest/summary'),
  detectAnomalies: () => api.post('/transactions/detect-anomalies'),
};

// Charts API
export const chartsAPI = {
  getCashflow: (range: string) => api.get('/charts/cashflow', { params: { range } }),
  getExpenseBreakdown: (range: string) =>
    api.get('/charts/expense-breakdown', { params: { range } }),
  getNetWorth: (range: string) => api.get('/charts/networth', { params: { range } }),
  getSummary: () => api.get('/charts/summary'),
  simulate: (data: any) => api.post('/charts/simulate', data),
  exportChart: (chartType: string, range: string) =>
    api.get(`/charts/export/${chartType}`, { params: { range }, responseType: 'blob' }),
};

// Assistant API
export const assistantAPI = {
  query: (message: string, conversationHistory?: any[]) =>
    api.post('/assistant/query', { message, conversationHistory }),
  calculateLoanAffordability: (data: any) =>
    api.post('/assistant/calculate/loan-affordability', data),
  calculateFutureWealth: (data: any) =>
    api.post('/assistant/calculate/future-wealth', data),
};

// Insights API
export const insightsAPI = {
  getInsights: () => api.get('/insights'),
  getAdvancedInsights: () => api.get('/insights/advanced'),
};

// Goals API
export const goalsAPI = {
  getGoals: (status?: string) => api.get('/goals', { params: { status } }),
  getGoal: (id: string) => api.get(`/goals/${id}`),
  createGoal: (data: any) => api.post('/goals', data),
  updateGoal: (id: string, data: any) => api.put(`/goals/${id}`, data),
  deleteGoal: (id: string) => api.delete(`/goals/${id}`),
  contribute: (id: string, amount: number) => api.post(`/goals/${id}/contribute`, { amount }),
};

// Chat API
export const chatAPI = {
  getSession: () => api.get('/chat/session'),
  sendMessage: (data: { message: string; chatId?: string; dataSharing?: boolean }) =>
    api.post('/chat/message', data),
  getHistory: (limit?: number) => api.get('/chat/history', { params: { limit } }),
  clearChat: (chatId?: string) => api.delete('/chat/clear', { data: { chatId } }),
  getSuggestions: () => api.get('/chat/suggestions'),
  updateDataSharing: (data: { enabled: boolean; chatId?: string }) =>
    api.put('/chat/data-sharing', data),
};

