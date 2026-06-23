import React, { useEffect } from 'react';
import useCountdown from '../../hooks/useCountdown';
import { Timer, AlertTriangle } from 'lucide-react';

export default function ContadorPreReserva({ expireTime, onExpire }) {
  const { timeLeftFormatted, isExpired, isActive } = useCountdown(expireTime);

  useEffect(() => {
    if (isExpired && onExpire) {
      onExpire();
    }
  }, [isExpired, onExpire]);

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-medium">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
        <span>Tu reserva expiró. El horario fue liberado.</span>
      </div>
    );
  }

  if (!isActive) return null;

  return (
    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-semibold animate-pulse">
      <Timer className="w-5 h-5 text-amber-400 shrink-0" />
      <span>Tiempo restante para completar el pago: {timeLeftFormatted}</span>
    </div>
  );
}
