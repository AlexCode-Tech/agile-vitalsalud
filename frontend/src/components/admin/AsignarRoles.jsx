import React, { useState, useEffect } from 'react';
import {
  Shield, CheckCircle, AlertCircle, RefreshCw,
  Filter, X, Pencil, Trash2, Save, AlertTriangle
} from 'lucide-react';
import { obtenerUsuarios, actualizarRol, editarUsuario, eliminarUsuario } from '../../api/adminApi';

/* ─────────────────── helpers ─────────────────── */
const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:border-teal-500 transition-colors';
const selectCls = `${inputCls} cursor-pointer`;
const labelCls = 'block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5';

const rolColors = {
  Administrador: 'bg-red-500/10 text-red-400',
  Recepcionista: 'bg-teal-500/10 text-teal-400',
  Medico: 'bg-purple-500/10 text-purple-400',
};

/* ─────────────────── modal overlay ─────────────────── */
function ModalOverlay({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

/* ─────────────────── main component ─────────────────── */
export default function AsignarRoles() {
  const [usuarios, setUsuarios] = useState([]);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [cargando, setCargando] = useState(true);

  /* filtros */
  const [filtroDni, setFiltroDni] = useState('');
  const [filtroCorreo, setFiltroCorreo] = useState('');
  const [filtroTelefono, setFiltroTelefono] = useState('');
  const [filtroColegiatura, setFiltroColegiatura] = useState('');
  const [filtroVerificado, setFiltroVerificado] = useState('todos');
  const [filtroRol, setFiltroRol] = useState('todos');

  /* modal editar */
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [editCorreo, setEditCorreo] = useState('');
  const [editVerificado, setEditVerificado] = useState(false);
  const [editRol, setEditRol] = useState('');
  const [guardando, setGuardando] = useState(false);

  /* modal eliminar */
  const [usuarioEliminar, setUsuarioEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const hayFiltrosActivos =
    filtroDni || filtroCorreo || filtroTelefono || filtroColegiatura ||
    filtroVerificado !== 'todos' || filtroRol !== 'todos';

  /* ── data ── */
  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      setMensajeError('');
      const data = await obtenerUsuarios();
      setUsuarios(data);
    } catch {
      setMensajeError('Error al obtener el listado de usuarios del servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const mostrarExito = (msg) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(''), 4000);
  };

  /* ── rol rápido ── */
  const handleRolChange = async (id, nuevoRol) => {
    try {
      setMensajeError('');
      setMensajeExito('');
      await actualizarRol(id, nuevoRol);
      setUsuarios(prev => prev.map(u => (u.id === id ? { ...u, rol: nuevoRol } : u)));
      const u = usuarios.find(x => x.id === id);
      mostrarExito(`Rol actualizado para ${u?.correo ?? 'usuario'} → ${nuevoRol}.`);
    } catch (err) {
      setMensajeError(err.response?.data?.mensaje || 'Error al actualizar el rol.');
    }
  };

  /* ── abrir modal editar ── */
  const abrirEditar = (u) => {
    setUsuarioEditar(u);
    setEditCorreo(u.correo);
    setEditVerificado(!!u.verificado);
    setEditRol(u.rol);
    setMensajeError('');
  };

  /* ── guardar edición ── */
  const guardarEdicion = async () => {
    if (!editCorreo.trim()) {
      setMensajeError('El correo no puede estar vacío.');
      return;
    }
    try {
      setGuardando(true);
      setMensajeError('');
      // Actualizar correo y verificado
      await editarUsuario(usuarioEditar.id, { correo: editCorreo, verificado: editVerificado });
      // Actualizar rol si cambió
      if (editRol !== usuarioEditar.rol) {
        await actualizarRol(usuarioEditar.id, editRol);
      }
      setUsuarios(prev =>
        prev.map(u =>
          u.id === usuarioEditar.id
            ? { ...u, correo: editCorreo, verificado: editVerificado ? 1 : 0, rol: editRol }
            : u
        )
      );
      setUsuarioEditar(null);
      mostrarExito(`Usuario "${editCorreo}" actualizado exitosamente.`);
    } catch (err) {
      setMensajeError(err.response?.data?.mensaje || 'Error al guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  };

  /* ── confirmar eliminación ── */
  const confirmarEliminar = async () => {
    try {
      setEliminando(true);
      setMensajeError('');
      await eliminarUsuario(usuarioEliminar.id);
      setUsuarios(prev => prev.filter(u => u.id !== usuarioEliminar.id));
      mostrarExito(`Usuario "${usuarioEliminar.correo}" eliminado de la base de datos.`);
      setUsuarioEliminar(null);
    } catch (err) {
      setMensajeError(err.response?.data?.mensaje || 'Error al eliminar el usuario.');
      setUsuarioEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  /* ── filtrado ── */
  const limpiarFiltros = () => {
    setFiltroDni(''); setFiltroCorreo(''); setFiltroTelefono('');
    setFiltroColegiatura(''); setFiltroVerificado('todos'); setFiltroRol('todos');
  };

  const usuariosFiltrados = usuarios.filter(u => {
    if (filtroDni && !(u.dni || '').includes(filtroDni)) return false;
    if (filtroCorreo && !(u.correo || '').toLowerCase().includes(filtroCorreo.toLowerCase())) return false;
    if (filtroTelefono && !(u.telefono || '').includes(filtroTelefono)) return false;
    if (filtroColegiatura && !(u.colegiatura || '').toLowerCase().includes(filtroColegiatura.toLowerCase())) return false;
    if (filtroVerificado === 'verificado' && !u.verificado) return false;
    if (filtroVerificado === 'pendiente' && u.verificado) return false;
    if (filtroRol !== 'todos' && u.rol !== filtroRol) return false;
    return true;
  });

  /* ─────────── render ─────────── */
  return (
    <div className="space-y-6">

      {/* ── Encabezado ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-teal-400" />
            Asignación de Roles
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Gestione y configure los privilegios de los usuarios del sistema VitalSalud.
            Los cambios se persisten en la base de datos de manera inmediata.
          </p>
        </div>
        <button
          onClick={cargarUsuarios}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
          Refrescar
        </button>
      </div>

      {/* ── Mensajes ── */}
      {mensajeExito && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm font-medium">
          <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}
      {mensajeError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{mensajeError}</span>
        </div>
      )}

      {/* ── Panel de Filtros ── */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Filter className="w-4 h-4 text-teal-400" />
            <span>Filtros</span>
            {hayFiltrosActivos && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-teal-500/20 text-teal-400 font-bold">activos</span>
            )}
          </div>
          {hayFiltrosActivos && (
            <button onClick={limpiarFiltros} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-teal-400 transition-all">
              <X className="w-3 h-3" /> Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>Buscar por DNI</label>
            <input type="text" placeholder="12345678" value={filtroDni} onChange={e => setFiltroDni(e.target.value)} maxLength={8} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Correo Electrónico</label>
            <input type="text" placeholder="nombre@vitalsalud.com" value={filtroCorreo} onChange={e => setFiltroCorreo(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Teléfono</label>
            <input type="text" placeholder="987654321" value={filtroTelefono} onChange={e => setFiltroTelefono(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>CMP</label>
            <input type="text" placeholder="123456" value={filtroColegiatura} onChange={e => setFiltroColegiatura(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Verificación</label>
            <select value={filtroVerificado} onChange={e => setFiltroVerificado(e.target.value)} className={selectCls}>
              <option value="todos">Todos</option>
              <option value="verificado">Verificado</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Rol Asignado</label>
            <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)} className={selectCls}>
              <option value="todos">Todos los roles</option>
              <option value="Paciente">Paciente</option>
              <option value="Recepcionista">Recepcionista</option>
              <option value="Medico">Médico</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        {cargando && usuarios.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">Usuario (Correo)</th>
                  <th className="p-4">DNI</th>
                  <th className="p-4">CMP</th>
                  <th className="p-4">Teléfono</th>
                  <th className="p-4">Verificación</th>
                  <th className="p-4">Rol Asignado</th>
                  <th className="p-4">Rol rápido</th>
                  <th className="p-4 pr-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm">
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-8 h-8 text-slate-600" />
                        <span>No se encontraron usuarios con los filtros seleccionados.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/25 transition-colors">
                      {/* Correo */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-400 shrink-0">
                            {(u.correo || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200">{u.correo}</p>
                            <span className="text-xs text-slate-500">ID: #{u.id}</span>
                          </div>
                        </div>
                      </td>
                      {/* DNI */}
                      <td className="p-4 text-slate-300 font-mono text-xs">{u.dni || '—'}</td>
                      {/* Colegiatura */}
                      <td className="p-4 text-xs">
                        {u.colegiatura
                          ? <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono">{u.colegiatura.replace(/^CMP/i, '')}</span>
                          : <span className="text-slate-600">—</span>}
                      </td>
                      {/* Teléfono */}
                      <td className="p-4 text-slate-400 text-xs font-mono">{u.telefono || '—'}</td>
                      {/* Verificación */}
                      <td className="p-4">
                        {u.verificado
                          ? <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400">Verificado</span>
                          : <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400">Pendiente</span>}
                      </td>
                      {/* Rol badge */}
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${rolColors[u.rol] || 'bg-blue-500/10 text-blue-400'}`}>
                          {u.rol}
                        </span>
                      </td>
                      {/* Selector de rol rápido */}
                      <td className="p-4">
                        <select
                          value={u.rol}
                          onChange={(e) => handleRolChange(u.id, e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-300 focus:outline-none focus:border-teal-500 cursor-pointer"
                        >
                          <option value="Paciente">Paciente</option>
                          <option value="Recepcionista">Recepcionista</option>
                          <option value="Medico">Medico</option>
                          <option value="Administrador">Administrador</option>
                        </select>
                      </td>
                      {/* Acciones */}
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-center gap-2">
                          {/* Editar */}
                          <button
                            onClick={() => abrirEditar(u)}
                            title="Editar usuario"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 text-xs font-semibold transition-all border border-teal-500/20 hover:border-teal-500/40"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </button>
                          {/* Eliminar */}
                          <button
                            onClick={() => setUsuarioEliminar(u)}
                            title="Eliminar usuario"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-all border border-red-500/20 hover:border-red-500/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL EDITAR ─── */}
      {usuarioEditar && (
        <ModalOverlay onClose={() => setUsuarioEditar(null)}>
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3 pr-8">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                <Pencil className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Editar Usuario</h3>
                <p className="text-xs text-slate-500">ID #{usuarioEditar.id}</p>
              </div>
            </div>

            {/* Error local */}
            {mensajeError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {mensajeError}
              </div>
            )}

            {/* Campos */}
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Correo Electrónico</label>
                <input
                  type="email"
                  value={editCorreo}
                  onChange={e => setEditCorreo(e.target.value)}
                  className={inputCls + ' text-sm py-2.5'}
                  placeholder="correo@vitalsalud.com"
                />
              </div>

              <div>
                <label className={labelCls}>Rol</label>
                <select
                  value={editRol}
                  onChange={e => setEditRol(e.target.value)}
                  className={selectCls + ' text-sm py-2.5'}
                >
                  <option value="Paciente">Paciente</option>
                  <option value="Recepcionista">Recepcionista</option>
                  <option value="Medico">Medico</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800">
                <div>
                  <p className="text-sm font-semibold text-slate-200">Cuenta verificada</p>
                  <p className="text-xs text-slate-500 mt-0.5">Controla si el usuario puede acceder al sistema</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditVerificado(v => !v)}
                  className={`relative w-10 h-5 rounded-full transition-all ${editVerificado ? 'bg-teal-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${editVerificado ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setUsuarioEditar(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                disabled={guardando}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-900 text-sm font-bold transition-all"
              >
                {guardando
                  ? <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-slate-900" />
                  : <Save className="w-4 h-4" />}
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ─── MODAL CONFIRMAR ELIMINACIÓN ─── */}
      {usuarioEliminar && (
        <ModalOverlay onClose={() => setUsuarioEliminar(null)}>
          <div className="p-6 space-y-5">
            {/* Warning icon */}
            <div className="flex flex-col items-center gap-3 text-center pt-2">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">¿Eliminar usuario?</h3>
                <p className="text-xs text-slate-400 mt-1.5 max-w-xs">
                  Esta acción eliminará permanentemente al usuario
                  <span className="text-slate-200 font-semibold"> {usuarioEliminar.correo} </span>
                  y todos sus datos asociados de la base de datos. Esta acción{' '}
                  <span className="text-red-400 font-bold">no se puede deshacer</span>.
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => setUsuarioEliminar(null)}
                disabled={eliminando}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-sm font-bold transition-all"
              >
                {eliminando
                  ? <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                  : <Trash2 className="w-4 h-4" />}
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
