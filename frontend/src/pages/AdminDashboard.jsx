import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import FormMedico from '../components/admin/FormMedico';
import TablaMedicos from '../components/admin/TablaMedicos';
import AsignarRoles from '../components/admin/AsignarRoles';
import ConfigurarHorarios from '../components/admin/ConfigurarHorarios';
import VerHorarios from '../components/admin/VerHorarios';
import { Shield, Heart, UserPlus, LogOut, Users, CalendarRange, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, logoutUser } = useAuth();
  const [activeTab, setActiveTab] = useState('asignar-roles');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  const handleMedicoAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('medicos');
  };

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
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Administrador</p>
            <p className="text-sm font-bold text-slate-200 truncate">{user?.correo}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold uppercase mt-1 inline-block">Rol: {user?.rol}</span>
          </div>

          {/* Tab Navigation */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('asignar-roles')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'asignar-roles'
                  ? 'bg-teal-500/10 text-teal-400 border-l-4 border-teal-500 pl-3'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              Asignar roles
            </button>

            <button
              onClick={() => setActiveTab('medicos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'medicos' || activeTab === 'registrar-medico'
                  ? 'bg-teal-500/10 text-teal-400 border-l-4 border-teal-500 pl-3'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              Lista de médicos
            </button>

            <button
              onClick={() => setActiveTab('horarios')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'horarios'
                  ? 'bg-teal-500/10 text-teal-400 border-l-4 border-teal-500 pl-3'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <CalendarRange className="w-4 h-4" />
              Configuración de horarios
            </button>

            <button
              onClick={() => setActiveTab('ver-horarios')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'ver-horarios'
                  ? 'bg-teal-500/10 text-teal-400 border-l-4 border-teal-500 pl-3'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              Ver Horarios
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
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {activeTab === 'asignar-roles' && <AsignarRoles />}
        {activeTab === 'medicos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <Users className="w-6 h-6 text-teal-400" />
                  Lista de Médicos
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Administre los especialistas médicos del centro VitalSalud.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('registrar-medico')}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-teal-500/10"
              >
                <UserPlus className="w-4 h-4" />
                Registrar Médico
              </button>
            </div>
            <TablaMedicos refreshTrigger={refreshTrigger} />
          </div>
        )}
        {activeTab === 'registrar-medico' && (
          <div className="space-y-6">
            <button
              onClick={() => setActiveTab('medicos')}
              className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-800 hover:text-slate-200 transition-all"
            >
              &larr; Volver a Lista de Médicos
            </button>
            <FormMedico onMedicoAdded={handleMedicoAdded} />
          </div>
        )}
        {activeTab === 'horarios' && <ConfigurarHorarios />}
        {activeTab === 'ver-horarios' && <VerHorarios />}
      </main>
    </div>
  );
}
