const Medico = require('../models/Medico');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const validarDNI = require('../utils/validarDNI');
const fs = require('fs');
const path = require('path');

/**
 * HU-02: Registrar Médicos
 */
exports.registrarMedico = async (req, res) => {
  const { colegiatura, nombre, especialidad, telefono, correo, dni, estado, fecha_recertificacion } = req.body;

  if (!colegiatura || !nombre || !especialidad) {
    return res.status(400).json({ mensaje: 'Colegiatura, nombre y especialidad son obligatorios' });
  }

  try {
    // Validar colegiatura única
    const medicoExistente = await Medico.findByColegiatura(colegiatura);
    if (medicoExistente) {
      return res.status(409).json({ mensaje: 'Número de colegiatura ya registrado' });
    }

    // Si viene correo, validar que no esté en usuarios o médicos
    if (correo) {
      const [userRows] = await db.execute('SELECT id FROM usuarios WHERE correo = ?', [correo]);
      if (userRows.length > 0) {
        return res.status(409).json({ mensaje: 'El correo electrónico ya está registrado por otro usuario.' });
      }
      const [medicoRows] = await db.execute('SELECT id FROM medicos WHERE correo = ?', [correo]);
      if (medicoRows.length > 0) {
        return res.status(409).json({ mensaje: 'El correo electrónico ya está registrado por otro médico.' });
      }
    }

    // Validar DNI si se provee
    if (dni) {
      if (!validarDNI(dni)) {
        return res.status(400).json({ mensaje: 'El DNI debe tener exactamente 8 dígitos numéricos.' });
      }
      const [dniCheck] = await db.execute('SELECT id FROM medicos WHERE dni = ?', [dni]);
      if (dniCheck.length > 0) {
        return res.status(409).json({ mensaje: 'El DNI ya está registrado por otro médico.' });
      }
    }

    const fotoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const nuevoMedico = await Medico.create({
      colegiatura,
      nombre,
      especialidad,
      telefono,
      correo: correo || null,
      dni: dni || null,
      fotoUrl,
      estado: estado || 'activo',
      fecha_recertificacion: fecha_recertificacion || null
    });

    // Si viene correo, registrar el usuario correspondiente
    if (correo) {
      const passwordToHash = req.body.password || 'password123';
      const passwordHash = await bcrypt.hash(passwordToHash, 10);
      await db.execute(
        'INSERT INTO usuarios (correo, password_hash, rol, verificado, id_medico) VALUES (?, ?, ?, ?, ?)',
        [correo, passwordHash, 'Medico', true, nuevoMedico.id]
      );
    }

    return res.status(201).json({
      mensaje: 'Médico registrado exitosamente',
      medico: nuevoMedico
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al registrar el médico', error: error.message });
  }
};

/**
 * Obtener catálogo público de médicos
 */
exports.listarMedicosActivos = async (req, res) => {
  try {
    const medicos = await Medico.listActive();
    return res.status(200).json(medicos);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener la lista de médicos', error: error.message });
  }
};

/**
 * Obtener todos los médicos (solo Administrador)
 */
exports.listarTodosMedicos = async (req, res) => {
  try {
    const medicos = await Medico.listAll();
    return res.status(200).json(medicos);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener todos los médicos', error: error.message });
  }
};

/**
 * Actualizar médico (solo Administrador)
 */
exports.actualizarMedico = async (req, res) => {
  const { id } = req.params;
  const { nombre, especialidad, telefono, correo, dni, estado, fecha_recertificacion } = req.body;

  if (!nombre || !especialidad || !estado) {
    return res.status(400).json({ mensaje: 'Nombre, especialidad y estado son obligatorios' });
  }

  try {
    const medico = await Medico.findById(id);
    if (!medico) {
      return res.status(404).json({ mensaje: 'Médico no encontrado' });
    }

    if (dni !== undefined && dni !== null && dni !== '') {
      if (!validarDNI(dni)) {
        return res.status(400).json({ mensaje: 'El DNI debe tener exactamente 8 dígitos numéricos.' });
      }
      const [dniCheck] = await db.execute('SELECT id FROM medicos WHERE dni = ? AND id != ?', [dni, id]);
      if (dniCheck.length > 0) {
        return res.status(409).json({ mensaje: 'El DNI ya está registrado por otro médico.' });
      }
    }

    // Sincronizar con usuarios si correo es proveído en el request body
    if (correo !== undefined) {
      const cleanCorreo = correo ? correo.trim() : null;

      const [userRows] = await db.execute('SELECT id, correo FROM usuarios WHERE id_medico = ?', [id]);
      const usuarioExistente = userRows[0];

      if (cleanCorreo) {
        // Validar que no esté tomado por otro usuario
        const [emailCheck] = await db.execute(
          'SELECT id FROM usuarios WHERE correo = ? AND (id_medico IS NULL OR id_medico != ?)',
          [cleanCorreo, id]
        );
        if (emailCheck.length > 0) {
          return res.status(409).json({ mensaje: 'El correo electrónico ya está registrado por otro usuario.' });
        }

        // Validar que no esté tomado por otro médico
        const [medicoEmailCheck] = await db.execute(
          'SELECT id FROM medicos WHERE correo = ? AND id != ?',
          [cleanCorreo, id]
        );
        if (medicoEmailCheck.length > 0) {
          return res.status(409).json({ mensaje: 'El correo electrónico ya está registrado por otro médico.' });
        }

        if (usuarioExistente) {
          if (usuarioExistente.correo !== cleanCorreo) {
            await db.execute('UPDATE usuarios SET correo = ? WHERE id_medico = ?', [cleanCorreo, id]);
          }
        } else {
          const passwordHash = await bcrypt.hash('password123', 10);
          await db.execute(
            'INSERT INTO usuarios (correo, password_hash, rol, verificado, id_medico) VALUES (?, ?, ?, ?, ?)',
            [cleanCorreo, passwordHash, 'Medico', true, id]
          );
        }
      } else {
        if (usuarioExistente) {
          await db.execute('DELETE FROM usuarios WHERE id_medico = ?', [id]);
        }
      }
    }

    const fotoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    await Medico.update(id, {
      nombre,
      especialidad,
      telefono,
      correo: correo !== undefined ? (correo || null) : medico.correo,
      dni: dni !== undefined ? (dni || null) : medico.dni,
      fotoUrl,
      estado,
      fecha_recertificacion: fecha_recertificacion !== undefined ? (fecha_recertificacion || null) : medico.fecha_recertificacion
    });

    const medicoActualizado = await Medico.findById(id);
    return res.status(200).json({
      mensaje: 'Médico actualizado exitosamente',
      medico: medicoActualizado
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al actualizar el médico', error: error.message });
  }
};

/**
 * Eliminar médico (solo Administrador)
 */
exports.eliminarMedico = async (req, res) => {
  const { id } = req.params;

  try {
    const medico = await Medico.findById(id);
    if (!medico) {
      return res.status(404).json({ mensaje: 'Médico no encontrado' });
    }

    // Programmatically delete doctor from seedMedicos.js if it exists
    try {
      const seedPath = path.join(__dirname, '..', 'seedMedicos.js');
      if (fs.existsSync(seedPath)) {
        let seedContent = fs.readFileSync(seedPath, 'utf8');
        const lineRegex = new RegExp(`^\\s*\\{\\s*colegiatura:\\s*['"]${medico.colegiatura}['"].*\\},?\\s*\\r?\\n`, 'm');
        if (lineRegex.test(seedContent)) {
          seedContent = seedContent.replace(lineRegex, '');
          fs.writeFileSync(seedPath, seedContent, 'utf8');
        }
      }
    } catch (fsErr) {
      console.error('Error al actualizar seedMedicos.js:', fsErr.message);
    }

    await Medico.delete(id);
    return res.status(200).json({ mensaje: 'Médico eliminado exitosamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al eliminar el médico', error: error.message });
  }
};

/**
 * Toggle ausencia: alterna el estado del médico entre 'activo' y 'ausente'
 */
exports.toggleAusencia = async (req, res) => {
  const { id } = req.params;
  try {
    const medico = await Medico.findById(id);
    if (!medico) {
      return res.status(404).json({ mensaje: 'Médico no encontrado' });
    }
    const nuevoEstado = medico.estado === 'ausente' ? 'activo' : 'ausente';
    await db.execute('UPDATE medicos SET estado = ? WHERE id = ?', [nuevoEstado, id]);
    return res.status(200).json({ mensaje: 'Estado actualizado', estado: nuevoEstado });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al actualizar estado', error: error.message });
  }
};
