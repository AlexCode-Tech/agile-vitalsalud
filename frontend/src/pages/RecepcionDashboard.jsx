import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import ListaPacientesDia from '../components/recepcion/ListaPacientesDia';
import { Calendar, Heart, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RecepcionDashboard() {
  const { user, logoutUser } = useAuth();
  const [activeTab, setActiveTab] = useState('citas-dia');
  const navigate = useNavigate();

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
          <div className="p-6 border-b border-slate-800 flex items-center gap-2">
            <Heart className="w-6 h-6 text-teal-400" />
            <span className="text-xl font-bold font-display bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              VitalSalud
            </span>
          </div>

          {/* User Details */}
          <div className="p-6 border-b border-slate-800/40">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Personal</p>
            <p className="text-sm font-bold text-slate-200 truncate">{user?.correo}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold uppercase mt-1 inline-block">Rol: {user?.rol}</span>
          </div>

          {/* Tab Navigation */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('citas-dia')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'citas-dia'
                  ? 'bg-teal-500/10 text-teal-400 border-l-4 border-teal-500 pl-3'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Citas del Día
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
        {activeTab === 'citas-dia' && <ListaPacientesDia />}
      </main>
    </div>
  );
}
