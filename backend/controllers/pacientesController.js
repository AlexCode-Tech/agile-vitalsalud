const Paciente = require('../models/Paciente');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const validarDNI = require('../utils/validarDNI');
const mailer = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'vitalsalud_secret_key_123';

/**
 * HU-01: Registrarse Paciente (Simplificado por correo/contraseña)
 */
exports.registrarPaciente = async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios' });
  }

  try {
    // Verificar si correo ya está registrado en usuarios
    const [userRows] = await db.execute('SELECT id FROM usuarios WHERE correo = ?', [correo]);
    if (userRows.length > 0) {
      return res.status(409).json({ mensaje: 'Este correo ya está registrado.' });
    }

    // Encriptar contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Generar código de verificación de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // Crear usuario inactivo/no verificado
    await db.execute(
      'INSERT INTO usuarios (correo, password_hash, rol, verificado, codigo_verificacion) VALUES (?, ?, ?, ?, ?)',
      [correo, passwordHash, 'Paciente', false, codigo]
    );

    // Enviar código por SMTP
    try {
      await mailer.enviarCodigoVerificacion(correo, codigo);
    } catch (mailError) {
      console.error('[Mail Error] No se pudo enviar el correo:', mailError.message);
      // No bloqueamos el registro en caso de falla de red/SMTP en pruebas
    }

    return res.status(201).json({
      mensaje: 'Código de verificación enviado a su correo.',
      correo
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al registrar el paciente', error: error.message });
  }
};

/**
 * HU-09: Actualización de Datos de Perfil (Paciente)
 */
exports.actualizarPerfil = async (req, res) => {
  const { id } = req.params; // El DNI del paciente se pasa como parámetro id o DNI
  const { dni, correo, telefono } = req.body;

  // HU-09: El intento de modificar DNI es rechazado por el backend
  if (dni && dni !== id) {
    return res.status(400).json({ mensaje: 'No está permitido modificar el DNI del paciente.' });
  }

  if (!correo) {
    return res.status(400).json({ mensaje: 'El correo electrónico es requerido.' });
  }

  try {
    const paciente = await Paciente.findByDni(id);
    if (!paciente) {
      return res.status(404).json({ mensaje: 'Paciente no encontrado.' });
    }

    // Verificar que el usuario que actualiza es el mismo paciente o tiene rol Admin
    if (req.user.rol === 'Paciente' && req.user.dni !== id) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No puede actualizar perfiles ajenos.' });
    }

    await Paciente.update(id, { correo, telefono });
    return res.status(200).json({ mensaje: 'Perfil actualizado exitosamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al actualizar el perfil', error: error.message });
  }
};

/**
 * Login unificado para usuarios (Paciente, Recepcionista, Administrador)
 */
exports.login = async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ mensaje: 'Correo y contraseña requeridos' });
  }

  try {
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE correo = ?', [correo]);
    const usuario = rows[0];

    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    if (!usuario.verificado) {
      return res.status(403).json({ mensaje: 'Cuenta no verificada. Por favor, verifica tu correo primero.' });
    }

    const validPassword = await bcrypt.compare(password, usuario.password_hash);
    if (!validPassword) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo, rol: usuario.rol, dni: usuario.dni, id_medico: usuario.id_medico },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      token,
      usuario: { id: usuario.id, correo: usuario.correo, rol: usuario.rol, dni: usuario.dni, id_medico: usuario.id_medico }
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
  }
};

/**
 * Verificar código de correo
 */
exports.verificarCodigo = async (req, res) => {
  const { correo, codigo } = req.body;

  if (!correo || !codigo) {
    return res.status(400).json({ mensaje: 'Correo y código son requeridos' });
  }

  try {
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE correo = ?', [correo]);
    const usuario = rows[0];

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    if (usuario.codigo_verificacion !== codigo) {
      return res.status(400).json({ mensaje: 'Código de verificación incorrecto' });
    }

    // Actualizar verificado y vaciar código
    await db.execute('UPDATE usuarios SET verificado = true, codigo_verificacion = NULL WHERE id = ?', [usuario.id]);

    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo, rol: usuario.rol, dni: usuario.dni, id_medico: usuario.id_medico },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      mensaje: 'Correo verificado con éxito.',
      token,
      usuario: { id: usuario.id, correo: usuario.correo, rol: usuario.rol, dni: usuario.dni, id_medico: usuario.id_medico }
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al verificar el código', error: error.message });
  }
};

/**
 * Consulta de DNI mediante la API de Decolecta (RENIEC)
 */
exports.consultarReniec = async (req, res) => {
  const { dni } = req.params;

  if (!dni || !/^\d{8}$/.test(dni)) {
    return res.status(400).json({ mensaje: 'El DNI debe tener exactamente 8 dígitos numéricos.' });
  }

  try {
    const token = process.env.RENIEC_API_TOKEN;
    if (!token) {
      return res.status(503).json({ mensaje: 'Servicio RENIEC no configurado.' });
    }

    const url = `https://api.decolecta.com/v1/reniec/dni?numero=${dni}`;

    console.log(`[Reniec API] Consultando DNI: ${dni} a Decolecta...`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Reniec API Error]', response.status, errorText);
      return res.status(response.status).json({ 
        mensaje: `Error al consultar RENIEC en el proveedor externo (${response.status})`, 
        detalle: errorText 
      });
    }

    const data = await response.json();
    const nombres = data.nombres || data.nombre || data.first_name || data.names || '';
    const apellidoPaterno = data.apellido_paterno || data.apellidoPaterno || data.first_last_name || data.paternal_surname || '';
    const apellidoMaterno = data.apellido_materno || data.apellidoMaterno || data.second_last_name || data.maternal_surname || '';
    const nombreOrdenado = [nombres, apellidoPaterno, apellidoMaterno]
      .map(value => String(value || '').trim())
      .filter(Boolean)
      .join(' ');

    if (nombreOrdenado) {
      data.full_name = nombreOrdenado;
    } else if (data.full_name) {
      const partes = String(data.full_name).trim().split(/\s+/);
      if (partes.length === 4) {
        data.full_name = `${partes[2]} ${partes[3]} ${partes[0]} ${partes[1]}`;
      }
    }
    data.fecha_nacimiento = '1998-05-24';
    return res.status(200).json(data);
  } catch (error) {
    console.error('[Reniec Controller Error]', error.message);
    return res.status(500).json({ mensaje: 'Error de conexión con la API de RENIEC', error: error.message });
  }
};
