import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Banknote, Check, ArrowRight, Loader2, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { plaidAPI } from '../../utils/api';
import { usePlaidLink } from 'react-plaid-link';

export default function ConnectBankPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setOnboardingStatus, setUser } = useAuthStore();

  // Fetch link token when component mounts
  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const response = await plaidAPI.createLinkToken();
        setLinkToken(response.data.link_token);
      } catch (err) {
        console.error('Error fetching link token:', err);
        setError('Failed to initialize bank connection. Please try again.');
      }
    };

    fetchLinkToken();
  }, []);

  // onSuccess callback for Plaid Link
  const onSuccess = async (publicToken: string, metadata: any) => {
    try {
      setIsConnecting(true);
      setError('');
      
      // Exchange the public token for an access token
      const response = await plaidAPI.exchangeToken(publicToken);
      
      // Update user state to indicate bank is connected
      setUser({ hasBankConnected: true, onboardingComplete: true });
      
      // Update onboarding status
      setOnboardingStatus({
        complete: true,
        hasBankConnected: true,
        nextStep: 'complete'
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error connecting bank:', err);
      if (err.response?.data?.error) {
        setError(`Failed to connect bank: ${err.response.data.error}`);
      } else if (err.response?.status === 500) {
        setError('Server error occurred while connecting bank. Please try again later.');
      } else {
        setError('Failed to connect bank. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // onExit callback for Plaid Link
  const onExit = (err: any, metadata: any) => {
    console.log('Plaid Link exited', err, metadata);
    if (err) {
      console.error('Plaid Link error:', err);
      setError('Bank connection was cancelled or failed. Please try again.');
    }
    setIsConnecting(false);
  };

  // Initialize Plaid Link
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit,
  });

  const handleConnectBank = () => {
    if (ready) {
      setIsConnecting(true);
      open();
    } else {
      setError('Bank connection is not ready. Please try again.');
    }
  };

  const handleSkipForNow = () => {
    // Mark onboarding as complete but without bank connection
    setOnboardingStatus({
      complete: true,
      hasBankConnected: false,
      nextStep: 'complete'
    });
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-6">
            <Banknote className="w-10 h-10" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Connect Your Bank
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            Securely link your bank account to track transactions, balances, and more.
          </p>
        </motion.div>

        {error && (
          <div className="mb-6 w-full max-w-sm p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <motion.div 
          className="w-full max-w-sm space-y-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                <Check className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Secure & Encrypted</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Bank-level 256-bit encryption</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Check className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Read-Only Access</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">We can't move money or make changes</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="p-6 space-y-4">
        <button
          onClick={handleConnectBank}
          disabled={isConnecting || !ready || !linkToken}
          className="w-full flex items-center justify-center px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Connecting...
            </>
          ) : (
            <>
              Connect Bank
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </button>
        
        <button
          onClick={handleSkipForNow}
          className="w-full text-center text-indigo-600 dark:text-indigo-400 font-medium py-3 hover:underline"
        >
          Skip for now
        </button>
        
        <div className="text-xs text-center text-gray-500 dark:text-gray-400">
          You can connect your bank later in settings.
        </div>
      </div>
    </div>
  );
}