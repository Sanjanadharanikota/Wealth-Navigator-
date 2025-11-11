import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { ChevronLeft } from 'lucide-react';

const OnboardingLayout = () => {
  const navigate = useNavigate();
  const { onboardingStatus } = useAuthStore();

  // Steps for the progress indicator
  const steps = [
    { id: 'set-pin', name: 'Set Up PIN' },
    { id: 'bank-connection', name: 'Connect Bank' },
  ];

  // Calculate progress percentage
  const currentStepIndex = steps.findIndex(step => step.id === onboardingStatus?.nextStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header with progress */}
      <header className="pt-8 pb-4 px-4 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Step {currentStepIndex + 1} of {steps.length}
          </div>
          
          <div className="w-6"></div> {/* Spacer for flex alignment */}
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        
        {/* Step indicators */}
        <div className="flex justify-between mt-6">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`text-center flex-1 ${index < steps.length - 1 ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}
            >
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index < currentStepIndex 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                  : index === currentStepIndex
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {index < currentStepIndex ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <div className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                {step.name}
              </div>
            </div>
          ))}
        </div>
      </header>
      
      {/* Page content */}
      <main className="px-4 pb-8 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default OnboardingLayout;
