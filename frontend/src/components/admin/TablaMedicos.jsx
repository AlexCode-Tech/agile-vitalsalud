import React, { useState, useEffect } from 'react';
import { obtenerTodosMedicos, actualizarMedico, eliminarMedico } from '../../api/medicosApi';
import { obtenerEspecialidades } from '../../api/especialidadesApi';
import { User, CheckCircle, XCircle, Edit2, X, Trash2, Filter } from 'lucide-react';

const orderMap = {
  'Consulta General': 1,
  'Oftalmología General': 2,
  'Oftalmologia General': 2,
  'Retinología': 3,
  'Retinologia': 3,
  'Glaucoma': 4,
  'Cirugía Refractiva': 5,
  'Ciruguia Refractiva': 5,
  'Contactología': 6,
  'Contactologia': 6,
  'Oftalmología Pediátrica': 7,
  'Oftalmologia Pediatrica': 7,
  'Pediatria Oftalmologica': 7,
};

const getRecertificacionStatus = (fechaString) => {
  if (!fechaString) return { text: 'Sin registrar', badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700/50' };
  const date = new Date(fechaString);
  const fecha = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const hoy = new Date();
  
  const diffMs = hoy.getTime() - fecha.getTime();
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  
  if (diffYears >= 5.0) {
    return { text: 'Vencido', badgeClass: 'bg-red-500/10 text-red-400 border border-red-500/20' };
  } else if (diffYears >= 4.5) {
    return { text: 'Por vencer', badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
  } else {
    return { text: 'Vigente', badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
  }
};

const formatFecha = (fechaString) => {
  if (!fechaString) return '—';
  const d = new Date(fechaString);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

const getFechaFin = (fechaString) => {
  if (!fechaString) return '—';
  const d = new Date(fechaString);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear() + 5;
  return `${day}/${month}/${year}`;
};

const getTodayString = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const handleKeyDownDate = (e) => {
  if (['Tab', 'Escape', 'Enter'].includes(e.key)) {
    return;
  }
  e.preventDefault();
  alert('Debe seleccionar el icono del calendario para escoger la fecha.');
};

const handleDateMouseDown = (e) => {
  const rect = e.target.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  if (clickX < rect.width - 40) {
    e.preventDefault();
    alert('Debe seleccionar el icono del calendario para escoger la fecha.');
  }
};

export default function TablaMedicos({ refreshTrigger }) {
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  // Filter States
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('todos');
  const [filtroCmp, setFiltroCmp] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  
  // Edit State
  const [editingMedico, setEditingMedico] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    especialidad: '',
    telefono: '',
    correo: '',
    fecha_recertificacion: '',
    estado: 'activo',
    dni: ''
  });
  const [editCargando, setEditCargando] = useState(false);
  const [editError, setEditError] = useState('');
  const [editExito, setEditExito] = useState(false);

  // Delete State
  const [deletingMedico, setDeletingMedico] = useState(null);
  const [deleteCargando, setDeleteCargando] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadMedicos = async () => {
    try {
      setCargando(true);
      const data = await obtenerTodosMedicos();
      setMedicos(data);
    } catch (err) {
      setError('Error al cargar el listado de médicos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    loadMedicos();
    async function loadEsps() {
      try {
        const data = await obtenerEspecialidades();
        setEspecialidades(data);
      } catch (err) {
        console.error('Error al cargar especialidades:', err);
      }
    }
    loadEsps();
  }, [refreshTrigger]);

  const handleStatusChange = async (medico, nuevoEstado) => {
    try {
      const formData = new FormData();
      formData.append('nombre', medico.nombre);
      formData.append('especialidad', medico.especialidad);
      formData.append('telefono', medico.telefono || '');
      formData.append('correo', medico.correo || '');
      formData.append('estado', nuevoEstado);
      if (medico.fecha_recertificacion) {
        formData.append('fecha_recertificacion', medico.fecha_recertificacion.substring(0, 10));
      }
      
      await actualizarMedico(medico.id, formData);
      loadMedicos();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al cambiar el estado del médico.');
    }
  };

  const handleDeleteMedico = (medico) => {
    setDeletingMedico(medico);
    setDeleteError('');
  };

  const confirmDeleteMedico = async (id) => {
    setDeleteCargando(true);
    setDeleteError('');
    try {
      await eliminarMedico(id);
      setDeletingMedico(null);
      loadMedicos();
    } catch (err) {
      setDeleteError(err.response?.data?.mensaje || 'Error al eliminar el médico.');
    } finally {
      setDeleteCargando(false);
    }
  };

  const startEdit = (medico) => {
    setEditingMedico(medico);
    setEditForm({
      nombre: (medico.nombre || '').toUpperCase(),
      especialidad: medico.especialidad,
      telefono: medico.telefono || '',
      correo: medico.correo || '',
      fecha_recertificacion: medico.fecha_recertificacion ? medico.fecha_recertificacion.substring(0, 10) : '',
      estado: medico.estado,
      dni: medico.dni || ''
    });
    setEditError('');
    setEditExito(false);
  };

  const handleEditChange = (e) => {
    let { name, value } = e.target;
    if (name === 'nombre') {
      value = value.toUpperCase();
    }
    if (name === 'dni') {
      value = value.replace(/\D/g, '').slice(0, 8);
    }
    setEditForm({ ...editForm, [name]: value });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditCargando(true);
    setEditError('');
    setEditExito(false);

    if (editForm.dni && (!/^\d{8}$/.test(editForm.dni))) {
      setEditError('El DNI debe tener exactamente 8 dígitos numéricos.');
      setEditCargando(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('nombre', editForm.nombre);
      formData.append('especialidad', editForm.especialidad);
      formData.append('telefono', editForm.telefono);
      formData.append('correo', editForm.correo);
      formData.append('fecha_recertificacion', editForm.fecha_recertificacion);
      formData.append('estado', editForm.estado);
      if (editForm.dni) formData.append('dni', editForm.dni);
      await actualizarMedico(editingMedico.id, formData);
      setEditExito(true);
      setTimeout(() => {
        setEditingMedico(null);
        loadMedicos();
      }, 1000);
    } catch (err) {
      setEditError(err.response?.data?.mensaje || 'Error al actualizar el médico.');
    } finally {
      setEditCargando(false);
    }
  };

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  const medicosFiltrados = medicos.filter(medico => {
    const cumpleEspecialidad = filtroEspecialidad === 'todos' || medico.especialidad === filtroEspecialidad;
    const cumpleEstado = filtroEstado === 'todos' || medico.estado === filtroEstado;
    const cmpValueClean = medico.colegiatura ? medico.colegiatura.replace(/^CMP/i, '') : '';
    const query = filtroCmp.trim().toLowerCase();
    const cumpleCmp = !query || 
      (medico.colegiatura && medico.colegiatura.toLowerCase().includes(query)) ||
      cmpValueClean.toLowerCase().includes(query);
    return cumpleEspecialidad && cumpleEstado && cumpleCmp;
  });

  if (cargando) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">


      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/20">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
          <Filter className="w-4 h-4 text-teal-400" />
          <span>Filtros:</span>
        </div>


        
        {/* Filtro Especialidad */}
        <div className="flex flex-col gap-1.5 min-w-[200px] flex-1 md:flex-initial">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Especialidad</span>
          <select
            value={filtroEspecialidad}
            onChange={(e) => setFiltroEspecialidad(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500 cursor-pointer transition-colors"
          >
            <option value="todos">Todas las especialidades</option>
            {[...especialidades]
              .sort((a, b) => (orderMap[a.nombre] || 99) - (orderMap[b.nombre] || 99))
              .map(esp => {
                const order = orderMap[esp.nombre];
                const displayLabel = order ? `${order}. ${esp.nombre}` : esp.nombre;
                return (
                  <option key={esp.id} value={esp.nombre}>{displayLabel}</option>
                );
              })
            }
          </select>
        </div>

        {/* Filtro CMP */}
        <div className="flex flex-col gap-1.5 min-w-[120px] flex-1 md:flex-initial">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CMP</span>
          <input
            type="text"
            value={filtroCmp}
            onChange={(e) => setFiltroCmp(e.target.value)}
            placeholder="Buscar por CMP..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>



        {/* Botón de Limpiar Filtros */}
        {(filtroEspecialidad !== 'todos' || filtroEstado !== 'todos' || filtroCmp !== '') && (
          <button
            onClick={() => {
              setFiltroEspecialidad('todos');
              setFiltroEstado('todos');
              setFiltroCmp('');
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-xl text-xs font-bold transition-all"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="w-full border-collapse text-left text-sm text-slate-300">
          <thead className="bg-slate-900 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-4">Foto</th>
              <th scope="col" className="px-6 py-4">Nombre</th>
              <th scope="col" className="px-6 py-4">Especialidad</th>
              <th scope="col" className="px-6 py-4">CMP</th>
              <th scope="col" className="px-6 py-4">DNI</th>
              <th scope="col" className="px-6 py-4">Fecha de Recertificación</th>
              <th scope="col" className="px-6 py-4">Teléfono</th>
              <th scope="col" className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {medicosFiltrados.map((medico) => (
              <tr key={medico.id} className="hover:bg-slate-800/20 transition-all">
                <td className="px-6 py-4">
                  {medico.foto_url ? (
                    <img 
                      src={`${API_BASE}${medico.foto_url}`} 
                      alt={medico.nombre} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-700" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 font-medium text-slate-200">
                  {medico.nombre}{' '}
                  {medico.correo && (
                    <span className="text-xs text-slate-400 font-normal font-mono">({medico.correo})</span>
                  )}
                </td>
                <td className="px-6 py-4">{medico.especialidad}</td>
                <td className="px-6 py-4 font-mono text-xs">{medico.colegiatura ? medico.colegiatura.replace(/^CMP/i, '') : ''}</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-300">{medico.dni || <span className="text-slate-600">—</span>}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 w-max">
                    <span className="text-xs font-mono">{getFechaFin(medico.fecha_recertificacion)}</span>
                    {medico.fecha_recertificacion && (
                      <span className={`inline-flex items-center justify-center text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${getRecertificacionStatus(medico.fecha_recertificacion).badgeClass}`}>
                        {getRecertificacionStatus(medico.fecha_recertificacion).text}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">{medico.telefono || '-'}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => startEdit(medico)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-teal-400 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteMedico(medico)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 hover:bg-red-500 hover:text-slate-950 text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {medicosFiltrados.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                  No se encontraron médicos con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingMedico && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 relative">
            <button 
              onClick={() => setEditingMedico(null)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold font-display text-slate-200">Editar Médico</h3>
              <p className="text-xs text-slate-400">Modifica la información del especialista</p>
            </div>

            {editExito && (
              <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-400" />
                <span>Datos guardados exitosamente</span>
              </div>
            )}

            {editError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nombre Completo *</label>
                <input
                  type="text"
                  name="nombre"
                  value={editForm.nombre}
                  onChange={handleEditChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">DNI <span className="text-slate-600 normal-case font-normal">(8 dígitos)</span></label>
                <input
                  type="text"
                  name="dni"
                  value={editForm.dni}
                  onChange={handleEditChange}
                  maxLength={8}
                  placeholder="12345678"
                  inputMode="numeric"
                  pattern="[0-9]{8}"
                  className="w-full px-4 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-teal-500 transition-colors font-mono"
                />
              </div>



              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
                <input
                  type="email"
                  name="correo"
                  value={editForm.correo}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Especialidad *</label>
                <select
                  name="especialidad"
                  value={editForm.especialidad}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
                >
                  {especialidades.map(esp => (
                    <option key={esp.id} value={esp.nombre}>{esp.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Fecha de Recertificación *</label>
                <input
                  type="date"
                  name="fecha_recertificacion"
                  value={editForm.fecha_recertificacion}
                  onChange={handleEditChange}
                  min={getTodayString()}
                  onKeyDown={handleKeyDownDate}
                  onMouseDown={handleDateMouseDown}
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:bg-teal-500 [&::-webkit-calendar-picker-indicator]:rounded-md [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={editForm.telefono}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Estado</label>
                <select
                  name="estado"
                  value={editForm.estado}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Ausente</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMedico(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 hover:text-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editCargando}
                  className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-900 font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {editCargando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMedico && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 relative">
            <button 
              onClick={() => setDeletingMedico(null)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-display text-slate-200">¿Eliminar médico?</h3>
                <p className="text-sm text-slate-400">
                  Esta acción eliminará de forma permanente al <strong>{deletingMedico.nombre}</strong> y todas sus citas y pagos relacionados.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingMedico(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 hover:text-slate-200 transition-all text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteCargando}
                onClick={() => confirmDeleteMedico(deletingMedico.id)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-slate-950 font-bold rounded-xl transition-all text-sm disabled:opacity-50"
              >
                {deleteCargando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
