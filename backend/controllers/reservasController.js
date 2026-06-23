const Reserva = require('../models/Reserva');
const Medico = require('../models/Medico');
const Paciente = require('../models/Paciente');
const db = require('../config/db');
const validarDNI = require('../utils/validarDNI');
const { validarSolapamientoPaciente, validarSolapamientoMedico } = require('../utils/validarSolapamiento');
const validarTiempoEspera = require('../utils/validarTiempoEspera');
const mercadoPagoService = require('../services/mercadoPagoService');

const getMontoReserva = () => Number(process.env.RESERVA_MONTO || 80);

const puedePagarReserva = (user, reserva) => {
  if (!user || !reserva) return false;
  if (user.rol !== 'Paciente') return false;
  return user.dni === reserva.dni_paciente || user.correo === reserva.paciente_correo;
};

const buildTicket = ({ reserva, payment, monto, ticketCodigo }) => ({
  codigo: ticketCodigo,
  reservaId: reserva.id,
  paymentId: String(payment.id),
  paciente: reserva.paciente_nombre,
  dni: reserva.dni_paciente,
  medico: reserva.medico_nombre,
  especialidad: reserva.medico_especialidad,
  fecha: reserva.fecha,
  hora: String(reserva.hora).substring(0, 5),
  monto,
  moneda: payment.currency_id || process.env.MP_CURRENCY_ID || 'PEN',
  metodo: payment.payment_method_id || 'mercado_pago',
  generadoEn: new Date().toISOString()
});

/**
 * HU-06: Registrar Reserva
 */
