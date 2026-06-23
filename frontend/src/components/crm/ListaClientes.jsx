import React, { useEffect, useState } from 'react';
import { obtenerClientesCRM, obtenerDetalleCRM } from '../../api/crmApi';
import { Users, FileText, Calendar, ShieldCheck, Heart, User, Clock, ChevronRight } from 'lucide-react';

export default function ListaClientes({ reloadTrigger }) {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [error, setError] = useState('');

  const loadClientes = async () => {
    try {
      const data = await obtenerClientesCRM();
      setClientes(data);
    } catch (err) {
      setError('Error al cargar la lista de clientes.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, [reloadTrigger]);

  const handleSeleccionar = async (id) => {
    setSeleccionado(id);
    setCargandoDetalle(true);
    try {
      const data = await obtenerDetalleCRM(id);
      setDetalle(data);
    } catch (err) {
      alert('Error al obtener detalle del cliente.');
    } finally {
      setCargandoDetalle(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Master List Pane */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/10 rounded-xl text-teal-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display text-slate-200">Directorio de Clientes CRM</h3>
            <p className="text-xs text-slate-400">Listado de contactos registrados en el CRM</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        {clientes.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
            <p className="text-sm text-slate-400">No hay clientes registrados en el CRM.</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800/40">
            {clientes.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSeleccionar(c.id)}
                className={`p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-slate-800/30 ${
                  seleccionado === c.id ? 'bg-teal-500/5 border-l-4 border-teal-500 pl-3' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-200 truncate">{c.nombre}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                      c.tipo === 'Paciente Activo' ? 'bg-teal-500/15 text-teal-300' :
                      c.tipo === 'B2B' ? 'bg-blue-500/15 text-blue-300' :
                      'bg-amber-500/15 text-amber-300'
                    }`}>
                      {c.tipo}
                    </span>
                    <span className="text-[10px] text-slate-500">Doc: {c.dni_o_ruc}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    c.estado === 'Activo' || c.estado === 'Contrato Firmado' ? 'bg-emerald-500/20 text-emerald-400' :
                    c.estado === 'Prospecto' || c.estado === 'Contacto Inicial' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-800 text-slate-500'
                  }`}>
                    {c.estado}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Pane */}
      <div className="w-full lg:w-96 shrink-0">
        {cargandoDetalle ? (
          <div className="p-8 glass-card rounded-3xl border border-slate-800 flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-400"></div>
          </div>
        ) : detalle ? (
          <div className="p-6 rounded-3xl glass-card border border-slate-800 space-y-6">
            {/* Cabecera del Detalle */}
            <div className="border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center mb-3 text-teal-400">
                <User className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-100">{detalle.cliente.nombre}</h4>
              <p className="text-xs text-slate-400 mt-1">Último contacto: {new Date(detalle.cliente.ultimo_contacto).toLocaleString()}</p>
            </div>

            {/* Vínculo TPS */}
            {detalle.cliente.dni_tps ? (
              <div className="p-3 bg-teal-500/5 rounded-xl border border-teal-500/20 space-y-1">
                <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block">Vínculo Clínico TPS</span>
                <p className="text-xs text-slate-300">Paciente verificado en el sistema de reservas.</p>
              </div>
            ) : (
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Vínculo Clínico TPS</span>
                <p className="text-xs text-slate-500 italic">No asociado a paciente clínico.</p>
              </div>
            )}

            {/* Notas del CRM */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notas / Interacciones</h5>
              <div className="space-y-2">
                {detalle.notas.map((n) => (
                  <div key={n.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs">
                    <p className="text-slate-300 leading-relaxed">{n.contenido}</p>
                    <span className="text-[10px] text-slate-500 block mt-2 text-right">{n.fecha}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recordatorios */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recordatorios</h5>
              <div className="space-y-2">
                {detalle.recordatorios.map((r) => (
                  <div key={r.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs flex gap-2">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-300">{r.descripcion}</p>
                      <span className="text-[10px] text-amber-400 font-semibold block mt-1">Límite: {r.fecha_limite}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Historial TPS */}
            {detalle.cliente.dni_tps && (
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historial de Citas (TPS)</h5>
                <div className="space-y-2">
                  {detalle.historialTPS.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Sin citas registradas.</p>
                  ) : (
                    detalle.historialTPS.map((cita) => (
                      <div key={cita.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-300">{cita.medico_especialidad}</p>
                          <span className="text-[10px] text-slate-500">{cita.fecha} | {cita.hora.slice(0, 5)}</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          cita.estado === 'confirmada' ? 'bg-teal-500/20 text-teal-300' :
                          cita.estado === 'pre_reserva' ? 'bg-amber-500/20 text-amber-300' :
                          cita.estado === 'atendida' ? 'bg-indigo-500/20 text-indigo-300' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {cita.estado}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 rounded-3xl border border-slate-800/60 bg-slate-900/20 text-center h-48 flex flex-col justify-center items-center space-y-2">
            <FileText className="w-8 h-8 text-slate-700" />
            <p className="text-xs text-slate-500">Seleccione un cliente para ver su ficha clínica y notas</p>
          </div>
        )}
      </div>
    </div>
  );
}
