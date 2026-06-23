import React, { useState, useEffect } from 'react';
import { obtenerMedicosActivos } from '../../api/medicosApi';
import { obtenerEspecialidades } from '../../api/especialidadesApi';
import { guardarHorario } from '../../api/horariosApi';
import { Clock, Check, AlertCircle, Save, CalendarRange, Plus, X } from 'lucide-react';

export default function ConfigurarHorarios() {
  const [medicos, setMedicos]                   = useState([]);
  const [especialidades, setEspecialidades]     = useState([]);
  const [selectedEspecialidad, setSelectedEspecialidad] = useState('');
  const [selectedMedico, setSelectedMedico]     = useState('');
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [turnos, setTurnos]                     = useState([{ horaInicio: '08:00', horaFin: '14:00' }]);
  const [duracionCita, setDuracionCita]         = useState('30');
  const [mensaje, setMensaje]                   = useState('');
  const [guardando, setGuardando]               = useState(false);

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  useEffect(() => {
    (async () => {
      try {
        const [medData, espData] = await Promise.all([
          obtenerMedicosActivos(),
          obtenerEspecialidades()
        ]);
        setMedicos(medData);
        setEspecialidades(espData);
      } catch (err) {
        console.error('Error al cargar datos:', err);
      }
    })();
  }, []);

  const handleMedicoChange = (medicoId) => {
    setSelectedMedico(medicoId);
    if (!medicoId) return;
    const medico = medicos.find(m => m.id === parseInt(medicoId));
    if (medico) {
      const esp = especialidades.find(e => e.nombre === medico.especialidad);
      if (esp) setDuracionCita(esp.duracion.toString());
    }
  };

  const toggleDia = (dia) =>
    setDiasSeleccionados(prev =>
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    );

  const addTurno    = () => setTurnos(prev => [...prev, { horaInicio: '08:00', horaFin: '14:00' }]);
  const removeTurno = (idx) => setTurnos(prev => prev.filter((_, i) => i !== idx));
  const updateTurno = (idx, field, value) =>
    setTurnos(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!selectedMedico) { setMensaje('Error: Debe seleccionar un médico.'); return; }
    if (diasSeleccionados.length === 0) { setMensaje('Error: Debe seleccionar al menos un día.'); return; }

    const medicoName  = medicos.find(m => m.id === parseInt(selectedMedico))?.nombre;
    const horasResumen = turnos.map(t => `${t.horaInicio} - ${t.horaFin}`).join(' | ');

    setGuardando(true);
    try {
      await guardarHorario({
        medicoId:    parseInt(selectedMedico),
        dias:        diasSeleccionados,
        horas:       horasResumen,
        duracion:    `${duracionCita} min`,
        turnosRaw:   turnos,
        duracionMin: parseInt(duracionCita)
      });
      setMensaje(`✓ Horario guardado exitosamente para ${medicoName}.`);
      // Reset form
      setSelectedEspecialidad('');
      setSelectedMedico('');
      setDiasSeleccionados([]);
      setTurnos([{ horaInicio: '08:00', horaFin: '14:00' }]);
      setDuracionCita('30');
    } catch (err) {
      console.error('Error al guardar el horario:', err);
      setMensaje('Error: No se pudo guardar el horario en la base de datos.');
    } finally {
      setGuardando(false);
      setTimeout(() => setMensaje(''), 5000);
    }
  };

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <CalendarRange className="w-6 h-6 text-teal-400" />
          Configuración de Horarios de Atención
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Establezca los horarios de atención de los médicos de acuerdo a su disponibilidad y turnos.
        </p>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium animate-fadeIn ${
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

      {/* Formulario */}
      <form onSubmit={handleGuardar} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6 max-w-lg mx-auto">
        <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800/60 pb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-400" /> Definir Disponibilidad
        </h3>

        {/* Especialidad */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Especialidad *</label>
          <select
            value={selectedEspecialidad}
            onChange={e => { setSelectedEspecialidad(e.target.value); setSelectedMedico(''); }}
            className={`w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-teal-500 cursor-pointer ${
              selectedEspecialidad ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            <option value="" className="text-slate-500">-- Elige una especialidad --</option>
            {especialidades.map(esp => (
              <option key={esp.id} value={esp.nombre} className="text-slate-300">{esp.nombre}</option>
            ))}
          </select>
        </div>

        {/* Médico */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nombre del Médico *</label>
          <select
            value={selectedMedico}
            onChange={e => handleMedicoChange(e.target.value)}
            className={`w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-teal-500 cursor-pointer ${
              selectedMedico ? 'text-slate-300' : 'text-slate-500'
            }`}
            required
          >
            <option value="" className="text-slate-500">-- Elige un médico --</option>
            {medicos
              .filter(m => m.estado === 'activo' && (!selectedEspecialidad || m.especialidad === selectedEspecialidad))
              .map(m => (
                <option key={m.id} value={m.id} className="text-slate-300">
                  {selectedEspecialidad ? m.nombre : `${m.nombre} (${m.especialidad})`}
                </option>
              ))
            }
          </select>
        </div>

        {/* Días */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Días Laborales *</label>
          <div className="grid grid-cols-3 gap-2">
            {diasSemana.map(dia => {
              const activo = diasSeleccionados.includes(dia);
              return (
                <button
                  key={dia}
                  type="button"
                  onClick={() => toggleDia(dia)}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                    activo
                      ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {dia}
                </button>
              );
            })}
          </div>
        </div>

        {/* Turnos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Horarios de Atención
            </label>
            <button
              type="button"
              onClick={addTurno}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 hover:border-teal-500 transition-all text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar turno
            </button>
          </div>

          {turnos.map((turno, idx) => (
            <div key={idx} className="flex items-end gap-2">
              <div className="flex-1">
                {idx === 0 && (
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Hora Entrada</label>
                )}
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 flex items-center justify-center w-6 h-6 rounded-md bg-teal-500/15 border border-teal-500/30">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                  </span>
                  <input
                    type="time"
                    value={turno.horaInicio}
                    onChange={e => updateTurno(idx, 'horaInicio', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-teal-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              <span className="text-slate-600 pb-2.5 text-sm font-bold shrink-0">—</span>

              <div className="flex-1">
                {idx === 0 && (
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Hora Salida</label>
                )}
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 flex items-center justify-center w-6 h-6 rounded-md bg-teal-500/15 border border-teal-500/30">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                  </span>
                  <input
                    type="time"
                    value={turno.horaFin}
                    onChange={e => updateTurno(idx, 'horaFin', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-teal-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              {turnos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTurno(idx)}
                  className="mb-0.5 flex items-center justify-center w-8 h-8 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/25 hover:border-red-500/50 transition-all shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Duración */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Duración de Cita (Frecuencia)</label>
          <select
            value={duracionCita}
            onChange={e => setDuracionCita(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-slate-300 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="15">15 Minutos</option>
            <option value="20">20 Minutos</option>
            <option value="30">30 Minutos</option>
            <option value="45">45 Minutos</option>
            <option value="60">60 Minutos</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-teal-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {guardando ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </form>
    </div>
  );
}
