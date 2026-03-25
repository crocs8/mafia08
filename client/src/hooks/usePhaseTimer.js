import { useState, useEffect, useRef } from 'react';

export function usePhaseTimer() {
  const [timeLeft, setTimeLeft] = useState(null);
  const [phase, setPhase] = useState(null);
  const intervalRef = useRef(null);

  const startTimer = (duration, phaseName) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(duration);
    setPhase(phaseName);

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(null);
    setPhase(null);
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return { timeLeft, phase, startTimer, stopTimer };
}
