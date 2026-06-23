import apiClient from './apiClient';

export const obtenerPacientesDia = async (fecha) => {
  const response = await apiClient.get(`/recepcion/pacientes?fecha=${fecha}`);
  return response.data;
};
