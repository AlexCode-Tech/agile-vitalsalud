import apiClient from './apiClient';

export const agregarClienteCRM = async (data) => {
  const response = await apiClient.post('/crm/clientes', data);
  return response.data;
};

export const obtenerClientesCRM = async () => {
  const response = await apiClient.get('/crm/clientes');
  return response.data;
};

export const obtenerDetalleCRM = async (id) => {
  const response = await apiClient.get(`/crm/clientes/${id}`);
  return response.data;
};
