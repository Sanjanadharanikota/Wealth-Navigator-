import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Fingerprint } from 'lucide-react';
import { authAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { authenticateWebAuthn, registerWebAuthn, isWebAuthnAvailable, isPlatformAuthenticatorAvailable } from '../utils/webauthn';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWebAuthnPrompt, setShowWebAuthnPrompt] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);

  const handleWebAuthnRegistration = async () => {
    try {
      setLoading(true);
      // Register WebAuthn for the user
      const result = await registerWebAuthn();
      
      // Update user state to indicate WebAuthn is now set up
      if (authenticatedUser) {
        const updatedUser = { ...authenticatedUser, hasWebAuthn: true };
        setUser(updatedUser);
        setAuth(updatedUser, useAuthStore.getState().token || '', useAuthStore.getState().refreshToken || '');
      }
      
      // Navigate to bank connection
      handleProceedToBankConnection();
    } catch (err: any) {
      console.error('WebAuthn setup error:', err);
      setError(err.message || 'Failed to set up Windows Hello authentication');
      // Still proceed to bank connection even if WebAuthn setup fails
      handleProceedToBankConnection();
    } finally {
      setLoading(false);
      setShowWebAuthnPrompt(false);
    }
  };

  const handleProceedToBankConnection = () => {
    navigate('/onboarding/bank-connection');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      const { user, token, refreshToken } = response.data;
      
      // Set auth state
      setAuth(user, token, refreshToken);
      setAuthenticatedUser(user);
      
      // Check if WebAuthn is available and if user has it set up
      const webAuthnAvailable = isWebAuthnAvailable() && await isPlatformAuthenticatorAvailable();
      
      if (webAuthnAvailable && user.hasWebAuthn) {
        try {
          // Attempt WebAuthn authentication
          const webAuthnResponse = await authenticateWebAuthn(email);
          
          // If successful, update user and proceed to bank connection
          setUser(webAuthnResponse.user);
          // Navigate to bank connection since user is authenticated but may not have connected bank yet
          if (!user.hasBankConnected) {
            navigate('/onboarding/bank-connection');
          } else {
            navigate('/');
          }
        } catch (webAuthnError) {
          console.error('WebAuthn authentication failed:', webAuthnError);
          // Fall back to normal authentication flow
          if (!user.hasBankConnected) {
            navigate('/onboarding/bank-connection');
          } else {
            navigate('/');
          }
        }
      } else if (webAuthnAvailable && !user.hasWebAuthn) {
        // WebAuthn is available but not set up yet, prompt user to set it up
        setShowWebAuthnPrompt(true);
      } else {
        // WebAuthn not available or not set up, proceed to bank connection
        if (!user.hasBankConnected) {
          navigate('/onboarding/bank-connection');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // If we're showing the WebAuthn prompt, render that instead
  if (showWebAuthnPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-dark-900 to-dark-800 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
              <Fingerprint className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Enhance Security</h1>
            <p className="text-gray-400">Set up Windows Hello for faster, more secure access</p>
          </div>

          <div className="card">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleWebAuthnRegistration}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Setting up...
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5" />
                    Set up Windows Hello
                  </>
                )}
              </button>

              <button
                onClick={handleProceedToBankConnection}
                className="w-full py-3 px-4 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 transition-colors"
              >
                Continue without Windows Hello
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-dark-900 to-dark-800 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your financial agent</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-500 hover:text-primary-400 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}