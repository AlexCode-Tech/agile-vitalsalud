const express = require('express');
const router = express.Router();
const especialidadesController = require('../controllers/especialidadesController');

// HU-07: Catálogo público de especialidades (no requiere autenticación)
router.get('/', especialidadesController.listarEspecialidades);

module.exports = router;
