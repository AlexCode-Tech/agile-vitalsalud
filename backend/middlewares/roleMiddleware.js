/**
 * Middleware para restringir accesos por rol del usuario.
 * (Regla de Negocio RN-11)
 * @param {...string} rolesPermitidos
 */
function roleMiddleware(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return res.status(401).json({ mensaje: 'No autenticado.' });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ mensaje: 'Acceso denegado. Permisos insuficientes.' });
    }

    next();
  };
}

module.exports = roleMiddleware;
