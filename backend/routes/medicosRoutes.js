const express = require('express');
const router = express.Router();
const medicosController = require('../controllers/medicosController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// HU-02: Registrar médicos (solo Administrador)
router.post(
  '/',
  authMiddleware,
  roleMiddleware('Administrador'),
  upload.single('foto'),
  medicosController.registrarMedico
);

// Catálogo público de médicos
router.get('/', medicosController.listarMedicosActivos);

// Listar todos los médicos (solo Administrador)
router.get(
  '/todos',
  authMiddleware,
  roleMiddleware('Administrador'),
  medicosController.listarTodosMedicos
);

// Toggle ausencia del médico (Activo ↔ Ausente)
router.patch(
  '/:id/ausencia',
  authMiddleware,
  roleMiddleware('Administrador'),
  medicosController.toggleAusencia
);

// Actualizar médico (solo Administrador)
router.patch(
  '/:id',
  authMiddleware,
  roleMiddleware('Administrador'),
  upload.single('foto'),
  medicosController.actualizarMedico
);

// Eliminar médico (solo Administrador)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('Administrador'),
  medicosController.eliminarMedico
);

module.exports = router;
