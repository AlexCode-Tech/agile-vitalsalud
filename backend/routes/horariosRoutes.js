const express = require('express');
const router = express.Router();
const horariosController = require('../controllers/horariosController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Listar todos los horarios (cualquier usuario autenticado para agendar citas)
router.get('/', authMiddleware, horariosController.listarHorarios);

// Guardar configuración de horario (solo Administrador)
router.post('/', authMiddleware, roleMiddleware('Administrador'), horariosController.guardarHorario);

// Toggle estado de un día específico del horario
router.patch('/:id/dia-estado', authMiddleware, roleMiddleware('Administrador'), horariosController.toggleDiaEstado);

// Eliminar horario (solo Administrador)
router.delete('/:id', authMiddleware, roleMiddleware('Administrador'), horariosController.eliminarHorario);

module.exports = router;
