import React, { useState, useEffect } from 'react';
import { obtenerHorarios, eliminarHorario, toggleDiaEstadoHorario } from '../../api/horariosApi';
import { Calendar, User, Trash2, Filter, Loader2, Search, Check, AlertCircle } from 'lucide-react';

export default function VerHorarios() {
  const [configs, setConfigs]           = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [mensaje, setMensaje]           = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, nombreMedico: '' });
  const [eliminandoId, setEliminandoId] = useState(null);
  const [toggling, setToggling]         = useState(null); // clave 'horarioId-dia'

  // ─── Filtros ────────────────────────────────────────────────────────────────
  const [filtroCMP,       setFiltroCMP]       = useState('');
  const [filtroNombre,    setFiltroNombre]    = useState('');
  const [filtroDia,       setFiltroDia]       = useState('');
  const [filtroHoraDesde, setFiltroHoraDesde] = useState('');
  const [filtroHoraHasta, setFiltroHoraHasta] = useState('');
  const [filtroEstado,    setFiltroEstado]    = useState('todos');

  const cargarHorarios = async () => {
    try {
      const horData = await obtenerHorarios();
      setConfigs(horData);
    } catch (err) {
      console.error('Error al cargar horarios:', err);
    }
  };

  useEffect(() => {
    (async () => {
      setCargando(true);
      await cargarHorarios();
      setCargando(false);
    })();
  }, []);

  const pedirConfirmacion = (id, nombreMedico) =>
    setConfirmModal({ open: true, id, nombreMedico });

  const confirmarEliminar = async () => {
    const { id, nombreMedico } = confirmModal;
    setConfirmModal({ open: false, id: null, nombreMedico: '' });
    setEliminandoId(id);
    try {
      await eliminarHorario(id);
      setConfigs(prev => prev.filter(c => c.id !== id));
      setMensaje(`Horario de "${nombreMedico}" eliminado correctamente.`);
    } catch {
      setMensaje(`Error: No se pudo eliminar el horario de "${nombreMedico}".`);
      await cargarHorarios();
    } finally {
      setEliminandoId(null);
      setTimeout(() => setMensaje(''), 4000);
    }
  };

  const handleToggleDia = async (horarioId, dia, turno) => {
    const keyEstado = turno ? `${dia}-${turno.horaInicio}` : dia;
    const key = `${horarioId}-${keyEstado}`;
    if (toggling === key) return;
    setToggling(key);
    try {
      const { estado } = await toggleDiaEstadoHorario(horarioId, keyEstado);
      // Actualizar solo el horario y la clave de estado afectada
      setConfigs(prev => prev.map(c => {
        if (c.id !== horarioId) return c;
        return { ...c, diasEstado: { ...(c.diasEstado || {}), [keyEstado]: estado } };
      }));
    } catch {
      setMensaje('Error: No se pudo actualizar el estado.');
      setTimeout(() => setMensaje(''), 4000);
    } finally {
      setToggling(null);
    }
  };

  const hayFiltros = !!(filtroCMP || filtroNombre || filtroDia || filtroHoraDesde || filtroHoraHasta || filtroEstado !== 'todos');

  // Generar lista plana de todas las filas individuales (combinaciones de día y turno)
  const todasLasFilas = configs.flatMap(c => {
    const dias   = Array.isArray(c.dias)     ? c.dias     : [];
    const turnos = Array.isArray(c.turnosRaw) ? c.turnosRaw : [];
    const cmp    = c.colegiatura ? c.colegiatura.replace(/^CMP/i, '') : '—';

    const combinations = [];
    dias.forEach((dia, diaIdx) => {
      if (turnos.length === 0) {
        combinations.push({ config: c, cmp, dia, diaIdx, turno: null, turnoIdx: 0 });
      } else {
        turnos.forEach((turno, turnoIdx) => {
          combinations.push({ config: c, cmp, dia, diaIdx, turno, turnoIdx });
        });
      }
    });
    return combinations;
  });

  const filasFiltradas = todasLasFilas.filter(rowItem => {
    const c = rowItem.config;
    if (filtroCMP) {
      if (!rowItem.cmp.includes(filtroCMP.trim())) return false;
    }
    if (filtroNombre && !c.medico.toUpperCase().includes(filtroNombre.toUpperCase().trim())) return false;
    if (filtroDia && rowItem.dia !== filtroDia) return false;
    if (filtroHoraDesde) {
      if (!rowItem.turno || rowItem.turno.horaInicio < filtroHoraDesde) return false;
    }
    if (filtroHoraHasta) {
      if (!rowItem.turno || rowItem.turno.horaFin > filtroHoraHasta) return false;
    }
    if (filtroEstado !== 'todos' && (c.estadoMedico || 'activo') !== filtroEstado) return false;
    return true;
  });

  const limpiarFiltros = () => {
    setFiltroCMP(''); setFiltroNombre(''); setFiltroDia('');
    setFiltroHoraDesde(''); setFiltroHoraHasta('');
    setFiltroEstado('todos');
  };

  return (
    <div className="space-y-6">

      {/* Modal confirmación eliminar */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Eliminar Horario</h3>
            </div>
            <p className="text-sm text-slate-300 mb-2">¿Estás seguro de eliminar el horario de:</p>
            <p className="text-sm font-semibold text-red-300 mb-4 pl-2 border-l-2 border-red-500/40">
              {confirmModal.nombreMedico}
            </p>
            <p className="text-xs text-slate-500 mb-6">
              Esta acción eliminará el horario permanentemente de la base de datos y no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ open: false, id: null, nombreMedico: '' })}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all text-sm flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encabezado */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-teal-400" />
          Ver Horarios
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Consulte y administre los horarios de atención activos de todos los médicos.
        </p>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium ${
          mensaje.startsWith('Error')
            ? 'bg-red-500/10 border border-red-500/20 text-red-300'
            : 'bg-teal-500/10 border border-teal-500/20 text-teal-300'
        }`}>
          {mensaje.startsWith('Error')
            ? <AlertCircle className="w-5 h-5 shrink-0" />
            : <Check className="w-5 h-5 shrink-0" />}
          <span>{mensaje}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/20">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider w-full mb-0.5">
          <Filter className="w-4 h-4 text-teal-400" />
          <span>Filtros:</span>
        </div>

        {/* CMP */}
        <div className="flex flex-col gap-1.5 min-w-[120px]">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CMP</span>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={filtroCMP}
              onChange={e => setFiltroCMP(e.target.value)}
              placeholder="N° CMP..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        {/* Nombre */}
        <div className="flex flex-col gap-1.5 min-w-[180px] flex-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Nombre del Médico</span>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={filtroNombre}
              onChange={e => setFiltroNombre(e.target.value)}
              placeholder="Buscar médico..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[140px] flex-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Día</span>
          <select
            value={filtroDia}
            onChange={e => setFiltroDia(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500 cursor-pointer transition-colors"
          >
            <option value="">Todos los días</option>
            {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[120px]">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Horario Desde</span>
          <input
            type="time"
            value={filtroHoraDesde}
            onChange={e => setFiltroHoraDesde(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500 transition-colors [color-scheme:dark]"
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[120px]">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Horario Hasta</span>
          <input
            type="time"
            value={filtroHoraHasta}
            onChange={e => setFiltroHoraHasta(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500 transition-colors [color-scheme:dark]"
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[130px]">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Estado</span>
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500 cursor-pointer transition-colors"
          >
            <option value="todos">Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>

        {hayFiltros && (
          <button
            onClick={limpiarFiltros}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-xl text-xs font-bold transition-all self-end"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ─── Tabla ──────────────────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">CMP</th>
                <th className="p-4">Médico</th>
                <th className="p-4">Día</th>
                <th className="p-4">Hora de Entrada</th>
                <th className="p-4">Hora de Salida</th>
                <th className="p-4">Frecuencia</th>
                <th className="p-4">Estado</th>
                <th className="p-4 pr-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {cargando ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                      Cargando horarios...
                    </div>
                  </td>
                </tr>
              ) : filasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500 font-medium">
                    {configs.length === 0
                      ? 'No hay horarios de atención registrados'
                      : 'No se encontraron horarios con los filtros aplicados'}
                  </td>
                </tr>
              ) : (
                filasFiltradas.map((rowItem, idx) => {
                  const c = rowItem.config;
                  const { dia, turno, turnoIdx } = rowItem;
                  const cmp = rowItem.cmp;

                  // Línea separadora más gruesa al terminar el último día/turno del médico en la lista filtrada
                  const esUltimo = idx === filasFiltradas.length - 1 || filasFiltradas[idx + 1].config.id !== c.id;

                  return (
                    <tr
                      key={`${c.id}-${dia}-${turnoIdx}`}
                      className={`hover:bg-slate-900/30 transition-colors ${
                        esUltimo
                          ? 'border-b-2 border-slate-700/60'
                          : 'border-b border-slate-800/30'
                      }`}
                    >
                      {/* CMP */}
                      <td className="p-4 pl-6 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {cmp}
                      </td>

                      {/* Médico */}
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                          <span className="font-semibold text-slate-200 leading-tight">{c.medico}</span>
                        </div>
                      </td>

                      {/* Día */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[11px] font-semibold whitespace-nowrap">
                          {dia}
                        </span>
                      </td>

                      {/* Hora de Entrada */}
                      <td className="p-4">
                        {turno ? (
                          <span className="inline-flex font-mono text-xs text-teal-300 bg-teal-500/8 border border-teal-500/15 rounded-md px-2 py-0.5 w-fit">
                            {turno.horaInicio}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Hora de Salida */}
                      <td className="p-4">
                        {turno ? (
                          <span className="inline-flex font-mono text-xs text-slate-300 bg-slate-800/60 border border-slate-700/30 rounded-md px-2 py-0.5 w-fit">
                            {turno.horaFin}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Frecuencia */}
                      <td className="p-4 text-slate-400 font-medium whitespace-nowrap">
                        {c.duracion}
                      </td>

                      {/* Estado — botón toggle Activo ↔ Ausente (por fila/día/turno) */}
                      <td className="p-4">
                        {(() => {
                          const keyEstado  = turno ? `${dia}-${turno.horaInicio}` : dia;
                          const key        = `${c.id}-${keyEstado}`;
                          const est        = (c.diasEstado?.[keyEstado] || 'activo').toLowerCase();
                          const isAusente  = est === 'ausente';
                          const isLoading  = toggling === key;
                          return (
                            <button
                              type="button"
                              onClick={() => handleToggleDia(c.id, dia, turno)}
                              disabled={isLoading}
                              title={isAusente ? 'Marcar como Activo' : 'Marcar como Ausente'}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                                isAusente
                                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/25 hover:border-red-500/60'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500/60'
                              }`}
                            >
                              {isLoading
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <span className={`w-1.5 h-1.5 rounded-full ${isAusente ? 'bg-red-400' : 'bg-emerald-400'}`} />}
                              {isLoading ? '...' : (isAusente ? 'Ausente' : 'Activo')}
                            </button>
                          );
                        })()}
                      </td>

                      {/* Acciones */}
                      <td className="p-4 pr-6 text-right">
                        <button
                          type="button"
                          onClick={() => pedirConfirmacion(c.id, c.medico)}
                          disabled={eliminandoId === c.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/25 hover:border-red-500/50 hover:text-red-300 transition-all text-xs font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {eliminandoId === c.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                          {eliminandoId === c.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
