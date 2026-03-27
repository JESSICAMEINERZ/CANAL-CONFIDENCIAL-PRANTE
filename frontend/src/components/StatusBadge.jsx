import { getReportStatusLabel } from '../lib/reportLabels.js';

const classes = {
  novo: 'bg-brand-50 text-brand-700',
  'em analise': 'bg-accent-50 text-accent-600',
  concluido: 'bg-emerald-50 text-emerald-700'
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classes[status] || 'bg-slate-100 text-slate-700'}`}>
      {getReportStatusLabel(status)}
    </span>
  );
}
