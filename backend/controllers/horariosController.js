const Horario = require('../models/Horario');
const Medico = require('../models/Medico');

exports.listarHorarios = async (req, res) => {
  try {
    const horarios = await Horario.listAll();
    res.json(horarios);
  } catch (error) {
    console.error('Error al listar horarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener los horarios' });
  }
};

exports.guardarHorario = async (req, res) => {
  const { medicoId, dias, horas, duracion, turnosRaw, duracionMin } = req.body;

  if (!medicoId || !dias || !horas || !duracion || !turnosRaw || !duracionMin) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
  }

  try {
    // Verificar que el médico existe
    const medico = await Medico.findById(medicoId);
    if (!medico) {
      return res.status(404).json({ mensaje: 'El médico especificado no existe' });
    }

    const insertedId = await Horario.create({
      id_medico: medicoId,
      dias,
      horas,
      duracion,
      turnos_raw: turnosRaw,
      duracion_min: duracionMin
    });

    res.status(201).json({
      id: insertedId,
      medicoId,
      medico: medico.nombre,
      dias,
      horas,
      duracion,
      turnosRaw,
      duracionMin,
      mensaje: 'Horario guardado exitosamente'
    });
  } catch (error) {
    console.error('Error al guardar horario:', error);
    res.status(500).json({ mensaje: 'Error al guardar el horario' });
  }
};

exports.eliminarHorario = async (req, res) => {
  const { id } = req.params;

  try {
    const horario = await Horario.findById(id);
    if (!horario) {
      return res.status(404).json({ mensaje: 'El horario no existe' });
    }

    const eliminado = await Horario.delete(id);
    if (eliminado) {
      res.json({ mensaje: 'Horario eliminado exitosamente de la base de datos' });
    } else {
      res.status(500).json({ mensaje: 'No se pudo eliminar el horario' });
    }
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el horario' });
  }
};

/**
 * Alterna el estado de un día específico: 'activo' <-> 'ausente'
 * Body: { dia: 'Lunes' }
 */
exports.toggleDiaEstado = async (req, res) => {
  const { id } = req.params;
  const { dia } = req.body;

  if (!dia) return res.status(400).json({ mensaje: 'Falta el campo "dia"' });

  try {
    const horario = await Horario.findById(id);
    if (!horario) return res.status(404).json({ mensaje: 'Horario no encontrado' });

    const diasEstado = horario.diasEstado || {};
    const estadoActual = diasEstado[dia] || 'activo';
    const nuevoEstado  = estadoActual === 'ausente' ? 'activo' : 'ausente';

    diasEstado[dia] = nuevoEstado;
    await Horario.updateDiaEstado(id, diasEstado);

    return res.json({ dia, estado: nuevoEstado });
  } catch (error) {
    console.error('Error en toggleDiaEstado:', error);
    return res.status(500).json({ mensaje: 'Error al actualizar el estado', error: error.message });
  }
};
