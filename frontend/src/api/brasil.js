import client from './client';

export const brasilApi = {
  estados: () => client.get('/brasil/estados/').then(r => r.data),
  municipios: (uf) => client.get(`/brasil/estados/${uf}/municipios/`).then(r => r.data),
  cep: (cep) => client.get(`/brasil/cep/${cep}/`).then(r => r.data),
  validarDocumento: (documento, tipo) =>
    client.post('/brasil/validar-documento/', { documento, tipo }).then(r => r.data),
};
