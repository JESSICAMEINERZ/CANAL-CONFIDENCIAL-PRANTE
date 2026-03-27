import { useState } from 'react';
import { apiFetch } from '../lib/api.js';

const sectionLabelClassName = 'text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-brand-700';
const fieldLabelClassName = 'text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-slate-700';
const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-700 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100';

export function AdminLogin({ onAuthenticated }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setCredentials((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      localStorage.setItem('admin-token', response.token);
      onAuthenticated(response.token);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/92 p-8 text-slate-900 shadow-panel backdrop-blur-md">
      <div className="space-y-2">
        <p className={sectionLabelClassName}>Acesso restrito</p>
        <h2 className="font-display text-3xl font-bold tracking-[0.04em] text-slate-800">Entrar no painel</h2>
        <p className="max-w-[34rem] text-sm leading-7 text-slate-600">
          Informe seu usuário e sua senha para consultar os relatos e registrar observações internas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <label className="flex flex-col gap-2">
          <span className={fieldLabelClassName}>Usuário</span>
          <input
            required
            type="text"
            name="username"
            value={credentials.username}
            onChange={updateField}
            className={inputClassName}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className={fieldLabelClassName}>Senha</span>
          <input
            required
            type="password"
            name="password"
            value={credentials.password}
            onChange={updateField}
            className={inputClassName}
          />
        </label>

        {error ? <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-500 px-6 py-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(59,160,76,0.22)] transition hover:bg-brand-700 disabled:opacity-70"
        >
          {isLoading ? 'Entrando...' : 'Entrar no painel'}
        </button>
      </form>
    </div>
  );
}
