import apiClient from './apiClient';

export const obtenerEspecialidades = async () => {
  const response = await apiClient.get('/especialidades');
  return response.data;
};
