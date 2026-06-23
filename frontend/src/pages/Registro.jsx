import React from 'react';
import FormRegistro from '../components/paciente/FormRegistro';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Registro() {
  const navigate = useNavigate();

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

      <FormRegistro />
    </div>
  );
}
