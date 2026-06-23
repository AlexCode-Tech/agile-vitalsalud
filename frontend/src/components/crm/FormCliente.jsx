import React, { useState } from 'react';
import { agregarClienteCRM } from '../../api/crmApi';
import { consultarReniec } from '../../api/pacientesApi';
import validarDNI from '../../utils/validarDNI';
import { User, Shield, Briefcase, FileText, CheckCircle, XCircle, Loader2, Search, IdCard } from 'lucide-react';

export default function FormCliente({ onClientAdded }) {
  const [form, setForm] = useState({
    tipo: 'Paciente Activo', // 'Paciente Activo', 'Lead', 'B2B'
    dni_o_ruc: '',
    nombre: '',
    estado: 'Prospecto'
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [buscandoDNI, setBuscandoDNI] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Cambiar estado por defecto según tipo
    if (name === 'tipo') {
      let defaultEstado = 'Prospecto';
      if (value === 'Paciente Activo') defaultEstado = 'Activo';
      if (value === 'B2B') defaultEstado = 'Contacto Inicial';
      
      setForm(prev => ({ 
        ...prev, 
        tipo: value, 
        estado: defaultEstado, 
        dni_o_ruc: '', // Limpiar campo DNI/RUC
        nombre: ''
      }));
    } else {
      let updatedValue = value;
      if (name === 'dni_o_ruc') {
        if (form.tipo === 'Paciente Activo') {
          updatedValue = value.replace(/\D/g, '').slice(0, 8);
        } else if (form.tipo === 'B2B') {
          updatedValue = value.replace(/\D/g, '').slice(0, 11);
        }
      }
      setForm(prev => ({ ...prev, [name]: updatedValue }));
    }
    setError('');
    setExito(false);
  };

  const consultarYAutocompletarDNI = async (dniVal) => {
    setBuscandoDNI(true);
    setForm(prev => ({ ...prev, nombre: 'Buscando en RENIEC...' }));
    try {
      const data = await consultarReniec(dniVal);
      if (data && data.full_name) {
        setForm(prev => ({ ...prev, nombre: data.full_name }));
      } else {
        setForm(prev => ({ ...prev, nombre: '' }));
        setError('No se encontraron datos para este DNI en RENIEC.');
      }
    } catch (err) {
      console.error('Error al consultar DNI:', err);
      setForm(prev => ({ ...prev, nombre: '' }));
      setError('Error al consultar RENIEC (DNI no encontrado o error de API).');
    } finally {
      setBuscandoDNI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { tipo, dni_o_ruc, nombre, estado } = form;

    if (!tipo || !dni_o_ruc || !nombre || !estado) {
      setError('Todos los campos son requeridos.');
      return;
    }

    // Validaciones específicas según el tipo (RN-10)
    if (tipo === 'Paciente Activo') {
      if (!validarDNI(dni_o_ruc)) {
        setError('El DNI debe tener exactamente 8 digitos numericos');
        return;
      }
    } else if (tipo === 'B2B') {
      if (!/^\d{11}$/.test(dni_o_ruc)) {
        setError('El RUC debe tener exactamente 11 digitos numericos');
        return;
      }
    }

    setCargando(true);
    setError('');
    setExito(false);

    try {
      await agregarClienteCRM({ tipo, dni_o_ruc, nombre, estado });
      setExito(true);
      setForm({
        tipo: 'Paciente Activo',
        dni_o_ruc: '',
        nombre: '',
        estado: 'Activo'
      });
      if (onClientAdded) onClientAdded();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar el cliente en el CRM.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-6">
      <div>
        <h3 className="text-lg font-bold font-display text-slate-200 mb-1">Agregar Cliente al CRM</h3>
        <p className="text-xs text-slate-400">Registre prospectos, clientes B2C o cuentas corporativas B2B</p>
      </div>

      {exito && (
        <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
          <span>Cliente agregado al CRM exitosamente.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo */}
        <div>
          <label htmlFor="tipo" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tipo de Registro</label>
          <select
            id="tipo"
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
          >
            <option value="Paciente Activo">Paciente Activo (B2C)</option>
            <option value="Lead">Lead / Prospecto</option>
            <option value="B2B">Cliente Corporativo (B2B)</option>
          </select>
        </div>

        {/* Nombre / Razón Social */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {form.tipo === 'B2B' ? 'Razón Social / Nombre *' : 'Nombre Completo *'}
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder={form.tipo === 'B2B' ? 'Empresa de Seguros S.A.' : form.tipo === 'Paciente Activo' ? 'Se autocompletará al ingresar el DNI' : 'Juan Perez'}
              required
              readOnly={form.tipo === 'Paciente Activo'}
              className="w-full pl-10 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors read-only:opacity-60 read-only:bg-slate-950/40 read-only:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Documento Condicional (DNI o RUC) */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {form.tipo === 'B2B' ? 'RUC (11 dígitos) *' : 'DNI (8 dígitos) *'}
          </label>
          <div className="relative">
            {form.tipo === 'B2B' ? (
              <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            ) : form.tipo === 'Paciente Activo' ? (
              <IdCard className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            ) : (
              <Shield className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            )}
            <input
              type="text"
              name="dni_o_ruc"
              value={form.dni_o_ruc}
              onChange={handleChange}
              placeholder={form.tipo === 'B2B' ? '20123456789' : '12345678'}
              required
              className="w-full pl-10 pr-20 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
            />
            {form.tipo === 'Paciente Activo' && (
              <div className="absolute right-2 top-2 flex items-center gap-1.5">
                {buscandoDNI ? (
                  <Loader2 className="w-4 h-4 text-teal-400 animate-spin mr-2" />
                ) : (
                  <button
                    type="button"
                    onClick={() => consultarYAutocompletarDNI(form.dni_o_ruc)}
                    disabled={form.dni_o_ruc.length !== 8}
                    className="px-2.5 py-1.5 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-800 text-slate-900 disabled:text-slate-600 rounded-lg transition-colors flex items-center justify-center focus:outline-none cursor-pointer disabled:cursor-not-allowed text-xs font-bold gap-1"
                    title="Buscar DNI en RENIEC"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Buscar</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Estado */}
        <div>
          <label htmlFor="estado" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Estado del Cliente</label>
          <select
            id="estado"
            name="estado"
            value={form.estado}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
          >
            {form.tipo === 'Paciente Activo' && (
              <>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </>
            )}
            {form.tipo === 'Lead' && (
              <>
                <option value="Prospecto">Prospecto</option>
                <option value="Interesado">Interesado</option>
                <option value="No responde">No responde</option>
              </>
            )}
            {form.tipo === 'B2B' && (
              <>
                <option value="Contacto Inicial">Contacto Inicial</option>
                <option value="Negociación">Negociación</option>
                <option value="Contrato Firmado">Contrato Firmado</option>
              </>
            )}
          </select>
        </div>

        {/* Botón */}
        <button
          type="submit"
          disabled={cargando}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-900 font-bold rounded-xl transition-all disabled:opacity-50"
        >
          {cargando ? 'Guardando...' : 'Agregar al CRM'}
        </button>
      </form>
    </div>
  );
}
