import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Fingerprint } from 'lucide-react';
import { PinInput } from '../../components/auth/PinInput';

const SetPinPage = () => {
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'set' | 'confirm'>('set');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSetPin = (enteredPin: string) => {
    setPin(enteredPin);
    setStep('confirm');
    setError('');
  };

  const handleConfirmPin = async (enteredPin: string) => {
    if (enteredPin !== pin) {
      setError('PINs do not match. Please try again.');
      setStep('set');
      return;
    }
    
    try {
      setLoading(true);
      // In a real app, you would save the PIN to the backend here
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      // setUser({ hasPin: true });
      
      // Move to next onboarding step
      navigate('/onboarding/bank-connection');
    } catch (err) {
      console.error('Error saving PIN:', err);
      setError('Failed to save PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDeviceAuth = () => {
    // This would trigger WebAuthn registration in a real app
    console.log('Using device authentication');
    // For now, just skip to the next step
    navigate('/onboarding/bank-connection');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {step === 'set' ? 'Create a 6-digit PIN' : 'Confirm your PIN'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {step === 'set' 
              ? 'Secure your account with a PIN for quick access' 
              : 'Re-enter your PIN to confirm'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <div className="w-full max-w-xs">
          {step === 'set' ? (
            <PinInput 
              length={6} 
              onComplete={handleSetPin} 
              error={!!error}
            />
          ) : (
            <PinInput 
              length={6} 
              onComplete={handleConfirmPin}
              disabled={loading}
            />
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleUseDeviceAuth}
            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            <Fingerprint className="w-5 h-5 mr-2" />
            Use device authentication instead
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="text-xs text-center text-gray-500 dark:text-gray-400">
          Your PIN is stored securely on your device and never sent to our servers.
        </div>
      </div>
    </div>
  );
};

export default SetPinPage;
