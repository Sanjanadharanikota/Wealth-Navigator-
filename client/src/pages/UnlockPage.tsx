import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, Fingerprint } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../utils/api';
import { PinInput } from '../components/auth/PinInput';
import type { AxiosResponse } from 'axios';

// Toast notifications
const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message)
};

// Extend the window interface to include WebAuthn types
declare global {
  interface Window {
    PublicKeyCredential: {
      isUserVerifyingPlatformAuthenticatorAvailable: () => Promise<boolean>;
      isConditionalMediationAvailable?: () => Promise<boolean>;
      new (): any;
    }
  }
}

type VerifyPinResponse = {
  verified: boolean;
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    hasBankConnected: boolean;
    onboardingComplete: boolean;
    hasWebAuthn?: boolean;
  };
  onboardingComplete?: boolean;
  nextStep?: string;
};

export default function UnlockPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPinInput, setShowPinInput] = useState(false);
  const [webAuthnAvailable, setWebAuthnAvailable] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [autoWebAuthnAttempted, setAutoWebAuthnAttempted] = useState(false);
  
  const { user, setUnlocked, setUser, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Check WebAuthn availability and user status
  const checkWebAuthn = useCallback(async () => {
    try {
      if (!window.PublicKeyCredential) {
        setWebAuthnAvailable(false);
        setShowPinInput(true);
        return;
      }

      const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setWebAuthnAvailable(isAvailable);

      const isFirstTimeUser = !user?.onboardingComplete;
      setIsFirstTime(isFirstTimeUser);

      // Only auto-attempt WebAuthn if:
      // 1. WebAuthn is available
      // 2. User has WebAuthn set up
      // 3. It's not the first time (onboarding not complete)
      // 4. We haven't already attempted it
      if (isAvailable && user?.hasWebAuthn && !isFirstTimeUser && !autoWebAuthnAttempted) {
        setAutoWebAuthnAttempted(true);
        await handleWebAuthnUnlock();
      } else {
        setShowPinInput(true);
      }
    } catch (err) {
      console.error('Error checking WebAuthn:', err);
      setWebAuthnAvailable(false);
      setShowPinInput(true);
    }
  }, [user, autoWebAuthnAttempted]);

  const handleWebAuthnUnlock = useCallback(async () => {
    if (!user?.email) {
      setError('User email not found');
      setShowPinInput(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get authentication options from the server
      const authResponse = await authAPI.getWebAuthnAuthOptions(user.email);
      const authOptions = authResponse.data;
      
      // Request the authenticator to create an assertion
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: Uint8Array.from(authOptions.challenge, (c: string) => c.charCodeAt(0)),
          timeout: 60000,
          userVerification: 'required',
          allowCredentials: authOptions.allowCredentials?.map((cred: any) => ({
            id: Uint8Array.from(cred.id, (c: string) => c.charCodeAt(0)),
            type: 'public-key',
            transports: cred.transports || ['internal'],
          })),
        },
      }) as any;
      
      if (!credential) {
        throw new Error('Authentication was cancelled');
      }
      
      // Prepare the response to send to the server
      const response = {
        id: credential.id,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        type: credential.type,
        response: {
          authenticatorData: Array.from(new Uint8Array(credential.response.authenticatorData)),
          clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
          signature: Array.from(new Uint8Array(credential.response.signature)),
          userHandle: credential.response.userHandle 
            ? Array.from(new Uint8Array(credential.response.userHandle))
            : undefined,
        },
      };
      
      // Verify the assertion with the server
      const verifyResponse = await authAPI.verifyWebAuthnAuth({
        email: user.email,
        credential: response,
      });
      
      // Update auth state
      setUnlocked(true);
      setUser(verifyResponse.data.user);
      
      // Navigate based on onboarding status
      if (verifyResponse.data.user.onboardingComplete) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding/bank_connection');
      }
      
    } catch (err: any) {
      console.error('WebAuthn unlock error:', err);
      
      // If user hasn't set up WebAuthn yet, show PIN input
      if (err.name === 'NotAllowedError' || 
          err.message?.includes('not registered') ||
          err.message?.includes('not found')) {
        setShowPinInput(true);
        setError('Please use your PIN to log in');
      } else if (err.name !== 'AbortError') {
        // Don't show error if user cancelled the prompt
        setError('Authentication failed. Please try again or use your PIN.');
        setShowPinInput(true);
      } else {
        // User cancelled, show PIN input
        setShowPinInput(true);
      }
    } finally {
      setLoading(false);
    }
  }, [user, navigate, setUnlocked, setUser, setShowPinInput]);

  const handlePinSubmit = async (enteredPin: string) => {
    if (!user?.email) {
      setError('User email not found');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Verify PIN with backend
      const response = await authAPI.verifyPin({
        email: user.email,
        pin: enteredPin
      }) as AxiosResponse<VerifyPinResponse>;
      
      // Update auth state
      setUnlocked(true);
      setUser(response.data.user);
      
      toast.success('Successfully authenticated');
      
      // Navigate based on onboarding status
      const { onboardingComplete, nextStep = 'bank_connection' } = response.data;
      
      if (onboardingComplete) {
        navigate('/dashboard');
      } else {
        navigate(`/onboarding/${nextStep}`);
      }
      
    } catch (err: any) {
      console.error('Unlock error:', err);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(err.response?.data?.error || 'Incorrect PIN. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFirstTimeSetup = useCallback(async () => {
    if (!isFirstTime || !user?.email) return;
    
    try {
      setIsSettingUp(true);
      
      // For demo purposes, we'll automatically set up WebAuthn if available
      if (webAuthnAvailable) {
        try {
          // Get registration options from the server
          const regResponse = await authAPI.getWebAuthnRegOptions(user.email);
          const options = regResponse.data;
          
          // Ask the authenticator to create a new credential
          const credential = await navigator.credentials.create({
            publicKey: {
              rp: { 
                id: window.location.hostname, 
                name: 'Financial App' 
              },
              user: {
                id: Uint8Array.from(options.user.id, (c: string) => c.charCodeAt(0)),
                name: user.email,
                displayName: user.name || user.email,
              },
              pubKeyCredParams: [
                { type: 'public-key', alg: -7 }, // ES256
                { type: 'public-key', alg: -257 }, // RS256
              ],
              timeout: 60000,
              challenge: Uint8Array.from(options.challenge, (c: string) => c.charCodeAt(0)),
              attestation: 'none',
              authenticatorSelection: {
                userVerification: 'required',
                requireResidentKey: true,
              },
            },
          }) as any;
          
          if (!credential) {
            throw new Error('Registration was cancelled');
          }
          
          // Prepare the response to send to the server
          const response = {
            id: credential.id,
            rawId: Array.from(new Uint8Array(credential.rawId)),
            type: credential.type,
            response: {
              attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
              clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
            },
          };
          
          // Register the new credential with the server
          const verifyResponse = await authAPI.verifyWebAuthnReg({
            email: user.email,
            credential: response,
          });
          
          // Update user state
          setUser(verifyResponse.data.user);
          setIsFirstTime(false);
          
          toast.success('Biometric authentication set up successfully');
          
          // Navigate to the next step
          if (verifyResponse.data.user.onboardingComplete) {
            navigate('/dashboard');
          } else {
            navigate('/onboarding/bank_connection');
          }
          
        } catch (err: any) {
          console.error('WebAuthn setup error:', err);
          
          if (err.name !== 'AbortError') {
            // Don't show error if user cancelled the prompt
            toast.error('Failed to set up biometric authentication');
            setError('Failed to set up biometric authentication. Please try again or use your PIN.');
            setShowPinInput(true);
          }
        } finally {
          setIsSettingUp(false);
        }
      }
    } catch (err) {
      console.error('First time setup error:', err);
      setError('Failed to complete setup. Please try again.');
      setShowPinInput(true);
      setIsSettingUp(false);
    }
  }, [isFirstTime, user, webAuthnAvailable, navigate, setUser, setIsFirstTime, setShowPinInput]);

  // Handle first-time setup when component mounts
  useEffect(() => {
    if (isFirstTime && !isSettingUp && webAuthnAvailable) {
      handleFirstTimeSetup();
    }
  }, [isFirstTime, isSettingUp, webAuthnAvailable, handleFirstTimeSetup]);

  // Check WebAuthn availability on mount
  useEffect(() => {
    checkWebAuthn();
  }, [checkWebAuthn]);

  // If user is not authenticated at all, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Show loading state during setup
  if (isSettingUp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 p-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Setting up your account
          </h1>
          <p className="text-white/80">Please wait while we set up your secure login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {isFirstTime ? 'Secure Your Account' : showPinInput ? 'Enter PIN' : 'Welcome Back'}
          </h1>
          <p className="text-white/80">
            {isFirstTime 
              ? 'Let\'s set up secure access to your account'
              : showPinInput 
                ? 'Enter your PIN to continue'
                : 'Authenticate to continue'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {showPinInput ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
            <PinInput
              length={6}
              onComplete={handlePinSubmit}
              disabled={loading}
            />
            {webAuthnAvailable && !isFirstTime && (
              <button
                onClick={() => setShowPinInput(false)}
                className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
              >
                <Fingerprint className="w-4 h-4" />
                Use biometrics instead
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
            <button
              onClick={handleWebAuthnUnlock}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Fingerprint className="w-5 h-5" />
                  Authenticate with Biometrics
                </>
              )}
            </button>
            
            <button
              onClick={() => setShowPinInput(true)}
              className="mt-4 w-full text-sm text-white/70 hover:text-white transition-colors"
            >
              Use PIN instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}