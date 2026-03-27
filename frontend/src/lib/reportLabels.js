export const reportTypeOptions = [
  { value: 'Ideia', label: 'Ideia' },
  { value: 'Sugestao', label: 'Sugestão' },
  { value: 'Reclamacao', label: 'Reclamação' },
  { value: 'Denuncia', label: 'Denúncia' }
];

export const reportTypeLabels = reportTypeOptions.reduce((accumulator, option) => {
  accumulator[option.value] = option.label;
  return accumulator;
}, {});

export const reportStatusLabels = {
  novo: 'Novo',
  'em analise': 'Em análise',
  concluido: 'Concluído'
};

export const getReportTypeLabel = (value) => reportTypeLabels[value] || value;

export const getReportStatusLabel = (value) => reportStatusLabels[value] || value;

