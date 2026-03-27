import { Link } from 'react-router-dom';
import { ReportForm } from '../components/ReportForm.jsx';

const highlightCards = [
  {
    title: 'Confidencialidade',
    description: 'Você decide se deseja se identificar ou fazer um envio anônimo.',
    accentClassName: 'bg-brand-400'
  },
  {
    title: 'Confiança',
    description: 'Um canal claro e acolhedor para registrar relatos com segurança e seriedade.',
    accentClassName: 'bg-brand-500'
  },
  {
    title: 'Encaminhamento',
    description:
      'As notificações são enviadas automaticamente por e-mail para a equipe responsável, garantindo agilidade no encaminhamento.',
    accentClassName: 'bg-accent-400'
  }
];

const supportCards = [
  {
    title: 'Confidencialidade',
    description: 'A identidade do colaborador é preservada quando o envio anônimo é selecionado.',
    accentClassName: 'bg-brand-400'
  },
  {
    title: 'Confiança',
    description: 'Cada relato é recebido com seriedade, respeito e atenção no ambiente corporativo.',
    accentClassName: 'bg-brand-500'
  },
  {
    title: 'Encaminhamento',
    description: 'Os relatos são organizados para apoiar a análise e o encaminhamento interno.',
    accentClassName: 'bg-accent-400'
  }
];

export function HomePage() {
  return (
    <main className="home-shell relative min-h-screen overflow-hidden text-slate-800">
      <section className="relative z-10 overflow-hidden px-6 pb-16 pt-6 md:px-10 lg:px-16">
        <div className="pointer-events-none absolute left-[-5rem] top-[-3rem] h-72 w-72 rounded-full bg-brand-100/70 blur-3xl md:left-[-2rem] md:top-[-2rem]" />
        <div className="pointer-events-none absolute right-[-4rem] top-2 h-64 w-64 rounded-full bg-accent-100/55 blur-3xl md:right-[-2rem] md:top-10" />
        <div className="pointer-events-none absolute bottom-10 right-[18%] h-40 w-40 rounded-full bg-brand-100/40 blur-3xl" />

        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex justify-end md:mb-10">
            <Link
              to="/admin"
              className="inline-flex items-center justify-center rounded-full border border-slate-200/90 bg-white/70 px-4 py-2 text-xs font-medium text-slate-500 backdrop-blur transition hover:border-slate-300 hover:bg-white/90 hover:text-slate-700"
            >
              Acesso administrativo
            </Link>
          </div>

          <div className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.05fr] xl:gap-14">
            <div className="order-2 space-y-5 lg:order-1 lg:pt-[7.2rem] xl:pt-[7.75rem]">
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {highlightCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-[1.75rem] border border-white/70 bg-white/88 p-5 shadow-panel backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${card.accentClassName}`} />
                      <p className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-slate-700">{card.title}</p>
                    </div>
                    <p className="mt-3 max-w-[18rem] text-sm leading-7 text-slate-600">{card.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 space-y-6 lg:order-2">
              <div className="space-y-3 lg:px-8">
                <h1 className="max-w-5xl font-display text-3xl font-bold uppercase leading-[1.02] tracking-[0.1em] text-slate-800 md:text-5xl md:tracking-[0.12em]">
                  CANAL CONFIDENCIAL <span className="font-semibold text-slate-700">GRUPO </span>
                  <span className="font-black italic tracking-[0.08em] text-brand-700">PRANTE</span>
                </h1>
                <p className="max-w-[39rem] text-lg leading-8 text-slate-600 md:max-w-[40rem] md:text-justify">
                  Um espaço seguro para compartilhar ideias, sugestões, reclamações e denúncias, com respeito e
                  confidencialidade. Você pode se identificar ou permanecer anônimo.
                </p>
              </div>

              <div id="formulario" className="relative z-10">
                <ReportForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 pb-20 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-6 rounded-[2rem] border border-white/70 bg-white/88 p-8 shadow-panel backdrop-blur-md md:grid-cols-3">
          {supportCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/95 p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${card.accentClassName}`} />
                <p className="text-[0.78rem] font-semibold uppercase tracking-[0.22em] text-slate-700">{card.title}</p>
              </div>
              <p className="mt-3 max-w-[18rem] text-sm leading-7 text-slate-600">{card.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