exports.registrarReserva = async (req, res) => {
  const { dni_paciente, id_medico, fecha, hora, esUrgencia } = req.body;

  if (!dni_paciente || !id_medico || !fecha || !hora) {
    return res.status(400).json({ mensaje: 'Todos los campos son requeridos.' });
  }

  // RN-01: Validar DNI
  if (!validarDNI(dni_paciente)) {
    return res.status(400).json({ mensaje: 'El DNI debe tener exactamente 8 digitos numericos' });
  }

  try {
    // Validar existencia de paciente
    let paciente = await Paciente.findByDni(dni_paciente);
    if (!paciente) {
      const puedeCompletarPerfilPaciente = req.user && req.user.rol === 'Paciente' && (!req.user.dni || req.user.dni === dni_paciente);

      if (puedeCompletarPerfilPaciente) {
        const { nombre_paciente, telefono_paciente } = req.body;
        if (!nombre_paciente) {
          return res.status(400).json({ mensaje: 'El nombre completo es obligatorio para completar tu perfil.' });
        }
        
        // Registrar en la tabla pacientes
        await Paciente.createPacienteOnly({
          dni: dni_paciente,
          nombre: nombre_paciente,
          correo: req.user.correo,
          telefono: telefono_paciente || ''
        });

        // Vincular DNI al usuario en la tabla usuarios
        await db.execute('UPDATE usuarios SET dni = ? WHERE id = ?', [dni_paciente, req.user.id]);
        
        // Actualizar req.user.dni para el flujo de este request
        req.user.dni = dni_paciente;
      } else {
        return res.status(404).json({ mensaje: 'Paciente no encontrado. Verifique el DNI ingresado.' });
      }
    }

    // Validar médico y su estado (RN-12)
    const medico = await Medico.findById(id_medico);
    if (!medico) {
      return res.status(404).json({ mensaje: 'Médico no encontrado.' });
    }
    if (medico.estado !== 'activo') {
      return res.status(400).json({ mensaje: 'El médico seleccionado no está activo.' });
    }

    // RN-04: Tiempos mínimos de espera en un mismo día (30 min)
    const tiempoValido = await validarTiempoEspera(dni_paciente, fecha, hora);
    if (!tiempoValido) {
      return res.status(400).json({ mensaje: 'Debes esperar al menos 30 minutos entre procedimientos.' });
    }

    // RN-05: Solapamiento del paciente
    const solapamientoPaciente = await validarSolapamientoPaciente(dni_paciente, fecha, hora);
    if (solapamientoPaciente) {
      return res.status(499).json({ mensaje: 'Ya tienes una cita programada en este horario. Por favor, selecciona otro momento.' });
    }

    // RN-12/RN-05: Solapamiento del médico
    const solapamientoMedico = await validarSolapamientoMedico(id_medico, fecha, hora);
    if (solapamientoMedico) {
      return res.status(409).json({ mensaje: 'Horario no disponible' });
    }

    const esStaff = req.user && (req.user.rol === 'Recepcionista' || req.user.rol === 'Administrador');
    const overrideUrgencia = esUrgencia && esStaff;

    // Crear pre-reserva (RN-02)
    const timeoutMin = parseInt(process.env.PRERESERVA_TIMEOUT_MIN) || 20;
    const expiraEn = new Date(Date.now() + timeoutMin * 60 * 1000);

    const reservaId = await Reserva.create({
      dniPaciente: dni_paciente,
      idMedico: id_medico,
      fecha,
      hora,
      expiraEn
    });

    return res.status(201).json({
      mensaje: 'Pre-reserva creada exitosamente. Complete el pago en 20 minutos.',
      reservaId,
      expiraEn
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al registrar la reserva', error: error.message });
  }
};

/**
 * HU-04: Visualizar Reserva (Consulta por DNI)
 */
exports.consultarPorDNI = async (req, res) => {
  const { dni } = req.query;

  if (!dni) {
    return res.status(400).json({ mensaje: 'El DNI es requerido.' });
  }

  if (!validarDNI(dni)) {
    return res.status(400).json({ mensaje: 'El DNI debe tener exactamente 8 digitos numericos' });
  }

  try {
    const paciente = await Paciente.findByDni(dni);
    if (!paciente) {
      return res.status(404).json({ mensaje: 'Paciente no encontrado. Verifique el DNI ingresado.' });
    }

    const reservas = await Reserva.findByDni(dni);
    return res.status(200).json(reservas);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al consultar reservas', error: error.message });
  }
};

/**
 * HU-05: Cancelar Reserva
 */
exports.cancelarReserva = async (req, res) => {
  const { id } = req.params;

  try {
    const reserva = await Reserva.findById(id);
    if (!reserva) {
      return res.status(404).json({ mensaje: 'Cita no encontrada.' });
    }

    // Obtener todas las reservas de este paciente para validar si tiene citas activas
    const todasLasReservas = await Reserva.findByDni(reserva.dni_paciente);
    const activas = todasLasReservas.filter(r => r.estado === 'confirmada' || r.estado === 'pre_reserva');
    if (activas.length === 0) {
      return res.status(400).json({ mensaje: 'Este paciente no tiene citas activas para cancelar.' });
    }

    // RN-09: Cancelación por el paciente (hasta 2 horas antes de la cita)
    if (req.user && req.user.rol === 'Paciente') {
      const horaCita = new Date(`${reserva.fecha}T${reserva.hora}`);
      const dosHorasAntes = new Date(horaCita.getTime() - 2 * 60 * 60 * 1000);
      if (new Date() > dosHorasAntes) {
        return res.status(400).json({ mensaje: 'Las citas solo pueden cancelarse hasta 2 horas antes del horario programado.' });
      }
    }

    await Reserva.cancelar(id);
    return res.status(200).json({ mensaje: 'Cita cancelada y horario liberado exitosamente.' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al cancelar la reserva', error: error.message });
  }
};

/**
 * HU-03: Cambiar Estado del Paciente ("Atendida")
 */
exports.atenderReserva = async (req, res) => {
  const { id } = req.params;

  try {
    const reserva = await Reserva.findById(id);
    if (!reserva) {
      return res.status(404).json({ mensaje: 'Cita no encontrada.' });
    }

    // RN-08: Estado ya Atendida/Cancelada
    if (reserva.estado === 'atendida' || reserva.estado === 'cancelada') {
      return res.status(400).json({ mensaje: 'Esta cita ya fue cerrada.' });
    }

    if (reserva.estado === 'pre_reserva') {
      return res.status(400).json({ mensaje: 'La cita debe estar confirmada para ser atendida.' });
    }

    await Reserva.atender(id);
    return res.status(200).json({ mensaje: 'Paciente marcado como Atendido exitosamente.' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al cambiar estado de la reserva', error: error.message });
  }
};

/**
 * HU-08: Visualizar Agenda de Citas (Paciente)
 */
exports.listarMisCitas = async (req, res) => {
  const dniPaciente = req.user.dni;

  try {
    const reservas = await Reserva.findByDni(dniPaciente);
    const activas = reservas.filter(r => r.estado === 'confirmada');

    // Retorna citas confirmadas ordenadas por fecha (o arreglo vacío)
    return res.status(200).json(activas);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener tus citas', error: error.message });
  }
};

/**
 * HU-11: Confirmar Cita / Pago
 */
exports.confirmarPago = async (req, res) => {
  const { id } = req.params;
  const { metodo, monto, simularEstado } = req.body;

  if (!metodo || !monto) {
    return res.status(400).json({ mensaje: 'Método y monto de pago son requeridos.' });
  }

  // Simulación de pasarela de pago (RN-03)
  const estadoPago = simularEstado || 'exitoso';
  if (estadoPago === 'rechazado') {
    return res.status(400).json({ mensaje: 'Pago rechazado por la pasarela' });
  }

    try {
      await Reserva.confirmarPago(id, metodo, monto);
      return res.status(200).json({ mensaje: 'Pago procesado exitosamente. Cita confirmada.' });
    } catch (error) {
      if (error.message.includes('expiró') || error.message.includes('estado de pre-reserva')) {
        return res.status(400).json({ mensaje: 'Tu reserva expiró. El horario fue liberado.' });
      }
      return res.status(500).json({ mensaje: 'Error al procesar el pago', error: error.message });
    }
  };

exports.crearPreferenciaMercadoPago = async (req, res) => {
  const { id } = req.params;

  try {
    const reserva = await Reserva.findById(id);
    if (!reserva) {
      return res.status(404).json({ mensaje: 'Reserva no encontrada.' });
    }

    if (!puedePagarReserva(req.user, reserva)) {
      return res.status(403).json({ mensaje: 'No tienes permiso para pagar esta reserva.' });
    }

    if (reserva.estado !== 'pre_reserva') {
      return res.status(400).json({ mensaje: 'Esta reserva ya no esta pendiente de pago.' });
    }

    if (new Date(reserva.expira_en) <= new Date()) {
      await Reserva.cancelarPreReserva(id);
      return res.status(400).json({ mensaje: 'Tu reserva expiro. El horario fue liberado.' });
    }

    const monto = getMontoReserva();
    const preference = await mercadoPagoService.createPreference({
      reserva,
      monto,
      frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:5173'
    });

    const useSandbox = String(process.env.MP_USE_SANDBOX || '').toLowerCase() === 'true';

    return res.status(200).json({
      preferenceId: preference.id,
      initPoint: useSandbox ? (preference.sandbox_init_point || preference.init_point) : preference.init_point,
      publicKey: process.env.MP_PUBLIC_KEY || null,
      monto,
      expiraEn: reserva.expira_en,
      reserva: {
        id: reserva.id,
        paciente: reserva.paciente_nombre,
        medico: reserva.medico_nombre,
        especialidad: reserva.medico_especialidad,
        fecha: reserva.fecha,
        hora: String(reserva.hora).substring(0, 5)
      }
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al crear la preferencia de Mercado Pago.',
      error: error.message
    });
  }
};

exports.confirmarMercadoPago = async (req, res) => {
  const { id } = req.params;
  const { paymentId, preferenceId, status } = req.body;

  try {
    const reserva = await Reserva.findById(id);
    if (!reserva) {
      return res.status(404).json({ mensaje: 'Reserva no encontrada.' });
    }

    if (!puedePagarReserva(req.user, reserva)) {
      return res.status(403).json({ mensaje: 'No tienes permiso para confirmar esta reserva.' });
    }

    if (!paymentId) {
      // Si el usuario canceló explícitamente (desde MP), marcar la pre-reserva
      // pero NO cancelarla si solo fue un rechazo del banco/Yape: el usuario puede reintentar
      // La pre-reserva expira sola por su timeout configurado
      const esCancelacionExplicita = status === 'cancelled';
      if (esCancelacionExplicita) {
        await Reserva.cancelarPreReserva(id);
        return res.status(400).json({
          mensaje: 'Cancelaste el pago. El horario fue liberado.',
          cancelado: true
        });
      }

      // Rechazo de Yape u otro medio: permitir reintento
      return res.status(402).json({
        mensaje: status === 'failure' || status === 'rejected'
          ? 'El pago fue rechazado. Puedes intentar con otro medio de pago.'
          : 'No se recibio un pago aprobado. Puedes intentar nuevamente.',
        puedeReintentar: true
      });
    }

    const payment = await mercadoPagoService.getPayment(paymentId);
    const paymentReference = String(payment.external_reference || payment.metadata?.reserva_id || '');

    if (paymentReference !== String(id)) {
      return res.status(400).json({ mensaje: 'El pago no corresponde a esta reserva.' });
    }

    if (payment.status !== 'approved') {
      if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(payment.status)) {
        await Reserva.cancelarPreReserva(id);
      }

      return res.status(400).json({
        mensaje: `Pago no aprobado (${payment.status}). La cita no fue reservada.`
      });
    }

    const monto = Number(payment.transaction_amount || getMontoReserva());
    const ticketCodigo = await Reserva.confirmarPagoMercadoPago(id, {
      payment,
      monto,
      metodo: payment.payment_method_id || 'mercado_pago',
      preferenceId
    });

    const ticket = buildTicket({ reserva, payment, monto, ticketCodigo });

    return res.status(200).json({
      mensaje: 'Pago aprobado por Mercado Pago. Cita confirmada.',
      ticket
    });
  } catch (error) {
    if (error.message.includes('expiro') || error.message.includes('estado de pre-reserva')) {
      return res.status(400).json({ mensaje: 'Tu reserva expiro o ya no esta pendiente. El horario fue liberado.' });
    }

    return res.status(500).json({
      mensaje: 'Error al confirmar el pago con Mercado Pago.',
      error: error.message
    });
  }
};

/**
 * Obtener agenda del médico autenticado
 */
exports.listarCitasMedico = async (req, res) => {
  const idMedico = req.user?.id_medico;

  if (!idMedico) {
    return res.status(400).json({ mensaje: 'El usuario no tiene un médico asociado.' });
  }

  try {
    const citas = await Reserva.findByMedicoId(idMedico);
    return res.status(200).json(citas);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener la agenda del médico', error: error.message });
  }
};

exports.listarHorasOcupadas = async (req, res) => {
  const { id_medico, fecha } = req.query;

  if (!id_medico || !fecha) {
    return res.status(400).json({ mensaje: 'Médico y fecha son requeridos.' });
  }

  try {
    const reservas = await Reserva.findOcupadasByMedicoFecha(id_medico, fecha);
    return res.status(200).json(reservas.map(r => ({
      id: r.id,
      hora: String(r.hora).substring(0, 5),
      estado: r.estado
    })));
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener horas ocupadas', error: error.message });
  }
};
