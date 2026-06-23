const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// HU-12: Panel de gráficos estadísticos (solo Administrador)
router.get('/estadisticas', authMiddleware, roleMiddleware('Administrador'), adminController.obtenerEstadisticas);

// Obtener todos los usuarios del sistema (solo Administrador)
router.get('/usuarios', authMiddleware, roleMiddleware('Administrador'), adminController.listarUsuarios);

// Actualizar el rol de un usuario (solo Administrador)
router.patch('/usuarios/:id/rol', authMiddleware, roleMiddleware('Administrador'), adminController.actualizarRolUsuario);

// Editar datos de un usuario (correo, verificado) - solo Administrador
router.patch('/usuarios/:id', authMiddleware, roleMiddleware('Administrador'), adminController.editarUsuario);

// Eliminar un usuario completamente - solo Administrador
router.delete('/usuarios/:id', authMiddleware, roleMiddleware('Administrador'), adminController.eliminarUsuario);

module.exports = router;
