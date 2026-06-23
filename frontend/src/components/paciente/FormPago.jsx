import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { confirmarPagoMercadoPago, crearPreferenciaMercadoPago } from '../../api/reservasApi';
import { AlertCircle, Calendar, CheckCircle, Clock, ExternalLink, Loader2, Printer, ReceiptText, Stethoscope, Wallet, XCircle } from 'lucide-react';

const formatFecha = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-PE', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatMonto = (monto, moneda = 'PEN') => {
  const symbol = moneda === 'PEN' ? 'S/.' : moneda;
  return `${symbol} ${Number(monto || 0).toFixed(2)}`;
};

export default function FormPago() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [preferencia, setPreferencia] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState('');

  const paymentId = useMemo(
    () => searchParams.get('payment_id') || searchParams.get('collection_id'),
    [searchParams]
  );
  const preferenceId = useMemo(() => searchParams.get('preference_id'), [searchParams]);
  const mpStatus = useMemo(
    () => searchParams.get('mp_status') || searchParams.get('status') || searchParams.get('collection_status'),
    [searchParams]
  );
  const [puedeReintentar, setPuedeReintentar] = useState(false);

  useEffect(() => {
    const confirmarRetornoMercadoPago = async () => {
      if (!paymentId && !mpStatus) return false;

      // Si Yape u otro medio rechazó sin paymentId, no llamar al backend a “confirmar”
      // Solo mostrar el error y permitir reintentar cargando la preferencia de nuevo
      if (!paymentId && (mpStatus === 'failure' || mpStatus === 'rejected')) {
        setError('El pago fue rechazado por Yape u otro medio. Puedes intentar con otro método de pago.');
        setPuedeReintentar(true);
        return false; // No marcar como procesado → continuar a cargar preferencia
      }

      if (!paymentId && mpStatus === 'cancelled') {
        setError('Cancelaste el proceso de pago. El horario fue liberado.');
        setPuedeReintentar(false);
        return true;
      }

      setConfirmando(true);
      setError('');

      try {
        const res = await confirmarPagoMercadoPago(id, {
          paymentId,
          preferenceId,
          status: mpStatus,
        });

        setTicket(res.ticket);
        localStorage.removeItem('vitalsalud_countdown_expire');
        localStorage.removeItem('vitalsalud_pre_reserva_id');
        return true;
      } catch (err) {
        const data = err.response?.data;
        if (data?.puedeReintentar) {
          setError(data.mensaje || 'Pago rechazado. Puedes intentar con otro medio.');
          setPuedeReintentar(true);
          return false; // Permitir recargar la preferencia
        }
        setError(data?.mensaje || 'Mercado Pago no aprobo el pago. La cita no fue reservada.');
        return true;
      } finally {
        setConfirmando(false);
      }
    };

    const cargarPreferencia = async () => {
      setCargando(true);
      setError('');

      const retornoProcesado = await confirmarRetornoMercadoPago();
      if (retornoProcesado) {
        setCargando(false);
        return;
      }

      try {
        const data = await crearPreferenciaMercadoPago(id);
        setPreferencia(data);
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudo iniciar el pago con Mercado Pago.');
      } finally {
        setCargando(false);
      }
    };

    cargarPreferencia();
  }, [id, mpStatus, paymentId, preferenceId]);

  const imprimirTicket = () => {
    window.print();
  };

  if (cargando || confirmando) {
    return (
      <div className="w-full max-w-lg mx-auto p-8 rounded-3xl glass-panel border border-slate-800 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-slate-100">
          {confirmando ? 'Confirmando pago con Mercado Pago' : 'Preparando Mercado Pago'}
        </h2>
        <p className="text-sm text-slate-400">Estamos validando la reserva antes de continuar.</p>
      </div>
    );
  }

  if (ticket) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="p-5 rounded-2xl bg-teal-500/10 border border-teal-500/25 text-teal-100 flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-teal-300 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-bold text-slate-100">Pago aprobado. Cita confirmada.</h2>
            <p className="text-sm text-teal-100/80">Este es tu ticket de reserva.</p>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 print:bg-white print:text-slate-950 print:border-slate-300">
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4 mb-5 print:border-slate-300">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-bold print:text-slate-600">VitalSalud</p>
              <h3 className="text-2xl font-extrabold text-slate-100 print:text-slate-950">Ticket de Reserva</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-semibold">Codigo</p>
              <p className="font-mono text-teal-300 font-bold print:text-slate-950">{ticket.codigo}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <TicketRow label="Paciente" value={ticket.paciente} />
            <TicketRow label="DNI" value={ticket.dni} />
            <TicketRow label="Medico" value={ticket.medico} icon={<Stethoscope className="w-4 h-4" />} />
            <TicketRow label="Especialidad" value={ticket.especialidad} />
            <TicketRow label="Fecha" value={formatFecha(ticket.fecha)} icon={<Calendar className="w-4 h-4" />} />
            <TicketRow label="Hora" value={ticket.hora} icon={<Clock className="w-4 h-4" />} />
            <TicketRow label="Monto pagado" value={formatMonto(ticket.monto, ticket.moneda)} />
            <TicketRow label="Pago Mercado Pago" value={ticket.paymentId} />
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-3 print:hidden">
          <button
            type="button"
            onClick={imprimirTicket}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 transition-all font-semibold"
          >
            <Printer className="w-4 h-4" />
            Imprimir ticket
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/paciente/citas')}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold hover:from-teal-600 hover:to-emerald-600 transition-all"
          >
            Ver mis citas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-3 rounded-xl bg-teal-500/10">
          <Wallet className="w-6 h-6 text-teal-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-100 mb-1">Completar Pago de Reserva</h2>
          <p className="text-sm text-slate-400">Paga con Mercado Pago para confirmar tu cita.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium flex items-start gap-2">
          <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{error}</span>
            {puedeReintentar && preferencia?.initPoint && (
              <p className="mt-1 text-red-300/70 text-xs">Selecciona otro método de pago en el botón de abajo.</p>
            )}
          </div>
        </div>
      )}

      {preferencia?.reserva && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Monto a pagar</span>
            <span className="text-xl font-extrabold text-teal-300">{formatMonto(preferencia.monto)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
            <span>{formatFecha(preferencia.reserva.fecha)}</span>
            <span>{preferencia.reserva.hora}</span>
            <span className="col-span-2">{preferencia.reserva.medico}</span>
            <span className="col-span-2 text-slate-400">{preferencia.reserva.especialidad}</span>
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-400 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
        <span>La cita solo se confirma cuando Mercado Pago devuelve un pago aprobado. Si cancelas o el pago falla, no se reserva la cita.</span>
      </div>

      <a
        href={preferencia?.initPoint || '#'}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all ${
          preferencia?.initPoint
            ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950'
            : 'bg-slate-800 text-slate-500 pointer-events-none'
        }`}
      >
        <ReceiptText className="w-5 h-5" />
        Pagar con Mercado Pago
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}

function TicketRow({ label, value, icon }) {
  return (
    <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3 print:bg-slate-50 print:border-slate-200">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">{label}</p>
      <div className="flex items-center gap-2 text-slate-100 font-semibold print:text-slate-950">
        {icon && <span className="text-teal-300 print:text-slate-700">{icon}</span>}
        <span>{value || '-'}</span>
      </div>
    </div>
  );
}
