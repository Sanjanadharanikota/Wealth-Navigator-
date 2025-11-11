import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { authAPI } from './api';
import { useAuthStore } from '../store/authStore';

export async function registerWebAuthn() {
  try {
    const { user } = useAuthStore.getState();
    if (!user?.email) {
      throw new Error('User email not found');
    }
    
    // Get registration options from server
    const optionsResponse = await authAPI.getWebAuthnRegOptions(user.email);
    const options = optionsResponse.data;

    // Start WebAuthn registration
    const credential = await startRegistration(options);

    // Verify registration with server
    const verificationResponse = await authAPI.verifyWebAuthnReg({
      email: user.email,
      credential
    });

    return verificationResponse.data;
  } catch (error: any) {
    console.error('WebAuthn registration error:', error);
    throw new Error(error.response?.data?.error || 'WebAuthn registration failed');
  }
}

export async function authenticateWebAuthn(email: string) {
  try {
    // Get authentication options from server
    const optionsResponse = await authAPI.getWebAuthnAuthOptions(email);
    const options = optionsResponse.data;

    // Start WebAuthn authentication
    const credential = await startAuthentication(options);

    // Verify authentication with server
    const verificationResponse = await authAPI.verifyWebAuthnAuth({
      email,
      credential
    });

    return verificationResponse.data;
  } catch (error: any) {
    console.error('WebAuthn authentication error:', error);
    throw new Error(error.response?.data?.error || 'WebAuthn authentication failed');
  }
}

export function isWebAuthnAvailable(): boolean {
  return (
    window.PublicKeyCredential !== undefined &&
    navigator.credentials !== undefined
  );
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnAvailable()) {
    return false;
  }

  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}