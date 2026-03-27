import { useEffect, useMemo, useState } from 'react';
import { apiFetch, apiUrl } from '../lib/api.js';
import { getReportTypeLabel, reportTypeOptions } from '../lib/reportLabels.js';
import { StatusBadge } from './StatusBadge.jsx';

const emptyFilters = {
  tipo: '',
  status: '',
  data: ''
};

const nextStatusMap = {
  novo: 'em analise',
  'em analise': 'concluido',
  concluido: 'concluido'
};

const filterFieldClassName =
  'h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 text-sm text-slate-700 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100';

const observationsTextareaClassName =
  'min-h-[132px] w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-700 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100';

const sectionLabelClassName = 'text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-brand-700';
const fieldLabelClassName = 'text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-slate-700';
const rowActionClassName =
  'inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200/90 bg-white/80 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-900';

const formatDate = (value) => new Date(value).toLocaleDateString('pt-BR');
const formatTime = (value) =>
  new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

export function AdminDashboard({ token, onLogout }) {
  const [filters, setFilters] = useState(emptyFilters);
  const [reports, setReports] = useState([]);
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [observationsDrafts, setObservationsDrafts] = useState({});
  const [observationFeedback, setObservationFeedback] = useState({});
  const [savingObservations, setSavingObservations] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const authHeaders = {
    Authorization: `Bearer ${token}`
  };

  const handleSessionError = (message) => {
    setError(message);

    if (message.toLowerCase().includes('sess')) {
      localStorage.removeItem('admin-token');
      onLogout();
    }
  };

  const loadReports = async (activeFilters = filters) => {
    setIsLoading(true);
    setError('');

    const params = new URLSearchParams();
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    try {
      const response = await apiFetch(`/api/admin/reports?${params.toString()}`, {
        headers: authHeaders
      });

      setReports(response);
      setObservationsDrafts(Object.fromEntries(response.map((report) => [report.id, report.observacoes || ''])));
      setObservationFeedback({});
      setExpandedReportId((current) => (response.some((report) => report.id === current) ? current : null));
    } catch (loadError) {
      handleSessionError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const summary = useMemo(
    () =>
      reports.reduce(
        (totals, report) => {
          totals.total += 1;
          totals[report.status] += 1;
          return totals;
        },
        { total: 0, novo: 0, 'em analise': 0, concluido: 0 }
      ),
    [reports]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();
    loadReports(filters);
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
    loadReports(emptyFilters);
  };

  const toggleExpandedReport = (reportId) => {
    setExpandedReportId((current) => (current === reportId ? null : reportId));
  };

  const handleObservationChange = (reportId, value) => {
    setObservationsDrafts((current) => ({
      ...current,
      [reportId]: value
    }));

    setObservationFeedback((current) => ({
      ...current,
      [reportId]: null
    }));
  };

  const saveObservations = async (reportId) => {
    setSavingObservations((current) => ({ ...current, [reportId]: true }));
    setObservationFeedback((current) => ({
      ...current,
      [reportId]: null
    }));

    try {
      const response = await apiFetch(`/api/admin/reports/${reportId}/observacoes`, {
        method: 'PATCH',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          observacoes: observationsDrafts[reportId] || ''
        })
      });

      setReports((current) =>
        current.map((report) =>
          report.id === reportId
            ? {
                ...report,
                observacoes: response.observacoes
              }
            : report
        )
      );

      setObservationsDrafts((current) => ({
        ...current,
        [reportId]: response.observacoes || ''
      }));

      setObservationFeedback((current) => ({
        ...current,
        [reportId]: {
          type: 'success',
          message: response.message
        }
      }));
    } catch (saveError) {
      if (saveError.message.toLowerCase().includes('sess')) {
        handleSessionError(saveError.message);
        return;
      }

      setObservationFeedback((current) => ({
        ...current,
        [reportId]: {
          type: 'error',
          message: saveError.message
        }
      }));
    } finally {
      setSavingObservations((current) => ({ ...current, [reportId]: false }));
    }
  };

  const advanceStatus = async (report) => {
    const nextStatus = nextStatusMap[report.status];

    if (nextStatus === report.status) {
      return;
    }

    setUpdatingStatus((current) => ({ ...current, [report.id]: true }));
    setError('');

    try {
      await apiFetch(`/api/admin/reports/${report.id}/status`, {
        method: 'PATCH',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: nextStatus })
      });

      setReports((current) =>
        current.map((currentReport) =>
          currentReport.id === report.id
            ? {
                ...currentReport,
                status: nextStatus
              }
            : currentReport
        )
      );
    } catch (updateError) {
      handleSessionError(updateError.message);
    } finally {
      setUpdatingStatus((current) => ({ ...current, [report.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/70 bg-white/92 p-8 text-slate-900 shadow-panel backdrop-blur-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className={sectionLabelClassName}>Gestão dos relatos</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-[0.04em] text-slate-800">Acompanhamento administrativo</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Visualize mais relatos por tela, filtre rapidamente e abra detalhes apenas quando precisar aprofundar a análise.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('admin-token');
              onLogout();
            }}
            className="inline-flex items-center justify-center rounded-full border border-slate-200/90 bg-white/80 px-5 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-800"
          >
            Sair do painel
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/95 p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
            <p className={fieldLabelClassName}>Total</p>
            <p className="mt-3 text-3xl font-semibold text-slate-800">{summary.total}</p>
            <p className="mt-2 text-sm text-slate-600">Relatos listados com os filtros atuais.</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/95 p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-400" />
              <p className={fieldLabelClassName}>Novos</p>
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-800">{summary.novo}</p>
            <p className="mt-2 text-sm text-slate-600">Relatos que aguardam triagem.</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/95 p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-accent-400" />
              <p className={fieldLabelClassName}>Em análise</p>
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-800">{summary['em analise']}</p>
            <p className="mt-2 text-sm text-slate-600">Casos ativos no fluxo interno.</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/95 p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <p className={fieldLabelClassName}>Concluídos</p>
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-800">{summary.concluido}</p>
            <p className="mt-2 text-sm text-slate-600">Relatos finalizados no painel.</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleApplyFilters}
        className="rounded-[2rem] border border-white/70 bg-white/92 p-6 text-slate-900 shadow-panel backdrop-blur-md"
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <label className="flex flex-col gap-2">
            <span className={fieldLabelClassName}>Tipo de relato</span>
            <select name="tipo" value={filters.tipo} onChange={handleFilterChange} className={filterFieldClassName}>
              <option value="">Todos os tipos</option>
              {reportTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className={fieldLabelClassName}>Status</span>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className={filterFieldClassName}
            >
              <option value="">Todos os status</option>
              <option value="novo">Novo</option>
              <option value="em analise">Em análise</option>
              <option value="concluido">Concluído</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className={fieldLabelClassName}>Data do envio</span>
            <input type="date" name="data" value={filters.data} onChange={handleFilterChange} className={filterFieldClassName} />
          </label>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center self-end rounded-2xl bg-brand-500 px-6 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(59,160,76,0.22)] transition hover:bg-brand-700"
          >
            Filtrar relatos
          </button>

          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex h-12 items-center justify-center self-end rounded-2xl border border-slate-200/90 bg-white/80 px-6 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-800"
          >
            Limpar filtros
          </button>
        </div>
      </form>

      {error ? (
        <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      {isLoading ? (
        <div className="rounded-[2rem] border border-white/70 bg-white/92 px-6 py-14 text-center text-sm text-slate-500 shadow-panel backdrop-blur-md">
          Carregando relatos...
        </div>
      ) : null}

      {!isLoading && reports.length === 0 ? (
        <div className="rounded-[2rem] border border-white/70 bg-white/92 px-6 py-14 text-center text-sm text-slate-500 shadow-panel backdrop-blur-md">
          Nenhum relato encontrado com os filtros selecionados.
        </div>
      ) : null}

      {!isLoading && reports.length > 0 ? (
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/92 shadow-panel backdrop-blur-md">
          <div className="hidden gap-4 border-b border-slate-200/80 bg-slate-50/90 px-6 py-4 lg:grid lg:grid-cols-[1.1fr_2.4fr_1.15fr_auto_1fr_auto]">
            <p className={fieldLabelClassName}>Tipo de relato</p>
            <p className={fieldLabelClassName}>Resumo da descrição</p>
            <p className={fieldLabelClassName}>Área ou Setor</p>
            <p className={fieldLabelClassName}>Status</p>
            <p className={fieldLabelClassName}>Data</p>
            <p className={fieldLabelClassName}>Ações</p>
          </div>

          <div className="divide-y divide-slate-200/80">
            {reports.map((report) => {
              const nextStatus = nextStatusMap[report.status];
              const isExpanded = expandedReportId === report.id;
              const isObservationDirty = (observationsDrafts[report.id] || '') !== (report.observacoes || '');
              const feedback = observationFeedback[report.id];

              return (
                <article key={report.id} className="bg-white/40">
                  <div className="grid gap-4 px-6 py-5 lg:grid-cols-[1.1fr_2.4fr_1.15fr_auto_1fr_auto] lg:items-center">
                    <div className="min-w-0">
                      <p className={fieldLabelClassName}>Relato #{report.id}</p>
                      <p className="mt-2 truncate font-display text-lg font-bold tracking-[0.03em] text-slate-800">
                        {getReportTypeLabel(report.tipo)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm leading-7 text-slate-700 [display:-webkit-box] overflow-hidden [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                        {report.descricao}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700">{report.area || 'Não informada'}</p>
                    </div>

                    <div className="lg:justify-self-start">
                      <StatusBadge status={report.status} />
                    </div>

                    <div className="text-sm text-slate-600">
                      <p>{formatDate(report.dataEnvio)}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatTime(report.dataEnvio)}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => toggleExpandedReport(report.id)}
                        className={rowActionClassName}
                      >
                        {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                      </button>

                      <button
                        type="button"
                        onClick={() => advanceStatus(report)}
                        disabled={report.status === 'concluido' || updatingStatus[report.id]}
                        className="inline-flex h-10 items-center justify-center rounded-2xl bg-brand-500 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-[0_14px_30px_rgba(59,160,76,0.18)] transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {updatingStatus[report.id]
                          ? 'Atualizando'
                          : report.status === 'novo'
                            ? 'Iniciar análise'
                            : report.status === 'em analise'
                              ? 'Concluir relato'
                              : 'Concluído'}
                      </button>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="border-t border-slate-200/80 bg-slate-50/70 px-6 py-6">
                      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
                        <div className="space-y-6">
                          <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-5">
                            <p className={fieldLabelClassName}>Descrição completa</p>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{report.descricao}</p>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-5">
                              <p className={fieldLabelClassName}>Envio</p>
                              {report.anonimo ? (
                                <p className="mt-3 text-sm leading-7 text-slate-700">Relato enviado de forma anônima.</p>
                              ) : (
                                <div className="mt-3 space-y-1 text-sm leading-7 text-slate-700">
                                  <p className="font-medium text-slate-800">{report.nome}</p>
                                  <p>{report.email}</p>
                                </div>
                              )}
                            </div>

                            <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-5">
                              <p className={fieldLabelClassName}>Anexos</p>
                              <div className="mt-4 flex flex-wrap gap-3">
                                {report.anexos?.length ? (
                                  report.anexos.map((attachment) => (
                                    <a
                                      key={`${report.id}-${attachment.caminho}`}
                                      href={`${apiUrl}/uploads/${attachment.caminho}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
                                    >
                                      Abrir anexo: {attachment.nome}
                                    </a>
                                  ))
                                ) : (
                                  <p className="text-sm text-slate-500">Nenhum anexo enviado.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-5">
                            <p className={sectionLabelClassName}>Observações internas</p>
                            <p className="mt-2 text-sm leading-7 text-slate-600">
                              Campo exclusivo do painel administrativo. Não é exibido para o colaborador.
                            </p>

                            <textarea
                              value={observationsDrafts[report.id] || ''}
                              onChange={(event) => handleObservationChange(report.id, event.target.value)}
                              placeholder="Registre informações internas relevantes para o acompanhamento deste relato."
                              className={`mt-4 ${observationsTextareaClassName}`}
                            />

                            {feedback ? (
                              <p
                                className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
                                  feedback.type === 'success'
                                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                    : 'border-rose-100 bg-rose-50 text-rose-700'
                                }`}
                              >
                                {feedback.message}
                              </p>
                            ) : null}

                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-xs text-slate-500">
                                {isObservationDirty ? 'Há alterações pendentes para salvar.' : 'Observações internas atualizadas.'}
                              </p>

                              <button
                                type="button"
                                onClick={() => saveObservations(report.id)}
                                disabled={savingObservations[report.id] || !isObservationDirty}
                                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-white/80 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {savingObservations[report.id] ? 'Salvando...' : 'Salvar observações'}
                              </button>
                            </div>
                          </div>

                          <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-5">
                            <p className={fieldLabelClassName}>Próximo passo</p>
                            <p className="mt-3 text-sm leading-7 text-slate-600">
                              {nextStatus !== report.status
                                ? `Próximo status disponível: ${nextStatus === 'em analise' ? 'Em análise' : 'Concluído'}.`
                                : 'Este relato já foi concluído.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
