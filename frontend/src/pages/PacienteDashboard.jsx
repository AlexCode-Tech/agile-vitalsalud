import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import FormReserva from '../components/paciente/FormReserva';
import FormPago from '../components/paciente/FormPago';
import MisCitas from '../components/paciente/MisCitas';
import { Calendar, Heart, FileText, LogOut, ChevronRight } from 'lucide-react';

export default function PacienteDashboard() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { name: 'Reservar Cita', path: '/dashboard/paciente/reservar', icon: Calendar },
    { name: 'Mis Citas', path: '/dashboard/paciente/citas', icon: FileText }
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen bg-slate-950">
      {/* Sidebar de Navegación */}
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
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Paciente</p>
            <p className="text-sm font-bold text-slate-200 truncate">{user?.correo}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold uppercase mt-1 inline-block">Rol: {user?.rol}</span>
          </div>

          {/* Navigation Link List */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-teal-500/10 text-teal-400 border-l-4 border-teal-500 pl-3'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${active ? 'translate-x-0.5' : 'opacity-0 group-hover:opacity-100'}`} />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout button */}
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

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="reservar" replace />} />
          <Route path="reservar" element={<FormReserva />} />
          <Route path="pago/:id" element={<FormPago />} />
          <Route path="citas" element={<MisCitas />} />
        </Routes>
      </main>
    </div>
  );
}
