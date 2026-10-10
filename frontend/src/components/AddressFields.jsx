import { useState, useEffect } from 'react';
import { brasilApi } from '../api/brasil';

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow';
const labelClass =
  'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2';

export default function AddressFields({ values, onChange }) {
  const [estados, setEstados] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');

  useEffect(() => {
    brasilApi.estados().then(setEstados).catch(() => {});
  }, []);

  useEffect(() => {
    if (values.estado) {
      brasilApi
        .municipios(values.estado)
        .then(setMunicipios)
        .catch(() => setMunicipios([]));
    } else {
      setMunicipios([]);
    }
  }, [values.estado]);

  async function handleCepLookup() {
    const cep = (values.cep || '').replace(/\D/g, '');
    if (cep.length !== 8) {
      setCepError('CEP inválido');
      return;
    }
    setCepLoading(true);
    setCepError('');
    try {
      const data = await brasilApi.cep(cep);
      onChange('logradouro', data.logradouro || '');
      onChange('bairro', data.bairro || '');
      onChange('cidade', data.cidade || '');
      onChange('estado', data.estado || '');
    } catch (err) {
      setCepError(err.response?.data?.erro || 'CEP não encontrado');
    } finally {
      setCepLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h3 className="text-base font-bold">Endereço</h3>
      </div>

      {cepError && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-2.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">{cepError}</span>
        </div>
      )}

      {/* CEP + lookup button */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelClass}>CEP</label>
          <input
            name="cep"
            value={values.cep || ''}
            onChange={(e) => onChange('cep', e.target.value)}
            placeholder="00000-000"
            maxLength={9}
            className={inputClass}
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleCepLookup}
            disabled={cepLoading}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {cepLoading ? 'Buscando…' : 'Buscar CEP'}
          </button>
        </div>
      </div>

      {/* Logradouro + Número */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Logradouro</label>
          <input
            name="logradouro"
            value={values.logradouro || ''}
            onChange={(e) => onChange('logradouro', e.target.value)}
            placeholder="Rua, avenida..."
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Número</label>
          <input
            name="numero"
            value={values.numero || ''}
            onChange={(e) => onChange('numero', e.target.value)}
            placeholder="Nº"
            className={inputClass}
          />
        </div>
      </div>

      {/* Complemento */}
      <div>
        <label className={labelClass}>Complemento</label>
        <input
          name="complemento"
          value={values.complemento || ''}
          onChange={(e) => onChange('complemento', e.target.value)}
          placeholder="Apto, bloco, sala..."
          className={inputClass}
        />
      </div>

      {/* Bairro */}
      <div>
        <label className={labelClass}>Bairro</label>
        <input
          name="bairro"
          value={values.bairro || ''}
          onChange={(e) => onChange('bairro', e.target.value)}
          placeholder="Bairro"
          className={inputClass}
        />
      </div>

      {/* Estado + Cidade */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Estado (UF)</label>
          <select
            name="estado"
            value={values.estado || ''}
            onChange={(e) => onChange('estado', e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione</option>
            {estados.map((uf) => (
              <option key={uf.sigla} value={uf.sigla}>
                {uf.sigla} — {uf.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Cidade</label>
          <select
            name="cidade"
            value={values.cidade || ''}
            onChange={(e) => onChange('cidade', e.target.value)}
            disabled={!municipios.length}
            className={inputClass}
          >
            <option value="">Selecione</option>
            {municipios.map((m) => (
              <option key={m.nome} value={m.nome}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
