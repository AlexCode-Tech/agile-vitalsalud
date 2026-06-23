import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { login } from '../api/pacientesApi';
import { Mail, Lock, Heart, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { getDashboardRouteByRole } from '../utils/roleRoutes';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const mensajeExito = location.state?.mensajeExito || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!correo || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setCargando(true);
    setError('');

    try {
      const data = await login(correo, password);
      // loginUser guarda token e info en context + localStorage
      loginUser(data.token, data.usuario);

      // Redirigir al dashboard según el rol
      navigate(getDashboardRouteByRole(data.usuario.rol));
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'Credenciales incorrectas o servidor fuera de línea.';
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden bg-slate-950">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl -z-10 animate-pulse delay-75"></div>

      {/* Brand logo at top */}
      <div className="flex items-center gap-2 cursor-pointer mb-8" onClick={() => navigate('/')}>
        <Heart className="w-6 h-6 text-teal-400" />
        <span className="text-xl font-bold font-display bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
          VitalSalud
        </span>
      </div>

      <div className="w-full max-w-md p-8 rounded-3xl glass-card border border-slate-800">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold font-display text-slate-100 mb-2">Bienvenido de nuevo</h2>
          <p className="text-sm text-slate-400">Ingresa tus credenciales para acceder al sistema</p>
        </div>

        {mensajeExito && (
          <div className="mb-6 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm font-medium">
            {mensajeExito}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Correo */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input 
                type="email" 
                value={correo}
                onChange={(e) => { setCorreo(e.target.value); setError(''); }}
                placeholder="correo@ejemplo.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input 
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-11 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(v => !v)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-teal-400 transition-colors focus:outline-none"
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarPassword
                  ? <EyeOff className="w-4 h-4" />
                  : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón Envío */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-teal-500/10 disabled:opacity-50"
          >
            {cargando ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-teal-400 hover:text-teal-300 font-semibold underline transition-colors">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
