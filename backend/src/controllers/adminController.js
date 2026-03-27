import {
  findReportById,
  listReports,
  reportStatuses,
  reportTypes,
  updateReportObservations,
  updateReportStatus
} from '../services/reportService.js';
import { sanitizeLongText, sanitizeText } from '../utils/sanitize.js';

const nextStatusMap = {
  novo: 'em analise',
  'em analise': 'concluido',
  concluido: 'concluido'
};

export const getReports = async (request, response, next) => {
  try {
    const filters = {
      tipo: sanitizeText(request.query.tipo),
      status: sanitizeText(request.query.status),
      data: sanitizeText(request.query.data)
    };

    if (filters.tipo && !reportTypes.includes(filters.tipo)) {
      response.status(400).json({ message: 'Filtro de tipo inválido.' });
      return;
    }

    if (filters.status && !reportStatuses.includes(filters.status)) {
      response.status(400).json({ message: 'Filtro de status inválido.' });
      return;
    }

    const reports = await listReports(filters);
    response.json(reports);
  } catch (error) {
    next(error);
  }
};

export const patchReportStatus = async (request, response, next) => {
  try {
    const id = Number(request.params.id);
    const status = sanitizeText(request.body.status);

    if (!Number.isInteger(id)) {
      response.status(400).json({ message: 'ID inválido.' });
      return;
    }

    if (!reportStatuses.includes(status)) {
      response.status(400).json({ message: 'Status inválido.' });
      return;
    }

    const currentReport = await findReportById(id);

    if (!currentReport) {
      response.status(404).json({ message: 'Relato não encontrado.' });
      return;
    }

    if (nextStatusMap[currentReport.status] !== status) {
      response.status(400).json({ message: 'Transição de status inválida.' });
      return;
    }

    await updateReportStatus(id, status);
    response.json({ message: 'Status do relato atualizado com sucesso.' });
  } catch (error) {
    next(error);
  }
};

export const patchReportObservations = async (request, response, next) => {
  try {
    const id = Number(request.params.id);
    const observacoes = sanitizeLongText(request.body.observacoes || '');

    if (!Number.isInteger(id)) {
      response.status(400).json({ message: 'ID inválido.' });
      return;
    }

    const currentReport = await findReportById(id);

    if (!currentReport) {
      response.status(404).json({ message: 'Relato não encontrado.' });
      return;
    }

    await updateReportObservations(id, observacoes);
    response.json({
      message: 'Observações internas salvas com sucesso.',
      observacoes
    });
  } catch (error) {
    next(error);
  }
};
