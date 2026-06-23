export const ROLE_DASHBOARD_ROUTES = {
  Paciente: '/dashboard/paciente',
  Medico: '/dashboard/medico',
  Recepcionista: '/dashboard/recepcion',
  Administrador: '/dashboard/admin',
};

export const ROLE_RESERVATION_SCOPE = {
  Paciente: 'Reserva, paga y consulta sus citas.',
  Medico: 'Consulta su agenda de citas confirmadas y atendidas.',
  Recepcionista: 'Gestiona citas del dia, consultas por DNI y atencion operativa.',
  Administrador: 'Administra usuarios, medicos, horarios y reglas del proceso de reservas.',
};

export function getDashboardRouteByRole(role) {
  return ROLE_DASHBOARD_ROUTES[role] || '/login';
}

export function getAuthenticatedDefaultRoute(user) {
  return getDashboardRouteByRole(user?.rol);
}
