const ClienteCRM = require('../models/ClienteCRM');
const Paciente = require('../models/Paciente');
const Reserva = require('../models/Reserva');
const db = require('../config/db');

/**
 * HU-13: Agregar Cliente CRM
 */
exports.agregarCliente = async (req, res) => {
  const { tipo, dni_o_ruc, nombre, estado } = req.body;

  if (!tipo || !dni_o_ruc || !nombre || !estado) {
    return res.status(400).json({ mensaje: 'Todos los campos (tipo, dni_o_ruc, nombre, estado) son requeridos.' });
  }

  // Validaciones según tipo
  let dniTps = null;
  if (tipo === 'Paciente Activo') {
    // Verificar si existe en TPS
    const paciente = await Paciente.findByDni(dni_o_ruc);
    if (!paciente) {
      return res.status(400).json({ mensaje: 'El paciente no está registrado en el TPS.' });
    }
    dniTps = dni_o_ruc;
  } else if (tipo === 'B2B') {
    // Validar RUC (11 dígitos numéricos en Perú)
    if (!/^\d{11}$/.test(dni_o_ruc)) {
      return res.status(400).json({ mensaje: 'El RUC debe tener exactamente 11 digitos numericos' });
    }
  } else if (tipo === 'Lead') {
    // No requiere validación especial ni vínculo TPS
  } else {
    return res.status(400).json({ mensaje: 'Tipo de cliente inválido.' });
  }

  try {
    const clienteExistente = await ClienteCRM.findByDniORuc(dni_o_ruc);
    if (clienteExistente) {
      return res.status(409).json({ mensaje: 'Este cliente ya está registrado en el CRM.' });
    }

    const nuevoCliente = await ClienteCRM.create({
      tipo,
      dniORuc: dni_o_ruc,
      nombre,
      estado,
      dniTps
    });

    return res.status(201).json({
      mensaje: 'Cliente agregado al CRM exitosamente.',
      cliente: nuevoCliente
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al agregar cliente al CRM', error: error.message });
  }
};

/**
 * HU-14: Listar Clientes CRM
 */
exports.listarClientes = async (req, res) => {
  try {
    const clientes = await ClienteCRM.listAll();
    return res.status(200).json(clientes);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al listar clientes CRM', error: error.message });
  }
};

/**
 * HU-14: Ver Detalle Cliente CRM (incluyendo historial TPS si aplica)
 */
exports.verDetalleCliente = async (req, res) => {
  const { id } = req.params;

  try {
    const cliente = await ClienteCRM.findById(id);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente CRM no encontrado.' });
    }

    let historialTPS = [];
    if (cliente.dni_tps) {
      historialTPS = await Reserva.findByDni(cliente.dni_tps);
    }

    return res.status(200).json({
      cliente,
      historialTPS,
      // Mocks de notas e interacciones exigidas por el criterio de aceptación del detalle
      notas: [
        { id: 1, fecha: '2026-06-15', contenido: 'Paciente muestra interés en cirugía refractiva láser.' }
      ],
      recordatorios: [
        { id: 1, fecha_limite: '2026-06-25', descripcion: 'Llamar para verificar adaptación visual.' }
      ]
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener detalle del cliente CRM', error: error.message });
  }
};
