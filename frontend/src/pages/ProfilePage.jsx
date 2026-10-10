import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import AddressFields from '../components/AddressFields';

export default function ProfilePage() {
  const { user } = useAuth();
  const [radius, setRadius] = useState(10);
  const [locStatus, setLocStatus] = useState({ loading: false, msg: '', error: '' });
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ msg: '', error: '' });

  useEffect(() => {
    client.get('/users/me/')
      .then(({ data }) => setProfile(data))
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  function setAddressField(field, value) {
    setProfile((p) => ({ ...p, [field]: value }));
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ msg: '', error: '' });
    try {
      const { data } = await client.patch('/users/me/', {
        cpf: profile.cpf || '',
        cep: profile.cep || '',
        logradouro: profile.logradouro || '',
        numero: profile.numero || '',
        complemento: profile.complemento || '',
        bairro: profile.bairro || '',
        cidade: profile.cidade || '',
        estado: profile.estado || '',
      });
      setProfile(data);
      setProfileMsg({ msg: 'Dados salvos com sucesso!', error: '' });
    } catch (err) {
      const d = err.response?.data;
      if (d && typeof d === 'object') {
        setProfileMsg({ msg: '', error: Object.values(d).flat().join(' ') });
      } else {
        setProfileMsg({ msg: '', error: 'Falha ao salvar dados.' });
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleLocationUpdate(e) {
    e.preventDefault();
    setLocStatus({ loading: true, msg: '', error: '' });

    if (!navigator.geolocation) {
      return setLocStatus({ loading: false, msg: '', error: 'Geolocalização não suportada' });
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const payload = {
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6),
            radius,
          };
          await client.patch('/users/location/', payload);
          setLocStatus({ loading: false, msg: 'Localização atualizada com sucesso!', error: '' });
        } catch {
          setLocStatus({ loading: false, msg: '', error: 'Falha ao atualizar localização.' });
        }
      },
      () => setLocStatus({ loading: false, msg: '', error: 'Permissão de localização negada.' })
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary-500/30">
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user?.username}</h1>
          <p className="text-gray-500 dark:text-gray-400 capitalize flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${user?.role === 'provider' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
            {user?.role === 'provider' ? 'Prestador' : 'Cliente'}
          </p>
        </div>
      </div>

      {/* Quick Stats for Provider */}
      {user?.role === 'provider' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/dashboard"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Painel</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ver estatísticas</p>
          </Link>

          <Link
            to="/provider-bookings"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Reservas</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gerenciar pedidos</p>
          </Link>

          <Link
            to="/my-services"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Serviços</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Editar anúncios</p>
          </Link>

          <Link
            to="/my-services/new"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Adicionar</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Criar serviço</p>
          </Link>
        </div>
      )}

      {/* Account Info Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Dados da Conta</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Usuário</p>
                <p className="font-semibold text-gray-900 dark:text-white">{user?.username}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">E-mail</p>
                <p className="font-semibold text-gray-900 dark:text-white">{user?.email || 'Não definido'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tipo de Conta</p>
                <p className="font-semibold text-gray-900 dark:text-white">{user?.role === 'provider' ? 'Prestador' : 'Cliente'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Data + Address (CPF e Endereço) */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">CPF e Endereço</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Informe seu CPF e endereço (busca por CEP disponível)
          </p>
        </div>
        <div className="p-6">
          {profileLoading ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Carregando dados...</p>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {profileMsg.msg && (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl px-4 py-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">{profileMsg.msg}</span>
                </div>
              )}
              {profileMsg.error && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">{profileMsg.error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">CPF</label>
                <input
                  name="cpf"
                  value={profile?.cpf || ''}
                  onChange={(e) => setAddressField('cpf', e.target.value)}
                  maxLength={14}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  placeholder="000.000.000-00"
                />
              </div>

              <AddressFields values={profile || {}} onChange={setAddressField} />

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-primary-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingProfile ? 'Salvando...' : 'Salvar Dados'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Location Settings (Provider Only) */}
      {user?.role === 'provider' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Área de Atendimento</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Defina sua localização para aparecer em buscas próximas
            </p>
          </div>
          <div className="p-6">
            {locStatus.msg && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl px-4 py-3 mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">{locStatus.msg}</span>
              </div>
            )}
            {locStatus.error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">{locStatus.error}</span>
              </div>
            )}

            <form onSubmit={handleLocationUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Raio de Atendimento
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="w-20 text-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{radius}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">km</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Você aparecerá em buscas dentro deste raio
                </p>
              </div>

              <button
                type="submit"
                disabled={locStatus.loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-primary-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {locStatus.loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Detectando Localização...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Atualizar Localização (Automático)
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
