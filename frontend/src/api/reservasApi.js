import apiClient from './apiClient';

export const crearReserva = async (data) => {
  const response = await apiClient.post('/reservas', data);
  return response.data;
};

export const buscarReservasPorDNI = async (dni) => {
  const response = await apiClient.get(`/reservas?dni=${dni}`);
  return response.data;
};

export const cancelarReserva = async (id) => {
  const response = await apiClient.patch(`/reservas/${id}/cancelar`);
  return response.data;
};

export const marcarAtendida = async (id) => {
  const response = await apiClient.patch(`/reservas/${id}/atender`);
  return response.data;
};

export const obtenerMisCitas = async () => {
  const response = await apiClient.get('/reservas/mis-citas');
  return response.data;
};

export const procesarPago = async (id, data) => {
  const response = await apiClient.patch(`/reservas/${id}/pagar`, data);
  return response.data;
};

export const crearPreferenciaMercadoPago = async (id) => {
  const response = await apiClient.post(`/reservas/${id}/mercado-pago/preferencia`);
  return response.data;
};

export const confirmarPagoMercadoPago = async (id, data) => {
  const response = await apiClient.post(`/reservas/${id}/mercado-pago/confirmar`, data);
  return response.data;
};

export const obtenerCitasMedico = async () => {
  const response = await apiClient.get('/reservas/medico');
  return response.data;
};

export const obtenerHorasOcupadas = async ({ idMedico, fecha }) => {
  const response = await apiClient.get(`/reservas/ocupadas?id_medico=${idMedico}&fecha=${fecha}`);
  return response.data;
};
