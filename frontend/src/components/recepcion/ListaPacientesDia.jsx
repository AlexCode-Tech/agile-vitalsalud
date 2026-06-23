import React, { useEffect, useMemo, useState } from 'react';
import { obtenerPacientesDia } from '../../api/recepcionApi';
import { cancelarReserva, marcarAtendida } from '../../api/reservasApi';
import { obtenerHorarios } from '../../api/horariosApi';
import { Calendar, CheckCircle, Clock, Users, Search, X, Filter, User, RefreshCw } from 'lucide-react';

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const getDiaFromDateInput = (fecha) => {
  const date = new Date(`${fecha}T00:00:00`);
  return diasSemana[date.getDay()];
};

const getEstadoHorario = (config, dia, turno) => {
  const keyEstado = turno ? `${dia}-${turno.horaInicio}` : dia;
  return (config.diasEstado?.[keyEstado] || 'activo').toLowerCase();
};

const normalizarCmp = (colegiatura) => (colegiatura ? colegiatura.replace(/^CMP/i, '') : '-');

export default function ListaPacientesDia() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [pacientes, setPacientes] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoHorarios, setCargandoHorarios] = useState(true);
  const [errorHorarios, setErrorHorarios] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const [filtroDni, setFiltroDni] = useState('');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroTicket, setFiltroTicket] = useState('');

  const loadPacientes = async () => {
    setCargando(true);
    try {
      const data = await obtenerPacientesDia(fecha);
      setPacientes(data);
    } catch (err) {
      setPacientes([]);
    } finally {
      setCargando(false);
    }
  };

  const loadHorarios = async ({ silent = false } = {}) => {
    if (!silent) setCargandoHorarios(true);
    setErrorHorarios('');
    try {
      const data = await obtenerHorarios();
      setHorarios(data);
    } catch (err) {
      setHorarios([]);
      setErrorHorarios('No se pudieron cargar los horarios configurados por administración.');
    } finally {
      setCargandoHorarios(false);
    }
  };

  useEffect(() => {
    loadPacientes();
  }, [fecha]);

  useEffect(() => {
    loadHorarios();
    const intervalId = window.setInterval(() => loadHorarios({ silent: true }), 30000);
    return () => window.clearInterval(intervalId);
  }, []);

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
      loadPacientes();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al procesar la acción.');
    }
  };

  const limpiarFiltros = () => {
    setFiltroDni('');
    setFiltroNombre('');
    setFiltroTicket('');
  };

  const hayFiltros = filtroDni || filtroNombre || filtroTicket;

  const pacientesFiltrados = pacientes.filter(pac => {
    const matchDni = !filtroDni ||
      (pac.paciente_dni && pac.paciente_dni.toLowerCase().includes(filtroDni.toLowerCase()));
    const matchNombre = !filtroNombre ||
      (pac.paciente_nombre && pac.paciente_nombre.toLowerCase().includes(filtroNombre.toLowerCase()));
    const matchTicket = !filtroTicket ||
      String(pac.id).includes(filtroTicket.trim());
    return matchDni && matchNombre && matchTicket;
  });

  const diaSeleccionado = getDiaFromDateInput(fecha);

  const horariosDelDia = useMemo(() => horarios.flatMap(config => {
    const dias = Array.isArray(config.dias) ? config.dias : [];
    const turnos = Array.isArray(config.turnosRaw) ? config.turnosRaw : [];
    if (!dias.includes(diaSeleccionado)) return [];

    return turnos.map((turno, turnoIdx) => ({
      id: `${config.id}-${diaSeleccionado}-${turno.horaInicio}-${turnoIdx}`,
      medico: config.medico,
      cmp: normalizarCmp(config.colegiatura),
      dia: diaSeleccionado,
      horaInicio: turno.horaInicio,
      horaFin: turno.horaFin,
      duracion: config.duracion,
      estadoMedico: config.estadoMedico || 'activo',
      estadoHorario: getEstadoHorario(config, diaSeleccionado, turno),
    }));
  }).sort((a, b) => {
    const cmpHora = a.horaInicio.localeCompare(b.horaInicio);
    return cmpHora !== 0 ? cmpHora : a.medico.localeCompare(b.medico);
  }), [horarios, diaSeleccionado]);

  const recargarTodo = () => {
    loadPacientes();
    loadHorarios();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl glass-card border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/10 rounded-xl text-teal-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display text-slate-200">Pacientes Programados</h3>
            <p className="text-xs text-slate-400">Listado de consultas registradas por día</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={recargarTodo}
            disabled={cargando || cargandoHorarios}
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-teal-400 hover:border-teal-500/40 transition-all disabled:opacity-50"
            title="Actualizar citas y horarios"
          >
            <RefreshCw className={`w-4 h-4 ${cargando || cargandoHorarios ? 'animate-spin' : ''}`} />
          </button>
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg focus:outline-none focus:border-teal-500 [color-scheme:dark]"
          />
        </div>
      </div>

      <div className="p-4 rounded-2xl glass-card border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Filter className="w-4 h-4 text-teal-400" />
            <span>Filtrar citas</span>
          </div>
          {hayFiltros && (
            <button
              onClick={limpiarFiltros}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-bold transition-all"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={filtroDni}
              onChange={(e) => setFiltroDni(e.target.value)}
              placeholder="Buscar por DNI..."
              className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={filtroTicket}
              onChange={(e) => setFiltroTicket(e.target.value)}
              placeholder="Buscar por N° de ticket..."
              className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        {hayFiltros && (
          <p className="text-[11px] text-slate-500">
            Mostrando <span className="text-teal-400 font-bold">{pacientesFiltrados.length}</span> de{' '}
            <span className="text-slate-400 font-bold">{pacientes.length}</span> cita(s)
          </p>
        )}
      </div>

      {mensajeExito && (
        <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {cargando ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-400"></div>
        </div>
      ) : pacientesFiltrados.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-card border border-slate-800/60">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">
            {hayFiltros
              ? 'No se encontraron citas con los filtros aplicados.'
              : 'No hay pacientes programados para esta fecha.'}
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-xs">
                <th className="p-4">N° Ticket</th>
                <th className="p-4">Hora</th>
                <th className="p-4">Paciente (DNI)</th>
                <th className="p-4">Médico</th>
                <th className="p-4">Especialidad</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {pacientesFiltrados.map((pac) => {
                const cerrada = pac.estado === 'atendida' || pac.estado === 'cancelada';

                return (
                  <tr key={pac.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                        #{pac.id}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-teal-400">{pac.hora.slice(0, 5)}</td>
                    <td className="p-4">
                      <p className="text-slate-200 font-medium">{pac.paciente_nombre}</p>
                      <span className="text-xs text-slate-500">DNI: {pac.paciente_dni}</span>
                    </td>
                    <td className="p-4 text-slate-300">{pac.medico_nombre}</td>
                    <td className="p-4 text-slate-300">{pac.medico_especialidad}</td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        pac.estado === 'confirmada' ? 'bg-teal-500/20 text-teal-300' :
                        pac.estado === 'pre_reserva' ? 'bg-amber-500/20 text-amber-300' :
                        pac.estado === 'atendida' ? 'bg-indigo-500/20 text-indigo-300' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {pac.estado}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {cerrada ? (
                        <span className="text-xs text-slate-500 italic">Esta cita ya fue cerrada.</span>
                      ) : (
                        <>
                          {pac.estado === 'confirmada' && (
                            <button
                              onClick={() => handleAction(pac.id, 'atender')}
                              className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded transition-colors"
                            >
                              Atender
                            </button>
                          )}
                          <button
                            onClick={() => handleAction(pac.id, 'cancelar')}
                            className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-slate-950 text-red-400 text-xs font-semibold rounded transition-all"
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

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-400" />
              Horarios de Atención del Día
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Disponibilidad configurada por administración para {diaSeleccionado}. Se actualiza automáticamente cada 30 segundos.
            </p>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 w-fit">
            {horariosDelDia.length} turno(s)
          </span>
        </div>

        {errorHorarios && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium">
            {errorHorarios}
          </div>
        )}

        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-xs">
                  <th className="p-4">CMP</th>
                  <th className="p-4">Médico</th>
                  <th className="p-4">Día</th>
                  <th className="p-4">Hora de Entrada</th>
                  <th className="p-4">Hora de Salida</th>
                  <th className="p-4">Frecuencia</th>
                  <th className="p-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {cargandoHorarios ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500 font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                        Cargando horarios...
                      </div>
                    </td>
                  </tr>
                ) : horariosDelDia.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500 font-medium">
                      No hay horarios configurados para {diaSeleccionado}.
                    </td>
                  </tr>
                ) : (
                  horariosDelDia.map(horario => {
                    const medicoInactivo = horario.estadoMedico === 'inactivo';
                    const horarioAusente = horario.estadoHorario === 'ausente';
                    const fueraServicio = medicoInactivo || horarioAusente;

                    return (
                      <tr key={horario.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-4 font-mono text-xs text-slate-500">{horario.cmp}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <span className="font-semibold text-slate-200 leading-tight">{horario.medico}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[11px] font-semibold whitespace-nowrap">
                            {horario.dia}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex font-mono text-xs text-teal-300 bg-teal-500/8 border border-teal-500/15 rounded-md px-2 py-0.5 w-fit">
                            {horario.horaInicio}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex font-mono text-xs text-slate-300 bg-slate-800/60 border border-slate-700/30 rounded-md px-2 py-0.5 w-fit">
                            {horario.horaFin}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 font-medium whitespace-nowrap">{horario.duracion}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            fueraServicio
                              ? 'bg-red-500/10 border-red-500/30 text-red-400'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${fueraServicio ? 'bg-red-400' : 'bg-emerald-400'}`} />
                            {medicoInactivo ? 'Médico inactivo' : horarioAusente ? 'Ausente' : 'Activo'}
                          </span>
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
    </div>
  );
}
