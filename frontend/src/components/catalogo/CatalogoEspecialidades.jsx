import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerEspecialidades } from '../../api/especialidadesApi';
import useAuth from '../../hooks/useAuth';
import { Heart, ArrowRight, LogIn, UserPlus, User } from 'lucide-react';
import { getAuthenticatedDefaultRoute } from '../../utils/roleRoutes';

export default function CatalogoEspecialidades() {
  const [especialidades, setEspecialidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, user, logoutUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const data = await obtenerEspecialidades();
        setEspecialidades(data);
      } catch (err) {
        // Fallback mock data in case API connection is offline
        setEspecialidades([
          { id: 1, nombre: 'Oftalmologia General', descripcion: 'Exámenes generales de vista y consulta básica.' },
          { id: 2, nombre: 'Retinologia', descripcion: 'Tratamiento de enfermedades de la retina y vítreo.' },
          { id: 3, nombre: 'Pediatria Oftalmologica', descripcion: 'Cuidado y diagnóstico ocular para niños.' },
          { id: 4, nombre: 'Glaucoma', descripcion: 'Tratamiento y prevención de la pérdida de visión por glaucoma.' },
          { id: 5, nombre: 'Cirugia Refractiva', descripcion: 'Corrección con láser de miopía, astigmatismo e hipermetropía.' }
        ]);
      } finally {
        setCargando(false);
      }
    }
    load();
  }, []);

  const handleReservar = () => {
    if (isAuthenticated) {
      navigate(getAuthenticatedDefaultRoute(user));
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Header Premium */}
      <header className="sticky top-0 z-50 glass-panel px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <Heart className="w-8 h-8 text-teal-400 animate-pulse" />
          <span className="text-2xl font-bold font-display bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            VitalSalud
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-300">{user.correo}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-semibold">{user.rol}</span>
              </div>
              <button 
                onClick={handleReservar}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-900 font-bold rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-teal-500/20"
              >
                <User className="w-4 h-4" />
                Mi Panel
              </button>
              <button 
                onClick={logoutUser}
                className="text-xs text-slate-400 hover:text-slate-200 underline pl-2"
              >
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 text-slate-200 font-medium rounded-lg transition-all"
              >
                <LogIn className="w-4 h-4" />
                Iniciar Sesión
              </button>
              <button 
                onClick={() => navigate('/registro')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 font-semibold rounded-lg border border-teal-500/30 hover:border-teal-500/60 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Registrarse
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Hero */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold font-display bg-gradient-to-r from-slate-100 via-teal-100 to-teal-400 bg-clip-text text-transparent mb-6">
            Especialidades Oftalmológicas
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Descubre nuestro portafolio de servicios médicos especializados en Trujillo. Cuidado ocular de nivel premium con tecnología avanzada.
          </p>
        </section>

        {cargando ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {especialidades.map((esp) => (
              <div 
                key={esp.id} 
                className="glass-card p-6 rounded-2xl flex flex-col justify-between hover:border-teal-500/30 transition-all duration-300 group hover:-translate-y-1"
              >
                <div>
                  <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center mb-4 group-hover:bg-teal-500/20 transition-all">
                    <Heart className="w-6 h-6 text-teal-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-100 group-hover:text-teal-300 transition-colors">
                    {esp.nombre}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    {esp.descripcion}
                  </p>
                </div>
                
                <button 
                  onClick={handleReservar}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800/80 hover:bg-teal-500 group-hover:text-slate-950 font-semibold rounded-xl text-teal-400 transition-all"
                >
                  Reservar Cita
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-slate-500 border-t border-slate-900 mt-20">
        <p>&copy; 2026 VitalSalud Clínica Oftalmológica. Todos los derechos reservados. Trujillo, La Libertad.</p>
      </footer>
    </div>
  );
}
