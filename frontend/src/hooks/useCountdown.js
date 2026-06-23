import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para manejar la cuenta regresiva de la pre-reserva (20 minutos).
 * Guarda la fecha de expiración en localStorage para que persista al recargar (RN-02).
 */
export default function useCountdown(initialExpireTime = null) {
  const [expireTime, setExpireTime] = useState(() => {
    if (initialExpireTime) {
      const date = new Date(initialExpireTime).getTime();
      localStorage.setItem('vitalsalud_countdown_expire', date.toString());
      return date;
    }
    const saved = localStorage.getItem('vitalsalud_countdown_expire');
    return saved ? parseInt(saved, 10) : null;
  });

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (initialExpireTime) {
      const date = new Date(initialExpireTime).getTime();
      localStorage.setItem('vitalsalud_countdown_expire', date.toString());
      setExpireTime(date);
    }
  }, [initialExpireTime]);

  useEffect(() => {
    if (!expireTime) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const diff = expireTime - Date.now();
      return diff > 0 ? diff : 0;
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expireTime]);

  const startTimer = useCallback((newExpireTime) => {
    const date = new Date(newExpireTime).getTime();
    localStorage.setItem('vitalsalud_countdown_expire', date.toString());
    setExpireTime(date);
  }, []);

  const clearTimer = useCallback(() => {
    localStorage.removeItem('vitalsalud_countdown_expire');
    setExpireTime(null);
    setTimeLeft(0);
  }, []);

  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);
  const isExpired = expireTime ? timeLeft <= 0 : false;
  const isActive = !!expireTime && timeLeft > 0;

  return {
    minutes,
    seconds,
    isExpired,
    isActive,
    startTimer,
    clearTimer,
    timeLeftFormatted: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  };
}
