import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerMedicosActivos } from '../../api/medicosApi';
import { crearReserva, obtenerHorasOcupadas } from '../../api/reservasApi';
import useAuth from '../../hooks/useAuth';
import validarDNI from '../../utils/validarDNI';
import { consultarReniec } from '../../api/pacientesApi';
import { obtenerHorarios } from '../../api/horariosApi';
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  IdCard,
  Loader2,
  Phone,
  Search,
  User,
} from 'lucide-react';

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const mapDias = {
  Domingo: 0,
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Miercoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
  Sabado: 6,
};

const getTodayString = () => new Date().toISOString().split('T')[0];

const getDiaFromDateInput = (fecha) => {
  if (!fecha) return '';
  const date = new Date(`${fecha}T00:00:00`);
  return diasSemana[date.getDay()];
};

const formatFechaCita = (fecha) => {
  if (!fecha) return 'Selecciona una fecha';
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const getEstadoHorario = (config, dia, turno) => {
  const keyEstado = turno ? `${dia}-${turno.horaInicio}` : dia;
  return (config?.diasEstado?.[keyEstado] || 'activo').toLowerCase();
};

const buildNombreReniec = (data) => {
  const nombres = data?.nombres || data?.nombre || data?.first_name || data?.names || '';
  const apellidoPaterno = data?.apellido_paterno || data?.apellidoPaterno || data?.first_last_name || data?.paternal_surname || '';
  const apellidoMaterno = data?.apellido_materno || data?.apellidoMaterno || data?.second_last_name || data?.maternal_surname || '';
  const nombreOrdenado = [nombres, apellidoPaterno, apellidoMaterno]
    .map(value => String(value || '').trim())
    .filter(Boolean)
    .join(' ');

  if (nombreOrdenado) return nombreOrdenado;

  const fullName = String(data?.full_name || '').trim();
  const partes = fullName.split(/\s+/).filter(Boolean);
  if (partes.length === 4) return `${partes[2]} ${partes[3]} ${partes[0]} ${partes[1]}`;
  return fullName;
};

export default function FormReserva() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [medicos, setMedicos] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [horasOcupadas, setHorasOcupadas] = useState([]);
  const [form, setForm] = useState({
    dni_paciente: '',
    nombre_paciente: '',
    telefono_paciente: '',
    fecha_nacimiento: '',
    id_medico: '',
    fecha: '',
    hora: '',
  });

  const [selectedEspecialidad, setSelectedEspecialidad] = useState('');
  const [cargandoMedicos, setCargandoMedicos] = useState(true);
  const [cargandoEnvio, setCargandoEnvio] = useState(false);
  const [cargandoOcupadas, setCargandoOcupadas] = useState(false);
  const [buscandoDNI, setBuscandoDNI] = useState(false);
  const [error, setError] = useState('');
  const [nombreDesdeReniec, setNombreDesdeReniec] = useState(false);
  const fechaCitaRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const [medData, horData] = await Promise.all([
          obtenerMedicosActivos(),
          obtenerHorarios(),
        ]);
        setMedicos(medData);
        setConfigs(horData);
      } catch (err) {
        console.error('Error al cargar datos en FormReserva:', err);
        setMedicos([
          { id: 1, nombre: 'Dr. Juan Perez', colegiatura: 'CMP12345', especialidad: 'Oftalmología General', estado: 'activo' },
          { id: 2, nombre: 'Dra. Maria Gomez', colegiatura: 'CMP23456', especialidad: 'Retinología', estado: 'activo' },
          { id: 3, nombre: 'Dr. Carlos Mendoza', colegiatura: 'CMP34567', especialidad: 'Oftalmología Pediátrica', estado: 'activo' },
          { id: 4, nombre: 'Dra. Ana Silva', colegiatura: 'CMP45678', especialidad: 'Glaucoma', estado: 'inactivo' },
        ]);
      } finally {
        setCargandoMedicos(false);
      }
    }

    load();
  }, []);

  const diaSeleccionado = useMemo(() => getDiaFromDateInput(form.fecha), [form.fecha]);

  const abrirSelectorFecha = () => {
    if (!form.id_medico || !fechaCitaRef.current) return;

    if (typeof fechaCitaRef.current.showPicker === 'function') {
      fechaCitaRef.current.showPicker();
      return;
    }

    fechaCitaRef.current.click();
  };

  useEffect(() => {
    if (!form.id_medico || !form.fecha) {
      setHorasOcupadas([]);
      return;
    }

    async function loadOcupadas() {
      setCargandoOcupadas(true);
      try {
        const data = await obtenerHorasOcupadas({ idMedico: form.id_medico, fecha: form.fecha });
        setHorasOcupadas(data);
      } catch (err) {
        setHorasOcupadas([]);
      } finally {
        setCargandoOcupadas(false);
      }
    }

    loadOcupadas();
  }, [form.id_medico, form.fecha]);

  const horasPorFecha = useMemo(() => {
    if (!form.id_medico || !form.fecha || !diaSeleccionado) return [];

    const medicoConfig = configs.find(c => c.medicoId === parseInt(form.id_medico));
    if (!medicoConfig) return [];

    const dias = Array.isArray(medicoConfig.dias) ? medicoConfig.dias : [];
    const turnosRaw = Array.isArray(medicoConfig.turnosRaw) ? medicoConfig.turnosRaw : [];
    const duracionMin = medicoConfig.duracionMin || 30;
    const selectedDayNumber = mapDias[diaSeleccionado];
    const activeDays = dias.map(d => mapDias[d]).filter(d => d !== undefined);

    if (!activeDays.includes(selectedDayNumber)) return [];

    const ocupadasSet = new Set(horasOcupadas.map(r => String(r.hora).substring(0, 5)));
    const generated = [];

    turnosRaw.forEach(turno => {
      if (getEstadoHorario(medicoConfig, diaSeleccionado, turno) === 'ausente') return;

      const [startH, startM] = (turno.horaInicio || '08:00').split(':').map(Number);
      const [endH, endM] = (turno.horaFin || '14:00').split(':').map(Number);

      let current = new Date(`${form.fecha}T00:00:00`);
      current.setHours(startH, startM, 0, 0);

      const endLimit = new Date(`${form.fecha}T00:00:00`);
      endLimit.setHours(endH, endM, 0, 0);

      while (current < endLimit) {
        const hours = String(current.getHours()).padStart(2, '0');
        const minutes = String(current.getMinutes()).padStart(2, '0');
        const time = `${hours}:${minutes}`;
        const pasado = form.fecha === getTodayString() && current <= new Date();
        const ocupado = ocupadasSet.has(time);

        generated.push({
          time,
          ocupado,
          pasado,
          label: `${time} - ${ocupado ? 'Ocupado' : pasado ? 'No disponible' : 'Disponible'}`,
        });

        current.setMinutes(current.getMinutes() + duracionMin);
      }
    });

    return generated;
  }, [form.id_medico, form.fecha, diaSeleccionado, configs, horasOcupadas]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value;

    if (name === 'dni_paciente') {
      updatedValue = value.replace(/\D/g, '').slice(0, 8);
      setNombreDesdeReniec(false);
    } else if (name === 'telefono_paciente') {
      updatedValue = value.replace(/\D/g, '').slice(0, 9);
    } else if (name === 'nombre_paciente') {
      updatedValue = value.toUpperCase();
      setNombreDesdeReniec(false);
    }

    setForm(prev => ({ ...prev, [name]: updatedValue }));
    setError('');
  };

  const consultarYAutocompletarDNI = async (dniVal) => {
    setBuscandoDNI(true);
    setForm(prev => ({ ...prev, nombre_paciente: 'Buscando en RENIEC...' }));

    try {
      const data = await consultarReniec(dniVal);
      const nombreReniec = buildNombreReniec(data);
      if (nombreReniec) {
        setForm(prev => ({ ...prev, nombre_paciente: nombreReniec }));
        setNombreDesdeReniec(true);
      } else {
        setForm(prev => ({ ...prev, nombre_paciente: '' }));
        setNombreDesdeReniec(false);
        setError('No se encontraron datos para este DNI en RENIEC.');
      }
    } catch (err) {
      console.error('Error al consultar DNI:', err);
      setForm(prev => ({ ...prev, nombre_paciente: '' }));
      setNombreDesdeReniec(false);
      setError('Error al consultar RENIEC (DNI no encontrado o error de API).');
    } finally {
      setBuscandoDNI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { dni_paciente, nombre_paciente, telefono_paciente, id_medico, fecha, hora } = form;

    if (!dni_paciente || !nombre_paciente || !id_medico || !fecha || !hora) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (!validarDNI(dni_paciente)) {
      setError('El DNI debe tener exactamente 8 digitos numericos');
      return;
    }

    const slotSeleccionado = horasPorFecha.find(slot => slot.time === hora);
    if (!slotSeleccionado || slotSeleccionado.ocupado || slotSeleccionado.pasado) {
      setError('La hora seleccionada no está disponible.');
      return;
    }

    setCargandoEnvio(true);
    setError('');

    try {
      const res = await crearReserva({
        dni_paciente,
        nombre_paciente: user?.rol === 'Paciente' ? nombre_paciente : undefined,
        telefono_paciente: user?.rol === 'Paciente' ? telefono_paciente : undefined,
        id_medico: parseInt(id_medico),
        fecha,
        hora,
      });

      if (!user?.dni && user?.rol === 'Paciente') {
        updateUser({ dni: dni_paciente });
      }

      localStorage.setItem('vitalsalud_pre_reserva_id', res.reservaId);
      localStorage.setItem('vitalsalud_countdown_expire', new Date(res.expiraEn).getTime().toString());
      navigate(`/dashboard/paciente/pago/${res.reservaId}`, { state: { expiraEn: res.expiraEn } });
    } catch (err) {
      const data = err.response?.data;
      setError(data?.mensaje || 'Horario no disponible');
    } finally {
      setCargandoEnvio(false);
    }
  };


  const isStaff = user && (user.rol === 'Recepcionista' || user.rol === 'Administrador');

  return (
    <div className="w-full max-w-xl mx-auto p-8 rounded-3xl glass-panel border border-slate-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-teal-500/10 rounded-xl">
          <Calendar className="w-6 h-6 text-teal-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-100">Reservar Cita Médica</h2>
          <p className="text-sm text-slate-400">Selecciona el médico y el horario de tu preferencia</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}


      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">DNI del Paciente *</label>
          <div className="relative">
            <IdCard className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              name="dni_paciente"
              value={form.dni_paciente}
              onChange={(e) => {
                const dniValue = e.target.value.replace(/\D/g, '').slice(0, 8);
                setForm(prev => ({ ...prev, nombre_paciente: '', dni_paciente: dniValue }));
                setNombreDesdeReniec(false);
                setError('');
              }}
              placeholder="Ingresa tu DNI de 8 digitos"
              required
              maxLength={8}
              className="w-full pl-10 pr-14 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
            />
            <div className="absolute right-2 top-2 flex items-center">
              {buscandoDNI ? (
                <div className="flex items-center justify-center w-9 h-9">
                  <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => consultarYAutocompletarDNI(form.dni_paciente)}
                  disabled={form.dni_paciente.length !== 8}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 hover:bg-teal-500/30 hover:border-teal-500 disabled:bg-slate-800/50 disabled:border-slate-700 disabled:text-slate-600 transition-all cursor-pointer disabled:cursor-not-allowed"
                  title="Buscar en RENIEC"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 pl-1">
            Ingresa tu DNI de 8 digitos y haz clic en buscar para consultar RENIEC.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Nombres y Apellidos *
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            {buscandoDNI ? (
              <div className="w-full pl-10 pr-4 py-3 bg-slate-900/40 rounded-xl border border-slate-800 text-slate-500 text-sm flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Consultando RENIEC...
              </div>
            ) : (
              <input
                type="text"
                name="nombre_paciente"
                value={form.nombre_paciente}
                onChange={handleChange}
                placeholder="Escribe tus nombres y apellidos"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            )}
          </div>
          {nombreDesdeReniec && form.nombre_paciente && !buscandoDNI && (
            <p className="text-[10px] text-teal-500 mt-1 pl-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400"></span>
              Datos obtenidos de RENIEC
            </p>
          )}
          {!nombreDesdeReniec && form.nombre_paciente && !buscandoDNI && (
            <p className="text-[10px] text-slate-500 mt-1 pl-1">Nombre ingresado manualmente.</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Fecha de Nacimiento
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={form.fecha_nacimiento
                ? new Date(`${form.fecha_nacimiento}T00:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
                : ''
              }
              readOnly
              placeholder="Haz clic en el calendario para escoger una fecha"
              className="w-full pl-4 pr-14 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-300 placeholder-slate-500 focus:outline-none cursor-default"
            />
            <input
              id="fecha-nacimiento-picker"
              type="date"
              value={form.fecha_nacimiento}
              onChange={(e) => setForm(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
              max={getTodayString()}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => document.getElementById('fecha-nacimiento-picker').showPicker?.() ||
                            document.getElementById('fecha-nacimiento-picker').click()}
              className="absolute right-2 flex items-center justify-center w-9 h-9 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 hover:bg-teal-500/30 hover:border-teal-500 transition-all cursor-pointer"
              title="Seleccionar fecha de nacimiento"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>
          {form.fecha_nacimiento && (
            <p className="text-[10px] text-slate-500 mt-1 pl-1">Fecha seleccionada. No modificable por teclado.</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Número Telefónico
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              name="telefono_paciente"
              value={form.telefono_paciente}
              onChange={handleChange}
              placeholder="Ej: 987654321"
              maxLength="9"
              className="w-full pl-10 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Especialidad *</label>
          <select
            value={selectedEspecialidad}
            onChange={(e) => {
              setSelectedEspecialidad(e.target.value);
              setForm(prev => ({ ...prev, id_medico: '', fecha: '', hora: '' }));
            }}
            required
            className="w-full px-4 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
            style={{ color: '#cbd5e1' }}
          >
            <option value="" style={{ color: '#cbd5e1', backgroundColor: '#0f172a' }}>-- Elige una Especialidad --</option>
            {Array.from(new Set(medicos.map(m => m.especialidad)))
              .filter(Boolean)
              .sort()
              .map(esp => (
                <option key={esp} value={esp} style={{ color: '#cbd5e1', backgroundColor: '#0f172a' }}>{esp}</option>
              ))
            }
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nombre del Médico *</label>
          <select
            name="id_medico"
            value={form.id_medico}
            onChange={(e) => {
              const medId = e.target.value;
              setForm(prev => ({ ...prev, id_medico: medId, fecha: '', hora: '' }));
            }}
            required
            disabled={!selectedEspecialidad}
            className="w-full px-4 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors disabled:opacity-50"
          >
            <option value="">
              {selectedEspecialidad ? '-- Elige un Médico --' : '-- Elige una especialidad primero --'}
            </option>
            {medicos
              .filter(m => m.estado === 'activo' && m.especialidad === selectedEspecialidad)
              .map(m => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))
            }
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Fecha *</label>
          <div className={`relative flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
            form.id_medico
              ? 'bg-teal-500/10 border-teal-500/25'
              : 'bg-slate-900/40 border-slate-800 opacity-60'
          }`}>
            <CalendarDays className="w-4 h-4 text-teal-300 shrink-0" />
            <span className={`flex-1 select-none ${form.fecha ? 'text-slate-100' : 'text-slate-500'}`}>
              {formatFechaCita(form.fecha)}
            </span>
            <input
              ref={fechaCitaRef}
              type="date"
              value={form.fecha}
              onChange={(e) => {
                const nextFecha = e.target.value;
                if (nextFecha && nextFecha < getTodayString()) return;
                setForm(prev => ({ ...prev, fecha: nextFecha, hora: '' }));
              }}
              min={getTodayString()}
              disabled={!form.id_medico}
              onKeyDown={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              className="absolute right-4 top-1/2 h-px w-px -translate-y-1/2 opacity-0 pointer-events-none [color-scheme:dark]"
              tabIndex={-1}
            />
            <button
              type="button"
              onClick={abrirSelectorFecha}
              disabled={!form.id_medico}
              className="w-9 h-9 rounded-lg bg-teal-500/15 border border-teal-400/30 text-teal-300 hover:bg-teal-500/25 hover:text-teal-100 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              title="Elegir fecha"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 pl-1">
            Usa el icono del calendario para elegir una fecha disponible.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hora *</label>
          <select
            value={form.hora}
            onChange={(e) => setForm(prev => ({ ...prev, hora: e.target.value }))}
            required
            disabled={!form.id_medico || !form.fecha || cargandoOcupadas}
            className="w-full px-4 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors disabled:opacity-50"
          >
            <option value="">
              {!form.id_medico
                ? '-- Selecciona un médico primero --'
                : !form.fecha
                  ? '-- Selecciona una fecha --'
                  : cargandoOcupadas
                    ? 'Consultando horas ocupadas...'
                    : horasPorFecha.length > 0
                      ? '-- Selecciona una hora --'
                      : `No hay horarios para ${diaSeleccionado || 'esta fecha'}`
              }
            </option>
            {horasPorFecha.map((slot) => (
              <option key={slot.time} value={slot.time} disabled={slot.ocupado || slot.pasado}>
                {slot.label}
              </option>
            ))}
          </select>
          {form.fecha && form.id_medico && horasPorFecha.length > 0 && (
            <p className="text-[10px] text-slate-500 mt-1 pl-1">
              Las horas ocupadas se muestran bloqueadas para evitar reservas duplicadas.
            </p>
          )}
        </div>


        <button
          type="submit"
          disabled={cargandoEnvio}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-900 font-bold rounded-xl transition-all disabled:opacity-50"
        >
          {cargandoEnvio ? 'Procesando...' : 'Reservar Cita'}
        </button>
      </form>
    </div>
  );
}
