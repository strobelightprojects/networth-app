import { useEffect, useRef } from 'react';

export const useInactivityTimeout = (
  timeoutMs: number,
  onTimeout: () => void,
  isActive: boolean
) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onTimeout();
      }, timeoutMs);
    };

    const handleActivity = () => resetTimer();

    // Attach listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity, true);
    window.addEventListener('touchstart', handleActivity);

    // Initial set
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity, true);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [timeoutMs, onTimeout, isActive]);
};
