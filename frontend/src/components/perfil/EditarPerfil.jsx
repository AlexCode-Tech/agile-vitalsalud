import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { actualizarPerfil } from '../../api/pacientesApi';
import { User, Mail, Phone, ShieldAlert, CheckCircle } from 'lucide-react';

export default function EditarPerfil() {
  const { user, loginUser } = useAuth();
  
  const [form, setForm] = useState({
    dni: user?.dni || '',
    correo: user?.correo || '',
    telefono: user?.telefono || ''
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setExito(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.correo) {
      setError('El correo electrónico es requerido.');
      return;
    }

    setCargando(true);
    setError('');
    setExito(false);

    try {
      await actualizarPerfil(user.dni, {
        correo: form.correo,
        telefono: form.telefono
      });

      setExito(true);
      
      // Actualizar el contexto de autenticación local
      const updatedUser = { ...user, correo: form.correo, telefono: form.telefono };
      loginUser(localStorage.getItem('vitalsalud_token'), updatedUser);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al actualizar el perfil.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display text-slate-100 mb-1">Mi Perfil</h2>
        <p className="text-sm text-slate-400">Actualiza tu información de contacto</p>
      </div>

      {exito && (
        <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
          <span>Perfil actualizado exitosamente</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* DNI (Bloqueado) */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">DNI (No modificable)</label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-600" />
            <input
              type="text"
              name="dni"
              value={form.dni}
              disabled
              className="w-full pl-10 pr-4 py-3 bg-slate-950/80 rounded-xl border border-slate-900 text-slate-500 cursor-not-allowed select-none focus:outline-none"
            />
          </div>
          <p className="mt-2 text-xs text-amber-500 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            El DNI no puede modificarse. Contacta a recepción.
          </p>
        </div>

        {/* Correo */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico *</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Teléfono / Celular</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="987654321"
              className="w-full pl-10 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        {/* Botón Guardar */}
        <button
          type="submit"
          disabled={cargando}
          className="w-full mt-4 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-900 font-bold rounded-xl transition-all disabled:opacity-50"
        >
          {cargando ? 'Guardando Cambios...' : 'Guardar Cambios'}
        </button>
      </form>
    </div>
  );
}
