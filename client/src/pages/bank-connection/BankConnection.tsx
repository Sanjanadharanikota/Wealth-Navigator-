import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { plaidAPI } from '../../utils/api';
import { usePlaidLink } from 'react-plaid-link';
import { ArrowRight, CheckCircle, XCircle, Loader } from 'lucide-react';

type ConnectionStatus = 'idle' | 'connecting' | 'success' | 'error';

export default function BankConnection() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  
  // Generate a new link token when the component mounts
  useEffect(() => {
    const generateLinkToken = async () => {
      try {
        setStatus('connecting');
        const response = await plaidAPI.createLinkToken();
        setLinkToken(response.data.link_token);
        setStatus('idle');
      } catch (err) {
        console.error('Error generating link token:', err);
        setError('Failed to connect to Plaid. Please try again.');
        setStatus('error');
      }
    };
    
    generateLinkToken();
  }, []);
  
  // Handle successful bank connection
  const onSuccess = useCallback(async (publicToken: string) => {
    try {
      setStatus('connecting');
      
      // Exchange the public token for an access token
      await plaidAPI.exchangeToken(publicToken);
      
      // Update the user's bank connection status
      setUser({ ...user, hasBankConnected: true });
      
      // Sync transactions
      await plaidAPI.syncTransactions();
      
      setStatus('success');
      
      // Redirect to the dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Error exchanging public token:', err);
      setError('Failed to connect your bank account. Please try again.');
      setStatus('error');
    }
  }, [user, navigate, setUser]);
  
  // Configure Plaid Link
  const config = {
    token: linkToken || '',
    onSuccess,
    onExit: (err: any) => {
      if (err) {
        console.error('Plaid Link exited with error:', err);
        setError('Connection was cancelled or an error occurred.');
        setStatus('error');
      } else {
        setStatus('idle');
      }
    },
  };
  
  const { open, ready } = usePlaidLink(config);
  
  // Handle the connect button click
  const handleConnectClick = () => {
    if (ready) {
      setError(null);
      open();
    }
  };
  
  // Handle skip for now
  const handleSkip = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Connect Your Bank Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Securely connect your bank account to track transactions and manage your finances.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {status === 'success' ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">Successfully Connected!</h3>
              <p className="mt-2 text-sm text-gray-500">
                Your bank account has been connected successfully. Redirecting to your dashboard...
              </p>
              <div className="mt-6">
                <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Redirecting...
                </div>
              </div>
            </div>
          ) : status === 'error' ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">Connection Failed</h3>
              <p className="mt-2 text-sm text-gray-500">
                {error || 'An error occurred while connecting your bank account. Please try again.'}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleConnectClick}
                  disabled={!ready}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Retry Connection
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Skip for now
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">How it works:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 text-green-500">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <p className="ml-3 text-sm text-gray-600">
                        Securely connect your bank account using Plaid
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 text-green-500">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <p className="ml-3 text-sm text-gray-600">
                        View your account balances and transactions
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 text-green-500">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <p className="ml-3 text-sm text-gray-600">
                        Get insights into your spending habits
                      </p>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-blue-700">
                    We use bank-level security to protect your data. Your login credentials are never stored on our servers.
                  </p>
                </div>
                
                {error && (
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
                
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleConnectClick}
                    disabled={!ready || status === 'connecting' || !linkToken}
                    className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'connecting' ? (
                      <>
                        <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect with Plaid
                        <ArrowRight className="ml-2 -mr-1 h-4 w-4" />
                      </>
                    )}
                  </button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By connecting your account, you agree to our{' '}
            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}