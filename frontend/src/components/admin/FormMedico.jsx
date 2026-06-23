import React, { useState, useEffect } from 'react';
import { registrarMedico } from '../../api/medicosApi';
import { obtenerEspecialidades } from '../../api/especialidadesApi';
import {
  User, Shield, Phone, CheckCircle, XCircle,
  Loader2, Eye, EyeOff
} from 'lucide-react';

export default function FormMedico({ onMedicoAdded }) {
  const [especialidades, setEspecialidades] = useState([]);
  
  const getTodayString = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleKeyDownDate = (e) => {
    if (['Tab', 'Escape', 'Enter'].includes(e.key)) {
      return;
    }
    e.preventDefault();
    alert('Debe seleccionar el icono del calendario para escoger la fecha.');
  };

  const handleDateMouseDown = (e) => {
    const rect = e.target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width - 40) {
      e.preventDefault();
      alert('Debe seleccionar el icono del calendario para escoger la fecha.');
    }
  };
  const [verPassword, setVerPassword] = useState(false);
  const [verRepetirPassword, setVerRepetirPassword] = useState(false);
  const [form, setForm] = useState({
    colegiatura: '',
    nombre: '',
    dni: '',
    especialidad: '',
    telefono: '',
    correo: '',
    password: '',
    repeatPassword: '',
    fecha_recertificacion: '',
    estado: 'activo',
  });


  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await obtenerEspecialidades();
        setEspecialidades(data);
      } catch (err) {
        console.error('Error al obtener especialidades:', err);
      }
    }
    load();
  }, []);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'colegiatura') {
      value = value.replace(/\D/g, '').slice(0, 6);
    }
    if (name === 'nombre') {
      value = value.toUpperCase();
    }
    if (name === 'dni') {
      value = value.replace(/\D/g, '').slice(0, 8);
    }
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
    setExito(false);
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    const { colegiatura, nombre, dni, especialidad, telefono, correo, password, repeatPassword, fecha_recertificacion, estado } = form;

    if (!colegiatura || !nombre || !dni || !especialidad || !fecha_recertificacion) {
      setError('CMP, nombre, DNI, especialidad y fecha de recertificación son campos requeridos.');
      return;
    }

    if (dni.length !== 8) {
      setError('El DNI debe tener exactamente 8 dígitos numéricos.');
      return;
    }

    if (correo) {
      if (!password) {
        setError('La contraseña es obligatoria cuando se registra un correo.');
        return;
      }
      if (password !== repeatPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    }

    setCargando(true);
    setError('');
    setExito(false);

    try {
      const formData = new FormData();
      formData.append('colegiatura', `CMP${colegiatura}`);
      formData.append('nombre', nombre);
      formData.append('dni', dni);
      formData.append('especialidad', especialidad);
      formData.append('telefono', telefono);
      formData.append('correo', correo);
      if (correo && password) {
        formData.append('password', password);
      }
      formData.append('fecha_recertificacion', fecha_recertificacion);
      formData.append('estado', estado);

      await registrarMedico(formData);
      setExito(true);

      setForm({
        colegiatura: '',
        nombre: '',
        dni: '',
        especialidad: '',
        telefono: '',
        correo: '',
        password: '',
        repeatPassword: '',
        fecha_recertificacion: '',
        estado: 'activo',
      });
      if (onMedicoAdded) onMedicoAdded();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al registrar el médico.');
    } finally {
      setCargando(false);
    }
  };

  const inputBase = 'w-full py-3 bg-slate-900/60 rounded-xl border text-slate-200 placeholder-slate-600 focus:outline-none transition-colors';

  return (
    <div className="w-full max-w-xl mx-auto p-6 rounded-2xl glass-card border border-slate-800 space-y-6">
      <div>
        <h3 className="text-lg font-bold font-display text-slate-200 mb-1">Registrar Nuevo Médico</h3>
        <p className="text-xs text-slate-400">Ingrese las credenciales del specialist clínico</p>
      </div>

      {exito && (
        <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
          <span>Médico registrado exitosamente</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── CMP ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            CMP *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-slate-500 font-bold text-xs uppercase select-none">CMP</span>
            <input
              type="text"
              name="colegiatura"
              value={form.colegiatura}
              onChange={handleChange}
              placeholder="123456"
              maxLength={6}
              inputMode="numeric"
              required
              className={`${inputBase} pl-12 pr-4 border-slate-800 focus:border-teal-500`}
            />
          </div>
        </div>

        {/* ── Nombre Completo ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Nombre Completo *
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="JUAN PEREZ"
              required
              className={`${inputBase} pl-10 pr-4 border-slate-800 focus:border-teal-500`}
            />
          </div>
        </div>

        {/* ── DNI ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            DNI *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-slate-500 font-bold text-xs uppercase select-none font-mono">DNI</span>
            <input
              type="text"
              name="dni"
              value={form.dni}
              onChange={handleChange}
              placeholder="12345678"
              maxLength={8}
              inputMode="numeric"
              required
              className={`${inputBase} pl-12 pr-4 border-slate-800 focus:border-teal-500`}
            />
          </div>
        </div>

        {/* ── Correo Electrónico ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Correo Electrónico
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-slate-500 text-sm font-semibold font-mono">@</span>
            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              placeholder="medico@vitalsalud.com"
              className={`${inputBase} pl-10 pr-4 border-slate-800 focus:border-teal-500`}
            />
          </div>
        </div>

        {/* ── Contraseña ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Contraseña {form.correo && '*'}
          </label>
          <div className="relative">
            <Shield className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type={verPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required={!!form.correo}
              className={`${inputBase} pl-10 pr-12 border-slate-800 focus:border-teal-500`}
            />
            <button
              type="button"
              onClick={() => setVerPassword(!verPassword)}
              className="absolute right-3.5 top-3 p-1 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300"
            >
              {verPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {/* ── Repetir Contraseña ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Repetir Contraseña {form.correo && '*'}
          </label>
          <div className="relative">
            <Shield className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type={verRepetirPassword ? 'text' : 'password'}
              name="repeatPassword"
              value={form.repeatPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required={!!form.correo}
              className={`${inputBase} pl-10 pr-12 border-slate-800 focus:border-teal-500`}
            />
            <button
              type="button"
              onClick={() => setVerRepetirPassword(!verRepetirPassword)}
              className="absolute right-3.5 top-3 p-1 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300"
            >
              {verRepetirPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {/* ── Especialidad ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Especialidad *
          </label>
          <select
            name="especialidad"
            value={form.especialidad}
            onChange={handleChange}
            className={`w-full px-4 py-3 bg-slate-900/60 rounded-xl border border-slate-800 focus:outline-none focus:border-teal-500 transition-colors ${
              form.especialidad === '' ? 'text-slate-600' : 'text-slate-200'
            }`}
          >
            <option value="" disabled className="text-slate-600 bg-slate-900">Elige una especialidad</option>
            {especialidades.map(esp => (
              <option key={esp.id} value={esp.nombre} className="text-slate-200 bg-slate-900">{esp.nombre}</option>
            ))}
          </select>
        </div>

        {/* ── Fecha de Recertificación ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Fecha de Recertificación *
          </label>
          <input
            type="date"
            name="fecha_recertificacion"
            value={form.fecha_recertificacion}
            onChange={handleChange}
            min={getTodayString()}
            onKeyDown={handleKeyDownDate}
            onMouseDown={handleDateMouseDown}
            required
            className={`w-full px-4 py-3 bg-slate-900/60 rounded-xl border border-slate-800 focus:outline-none focus:border-teal-500 transition-colors [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:bg-teal-500 [&::-webkit-calendar-picker-indicator]:rounded-md [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
              form.fecha_recertificacion === '' ? 'text-slate-600' : 'text-slate-200'
            }`}
          />
        </div>

        {/* ── Teléfono ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Teléfono de Contacto
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="987654321"
              className={`${inputBase} pl-10 pr-4 border-slate-800 focus:border-teal-500`}
            />
          </div>
        </div>



        {/* ── Botón ── */}
        <button
          type="submit"
          disabled={cargando}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-900 font-bold rounded-xl transition-all disabled:opacity-50"
        >
          {cargando
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
            : 'Registrar Médico'}
        </button>
      </form>
    </div>
  );
}
