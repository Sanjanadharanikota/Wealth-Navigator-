import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';

export const WelcomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <header className="pt-16 pb-8 px-4 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-block p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-6"
        >
          <div className="w-16 h-16 bg-indigo-500 dark:bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v8" />
              <path d="m16 6-4-4-4 4" />
              <path d="M18 16a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-1a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v1c0 1.3-.8 2.4-2 2.8" />
              <path d="M6 10v2a6 6 0 0 0 12 0v-2" />
            </svg>
          </div>
        </motion.div>
        
        <motion.h1 
          className="text-4xl font-bold text-gray-900 dark:text-white mb-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          Welcome to Wind
        </motion.h1>
        
        <motion.p 
          className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Your personal finance assistant that helps you track, manage, and grow your money.
        </motion.p>
      </header>

      {/* Hero Illustration */}
      <motion.div 
        className="flex-1 flex items-center justify-center px-4 py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="relative w-full max-w-md">
          <div className="absolute -inset-4 bg-indigo-100 dark:bg-indigo-900/20 rounded-3xl transform rotate-3"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              
              <div className="space-y-4">
                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 pt-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                  <div 
                    key={num}
                    className="h-12 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-xl font-medium text-gray-800 dark:text-gray-200"
                  >
                    {num === 0 ? '0' : num}
                  </div>
                ))}
                <div className="h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
                    <path d="M12 2v8" />
                    <path d="m16 6-4-4-4 4" />
                    <path d="M18 16a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-1a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v1c0 1.3-.8 2.4-2 2.8" />
                    <path d="M6 10v2a6 6 0 0 0 12 0v-2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div 
        className="p-6 max-w-md mx-auto w-full space-y-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <button
          onClick={() => navigate('/register')}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <span>Get Started</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
        
        <p className="text-center text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <button 
            onClick={() => navigate('/login')}
            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            Sign in
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default WelcomePage;