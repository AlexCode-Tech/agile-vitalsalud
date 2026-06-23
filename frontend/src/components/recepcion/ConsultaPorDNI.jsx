import React, { useState } from 'react';
import { buscarReservasPorDNI, cancelarReserva, marcarAtendida } from '../../api/reservasApi';
import validarDNI from '../../utils/validarDNI';
import { Search, Calendar, Clock, User, CheckCircle, XCircle } from 'lucide-react';

export default function ConsultaPorDNI() {
  const [dni, setDni] = useState('');
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!dni) return;

    if (!validarDNI(dni)) {
      setError('El DNI debe tener exactamente 8 digitos numericos');
      setReservas([]);
      return;
    }

    setCargando(true);
    setError('');
    setMensajeExito('');

    try {
      const data = await buscarReservasPorDNI(dni);
      setReservas(data);
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'Paciente no encontrado. Verifique el DNI ingresado.';
      setError(msg);
      setReservas([]);
    } finally {
      setCargando(false);
    }
  };

  const handleAction = async (id, actionType) => {
    try {
      if (actionType === 'atender') {
        await marcarAtendida(id);
        setMensajeExito('Cita marcada como ATENDIDA con éxito.');
      } else if (actionType === 'cancelar') {
        if (!window.confirm('¿Está seguro de que desea cancelar esta reserva?')) return;
        await cancelarReserva(id);
        setMensajeExito('Cita CANCELADA con éxito.');
      }
      
      // Recargar reservas
      const data = await buscarReservasPorDNI(dni);
      setReservas(data);
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al procesar la acción.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl glass-card border border-slate-800">
        <h3 className="text-lg font-bold font-display text-slate-200 mb-4">Buscar Reservas por DNI</h3>
        
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={dni}
              onChange={(e) => { setDni(e.target.value); setError(''); }}
              placeholder="Ingrese DNI del paciente (8 dígitos)"
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={cargando}
            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-slate-900 font-bold rounded-xl transition-all"
          >
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
      </div>

      {mensajeExito && (
        <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {reservas.length > 0 && (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-xs">
                <th className="p-4">Fecha</th>
                <th className="p-4">Hora</th>
                <th className="p-4">Médico</th>
                <th className="p-4">Especialidad</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {reservas.map((res) => {
                const cerrada = res.estado === 'atendida' || res.estado === 'cancelada';
                return (
                  <tr key={res.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-medium text-slate-200">{res.fecha}</td>
                    <td className="p-4 text-slate-300">{res.hora.slice(0, 5)}</td>
                    <td className="p-4 text-slate-300">{res.medico_nombre}</td>
                    <td className="p-4 text-slate-300">{res.medico_especialidad}</td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        res.estado === 'confirmada' ? 'bg-teal-500/20 text-teal-300' :
                        res.estado === 'pre_reserva' ? 'bg-amber-500/20 text-amber-300' :
                        res.estado === 'atendida' ? 'bg-indigo-500/20 text-indigo-300' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {res.estado}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {cerrada ? (
                        <span className="text-xs text-slate-500 italic">Esta cita ya fue cerrada.</span>
                      ) : (
                        <>
                          {res.estado === 'confirmada' && (
                            <button
                              onClick={() => handleAction(res.id, 'atender')}
                              className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded"
                            >
                              Atender
                            </button>
                          )}
                          <button
                            onClick={() => handleAction(res.id, 'cancelar')}
                            className="px-2.5 py-1 bg-red-500/10 border border-red-500/30 hover:bg-red-500 hover:text-slate-950 text-red-400 text-xs font-semibold rounded"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
