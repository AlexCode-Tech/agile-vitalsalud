const express = require('express');
const router = express.Router();
const pacientesController = require('../controllers/pacientesController');
const authMiddleware = require('../middlewares/authMiddleware');

// HU-01: Registro de pacientes
router.post('/', pacientesController.registrarPaciente);
router.post('/verify-code', pacientesController.verificarCodigo);

// Login de usuarios (pacientes y personal)
router.post('/login', pacientesController.login);

// HU-09: Actualizar datos de perfil (requiere autenticación)
router.patch('/:id', authMiddleware, pacientesController.actualizarPerfil);

// Consulta externa RENIEC
router.get('/reniec/:dni', pacientesController.consultarReniec);

module.exports = router;
