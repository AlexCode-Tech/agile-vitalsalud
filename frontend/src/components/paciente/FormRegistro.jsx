import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registrarPaciente, verificarCodigo, consultarReniec } from '../../api/pacientesApi';
import useAuth from '../../hooks/useAuth';
import { Mail, Lock, Heart, ArrowRight, ShieldCheck, CheckCircle, Eye, EyeOff, User, Shield, Loader2, Search, IdCard } from 'lucide-react';

export default function FormRegistro() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('register'); // 'register' o 'verify'
  const [form, setForm] = useState({
    correo: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const { correo, password, confirmPassword } = form;

    if (!correo || !password || !confirmPassword) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    setError('');

    try {
      await registrarPaciente({ correo, password });
      setMensajeExito(`Se ha enviado un código de verificación al correo ${correo}.`);
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al registrarse.');
    } finally {
      setCargando(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!codigo || codigo.length !== 6) {
      setError('El código debe ser de 6 dígitos.');
      return;
    }

    setCargando(true);
    setError('');

    try {
      const res = await verificarCodigo(form.correo, codigo);
      loginUser(res.token, res.usuario);
      // Redirigir al dashboard del paciente (donde completará DNI al reservar)
      navigate('/dashboard/paciente');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Código de verificación incorrecto.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-3xl glass-card border border-slate-800">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Heart className="w-10 h-10 text-teal-400 animate-pulse" />
        </div>
        <h2 className="text-3xl font-extrabold font-display text-slate-100 mb-2">
          {step === 'register' ? 'Crea tu Cuenta' : 'Verifica tu Cuenta'}
        </h2>
        <p className="text-sm text-slate-400">
          {step === 'register' 
            ? 'Regístrate solo con tu correo electrónico y contraseña' 
            : 'Introduce el código de 6 dígitos enviado a tu correo'}
        </p>
      </div>

      {mensajeExito && (
        <div className="mb-6 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium">
          {error}
        </div>
      )}

      {step === 'register' ? (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {/* Correo */}
          <div>
            <label htmlFor="correo" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input 
                id="correo"
                type="email" 
                name="correo"
                value={form.correo}
                onChange={handleChange}
                placeholder="juan@example.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contraseña *</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input 
                id="password"
                type={showPassword ? "text" : "password"} 
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Repetir Contraseña */}
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Repetir Contraseña *</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input 
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"} 
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón Envío */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-teal-500/10 disabled:opacity-50"
          >
            {cargando ? 'Enviando código...' : 'Registrarse'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifySubmit} className="space-y-4">
          {/* Código de verificación */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Código de Verificación (6 dígitos) *</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                maxLength="6"
                value={codigo}
                onChange={(e) => {
                  setCodigo(e.target.value.replace(/[^0-9]/g, ''));
                  setError('');
                }}
                placeholder="123456"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors tracking-widest font-mono text-center text-lg"
              />
            </div>
          </div>

          {/* Botón Envío */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-teal-500/10 disabled:opacity-50"
          >
            {cargando ? 'Verificando...' : 'Verificar Cuenta'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      )}

      <div className="mt-8 text-center text-sm text-slate-400">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-teal-400 hover:text-teal-300 font-semibold underline transition-colors">
          Inicia Sesión aquí
        </Link>
      </div>
    </div>
  );
}
