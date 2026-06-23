import apiClient from './apiClient';

export const registrarPaciente = async (data) => {
  const response = await apiClient.post('/pacientes', data);
  return response.data;
};

export const login = async (correo, password) => {
  const response = await apiClient.post('/pacientes/login', { correo, password });
  return response.data;
};

export const actualizarPerfil = async (id, data) => {
  const response = await apiClient.patch(`/pacientes/${id}`, data);
  return response.data;
};

export const verificarCodigo = async (correo, codigo) => {
  const response = await apiClient.post('/pacientes/verify-code', { correo, codigo });
  return response.data;
};

export const consultarReniec = async (dni) => {
  const response = await apiClient.get(`/pacientes/reniec/${dni}`);
  return response.data;
};
