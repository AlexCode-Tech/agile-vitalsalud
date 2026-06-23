import apiClient from './apiClient';

export const obtenerHorarios = async () => {
  const response = await apiClient.get('/horarios');
  return response.data;
};

export const guardarHorario = async (datos) => {
  const response = await apiClient.post('/horarios', datos);
  return response.data;
};

export const eliminarHorario = async (id) => {
  const response = await apiClient.delete(`/horarios/${id}`);
  return response.data;
};

export const toggleDiaEstadoHorario = async (id, dia) => {
  const response = await apiClient.patch(`/horarios/${id}/dia-estado`, { dia });
  return response.data;
};
