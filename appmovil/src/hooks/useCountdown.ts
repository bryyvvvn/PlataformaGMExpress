import { useState, useEffect } from 'react';

export const useCountdown = (deadlineHour: number) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const deadline = new Date();
      deadline.setHours(deadlineHour, 0, 0, 0);

      // Pateamos el límite al día siguiente si ya pasó la hora
      if (now.getHours() >= deadlineHour) {
        deadline.setDate(deadline.getDate() + 1);
      }

      const diff = deadline.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeRemaining('Plazo Cerrado');
        setIsDeadlinePassed(true);
      } else {
        const h = Math.floor((diff / 3_600_000) % 24);
        const m = Math.floor((diff / 60_000) % 60);
        const s = Math.floor((diff / 1_000) % 60);
        setTimeRemaining(`${h}h ${m}m ${s}s`);
        setIsDeadlinePassed(false);
      }
    };
    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
  }, [deadlineHour]);

  return { timeRemaining, isDeadlinePassed };
};