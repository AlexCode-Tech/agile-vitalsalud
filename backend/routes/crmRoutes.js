const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crmController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Solo Administrador y Recepcionista manejan el CRM
router.use(authMiddleware, roleMiddleware('Administrador', 'Recepcionista'));

// HU-13: Agregar cliente CRM
router.post('/clientes', crmController.agregarCliente);

// HU-14: Listar clientes CRM
router.get('/clientes', crmController.listarClientes);

// HU-14: Ver detalle cliente CRM
router.get('/clientes/:id', crmController.verDetalleCliente);

module.exports = router;
