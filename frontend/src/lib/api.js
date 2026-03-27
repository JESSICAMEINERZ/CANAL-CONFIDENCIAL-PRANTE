const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const apiUrl = API_URL;

export const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, options);
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.message || 'Não foi possível concluir a comunicação com o servidor.');
  }

  return payload;
};
