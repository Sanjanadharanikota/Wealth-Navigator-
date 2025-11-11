import { api } from './api';

// Additional auth API methods to be added to the authAPI object

// Forgot PIN - Send reset email
export const forgotPin = (data: { email: string }) =>
  api.post('/auth/forgot-pin', data);

// Reset PIN with token
export const resetPin = (data: { token: string; newPin: string }) =>
  api.post('/auth/reset-pin', data);
