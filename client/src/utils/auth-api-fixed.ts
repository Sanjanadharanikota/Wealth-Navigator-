import { api } from './api';

// Type definitions
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
