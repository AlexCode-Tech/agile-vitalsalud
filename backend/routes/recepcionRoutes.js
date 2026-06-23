const express = require('express');
const router = express.Router();
const recepcionController = require('../controllers/recepcionController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// HU-10: Listar clientes del día (Recepcionista o Administrador)
router.get('/pacientes', authMiddleware, roleMiddleware('Recepcionista', 'Administrador'), recepcionController.listarPacientesDia);

module.exports = router;
