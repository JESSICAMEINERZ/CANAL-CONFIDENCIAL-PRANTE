import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminDashboard } from '../components/AdminDashboard.jsx';
import { AdminLogin } from '../components/AdminLogin.jsx';

export function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem('admin-token'));

  return (
    <main className="home-shell relative min-h-screen overflow-hidden text-slate-800">
      <section className="relative z-10 overflow-hidden px-6 pb-20 pt-6 md:px-10 lg:px-16">
        <div className="pointer-events-none absolute left-[-5rem] top-[-3rem] h-72 w-72 rounded-full bg-brand-100/70 blur-3xl md:left-[-2rem] md:top-[-2rem]" />
        <div className="pointer-events-none absolute right-[-4rem] top-2 h-64 w-64 rounded-full bg-accent-100/55 blur-3xl md:right-[-2rem] md:top-10" />
        <div className="pointer-events-none absolute bottom-10 right-[18%] h-40 w-40 rounded-full bg-brand-100/40 blur-3xl" />

        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex justify-end md:mb-10">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-200/90 bg-white/70 px-4 py-2 text-xs font-medium text-slate-500 backdrop-blur transition hover:border-slate-300 hover:bg-white/90 hover:text-slate-700"
            >
              Voltar ao canal
            </Link>
          </div>

          <div className="space-y-8">
            <div className="max-w-5xl space-y-4">
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.28em] text-brand-700">Ambiente administrativo</p>
              <h1 className="max-w-5xl font-display text-3xl font-bold uppercase leading-[1.02] tracking-[0.1em] text-slate-800 md:text-5xl md:tracking-[0.12em]">
                PAINEL ADMINISTRATIVO <span className="font-semibold text-slate-700">GRUPO </span>
                <span className="font-black italic tracking-[0.08em] text-brand-700">PRANTE</span>
              </h1>
              <p className="max-w-[56rem] text-lg leading-8 text-slate-600 md:text-justify">
                Consulte os relatos, acompanhe o andamento de cada caso e registre observações internas com leitura
                rápida, organização clara e foco na operação.
              </p>
            </div>

            <div className="relative z-10">
              {token ? (
                <AdminDashboard token={token} onLogout={() => setToken('')} />
              ) : (
                <div className="mx-auto max-w-xl">
                  <AdminLogin onAuthenticated={setToken} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
