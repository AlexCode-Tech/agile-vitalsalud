import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { obtenerCitasMedico } from '../api/reservasApi';
import { Heart, LogOut, Calendar, Clock, User, Phone, CheckCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MedicoDashboard() {
  const { user, logoutUser } = useAuth();
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadCitas = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerCitasMedico();
      setCitas(data);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al cargar la agenda médica.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    loadCitas();
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Heart className="w-6 h-6 text-teal-400" />
            <span className="text-xl font-bold font-display bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              VitalSalud
            </span>
          </div>

          {/* User Details */}
          <div className="p-6 border-b border-slate-800/40">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Médico Especialista</p>
            <p className="text-sm font-bold text-slate-200 truncate">{user?.correo}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold uppercase mt-1 inline-block">Rol: {user?.rol}</span>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all bg-teal-500/10 text-teal-400 border-l-4 border-teal-500 pl-3"
            >
              <Calendar className="w-4 h-4" />
              Mi Agenda
            </button>
          </nav>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-sm font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-teal-400" />
              Mi Agenda de Citas
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Consulte su horario y las citas programadas de sus pacientes asignados.
            </p>
          </div>
          
          <button
            onClick={loadCitas}
            disabled={cargando}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-800 hover:text-slate-200 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-400"></div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
            <table className="w-full border-collapse text-left text-sm text-slate-300">
              <thead className="bg-slate-900 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Fecha</th>
                  <th scope="col" className="px-6 py-4">Hora</th>
                  <th scope="col" className="px-6 py-4">Paciente</th>
                  <th scope="col" className="px-6 py-4">Teléfono</th>
                  <th scope="col" className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {citas.map((cita) => (
                  <tr key={cita.id} className="hover:bg-slate-800/20 transition-all">
                    <td className="px-6 py-4 font-medium text-slate-200">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        {new Date(cita.fecha).toLocaleDateString('es-PE', { timeZone: 'UTC' })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2 font-mono text-xs">
                        <Clock className="w-4 h-4 text-slate-500" />
                        {cita.hora.substring(0, 5)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        {cita.paciente_nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {cita.paciente_telefono ? (
                        <span className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-500" />
                          {cita.paciente_telefono}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        cita.estado === 'confirmada' 
                          ? 'bg-teal-500/10 text-teal-300' 
                          : 'bg-emerald-500/10 text-emerald-300'
                      }`}>
                        {cita.estado === 'confirmada' ? 'Confirmada' : 'Atendida'}
                      </span>
                    </td>
                  </tr>
                ))}
                {citas.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      No tiene citas programadas en su agenda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
