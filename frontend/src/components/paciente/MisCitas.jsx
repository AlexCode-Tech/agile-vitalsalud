import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerMisCitas, cancelarReserva } from '../../api/reservasApi';
import { Calendar, Clock, User, Award, CheckCircle, AlertTriangle, XCircle, Trash2 } from 'lucide-react';

export default function MisCitas() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadCitas = async () => {
    try {
      const data = await obtenerMisCitas();
      const listaCitas = Array.isArray(data) ? data : (data?.reservas || []);
      setCitas(listaCitas);
    } catch (err) {
      setError('Error al cargar la agenda de citas.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    loadCitas();
  }, []);

  const handleCancelar = async (id, fecha, hora) => {
    if (!window.confirm('¿Está seguro de que desea cancelar esta cita?')) return;

    try {
      await cancelarReserva(id);
      alert('Cita cancelada con éxito.');
      loadCitas();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al cancelar la cita.');
    }
  };

  // RN-09: Validar si faltan más de 2 horas para la cita
  const sePuedeCancelar = (fecha, hora) => {
    const horaCita = new Date(`${fecha}T${hora}`);
    const dosHorasAntes = new Date(horaCita.getTime() - 2 * 60 * 60 * 1000);
    return new Date() < dosHorasAntes;
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display text-slate-100 mb-1">Mis Citas Médicas</h2>
        <p className="text-sm text-slate-400">Consulta tu historial de reservas y el estado de tus consultas</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium">
          {error}
        </div>
      )}

      {citas.length === 0 ? (
        <div className="p-12 text-center rounded-3xl glass-panel border border-slate-800 space-y-4">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-lg text-slate-300 font-semibold">No tienes citas programadas.</p>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">Comienza reservando tu primera consulta con cualquiera de nuestros especialistas.</p>
          <button
            onClick={() => navigate('/dashboard/paciente/reservar')}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-900 font-bold rounded-xl transition-all"
          >
            Reservar una cita ahora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {citas.map((cita) => {
            const puedeCancelar = sePuedeCancelar(cita.fecha, cita.hora);
            
            return (
              <div 
                key={cita.id}
                className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 hover:border-slate-700/50 transition-all"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                  {/* Fecha y Hora */}
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-teal-400 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Fecha</p>
                      <p className="text-sm text-slate-200 font-medium">{cita.fecha}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-teal-400 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Hora</p>
                      <p className="text-sm text-slate-200 font-medium">{cita.hora.slice(0, 5)}</p>
                    </div>
                  </div>

                  {/* Médico y Especialidad */}
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-teal-400 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Médico</p>
                      <p className="text-sm text-slate-200 font-medium">{cita.medico_nombre}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-teal-400 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Especialidad</p>
                      <p className="text-sm text-slate-200 font-medium">{cita.medico_especialidad}</p>
                    </div>
                  </div>
                </div>

                {/* Estado y Acciones */}
                <div className="flex items-center justify-between md:justify-end gap-4 border-t border-slate-800 md:border-none pt-4 md:pt-0">
                  {/* Estado Badge */}
                  <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                    cita.estado === 'confirmada' ? 'bg-teal-500/20 text-teal-300' :
                    cita.estado === 'pre_reserva' ? 'bg-amber-500/20 text-amber-300' :
                    cita.estado === 'atendida' ? 'bg-indigo-500/20 text-indigo-300' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {cita.estado}
                  </span>

                  {/* Botón de Cancelación */}
                  {cita.estado === 'confirmada' && (
                    <button
                      onClick={() => handleCancelar(cita.id, cita.fecha, cita.hora)}
                      disabled={!puedeCancelar}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        puedeCancelar 
                          ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-slate-900'
                          : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                      title={!puedeCancelar ? 'Las citas solo pueden cancelarse hasta 2 horas antes.' : ''}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
