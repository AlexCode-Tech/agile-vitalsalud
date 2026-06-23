/**
 * Valida si un DNI peruano consiste exactamente de 8 dígitos numéricos.
 * (Regla de Negocio RN-01)
 * @param {string} dni
 * @returns {boolean}
 */
export default function validarDNI(dni) {
  if (typeof dni !== 'string') return false;
  return /^\d{8}$/.test(dni);
}
