const express = require('express');
const router = express.Router();
const reservasController = require('../controllers/reservasController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// HU-08: Visualizar agenda de citas del paciente autenticado
router.get('/mis-citas', authMiddleware, roleMiddleware('Paciente'), reservasController.listarMisCitas);

// Agenda del médico autenticado
router.get('/medico', authMiddleware, roleMiddleware('Medico'), reservasController.listarCitasMedico);

router.get('/ocupadas', authMiddleware, reservasController.listarHorasOcupadas);

// HU-06: Registrar reserva
router.post('/', authMiddleware, reservasController.registrarReserva);

// HU-04: Consultar citas por DNI (Recepcionista o Administrador)
router.get('/', authMiddleware, roleMiddleware('Recepcionista', 'Administrador'), reservasController.consultarPorDNI);

// HU-05: Cancelar reserva
router.patch('/:id/cancelar', authMiddleware, reservasController.cancelarReserva);

// HU-03: Marcar cita como atendida (Recepcionista o Administrador)
router.patch('/:id/atender', authMiddleware, roleMiddleware('Recepcionista', 'Administrador'), reservasController.atenderReserva);

// HU-11: Confirmar cita / pago (Tarjeta + Yape/Plin)
router.patch('/:id/pagar', authMiddleware, reservasController.confirmarPago);

// Mercado Pago: crear preferencia y confirmar pago aprobado
router.post('/:id/mercado-pago/preferencia', authMiddleware, roleMiddleware('Paciente'), reservasController.crearPreferenciaMercadoPago);
router.post('/:id/mercado-pago/confirmar', authMiddleware, roleMiddleware('Paciente'), reservasController.confirmarMercadoPago);

module.exports = router;
