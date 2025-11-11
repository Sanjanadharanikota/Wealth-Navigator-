import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

type PinInputProps = {
  length?: number;
  onComplete: (pin: string) => void;
  error?: boolean;
  disabled?: boolean;
};

export const PinInput = ({
  length = 6,
  onComplete,
  error = false,
  disabled = false,
}: PinInputProps) => {
  const [pin, setPin] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;
    
    // Update pin
    const newPin = [...pin];
    newPin[index] = value.slice(-1); // Only take the last character
    setPin(newPin);

    // Move to next input or complete
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Check if all inputs are filled
    if (newPin.every(digit => digit !== '')) {
      onComplete(newPin.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    const numbers = paste.replace(/\D/g, '').split('').slice(0, length);
    
    if (numbers.length === length) {
      setPin(numbers);
      onComplete(numbers.join(''));
    }
  };

  return (
    <div className="flex justify-center gap-2 md:gap-3">
      {Array.from({ length }).map((_, index) => (
        <motion.div
          key={index}
          className={`relative w-12 h-16 md:w-16 md:h-20 rounded-xl flex items-center justify-center text-2xl font-bold
            ${error ? 'bg-red-100 dark:bg-red-900/50' : 'bg-gray-100 dark:bg-gray-800'}
            ${disabled ? 'opacity-60' : ''}`}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <input
            ref={el => inputRefs.current[index] = el}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={pin[index] || ''}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            disabled={disabled}
            className="w-full h-full text-center bg-transparent outline-none text-gray-800 dark:text-white"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
          />
          {/* Animated focus ring */}
          <motion.div 
            className="absolute inset-0 rounded-xl border-2 border-transparent"
            animate={document.activeElement === inputRefs.current[index] 
              ? { borderColor: '#6366f1' } 
              : { borderColor: 'transparent' }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>
      ))}
    </div>
  );
};
