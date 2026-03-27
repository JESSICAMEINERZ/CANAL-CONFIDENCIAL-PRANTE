import { all, get, run } from '../config/database.js';
import { env } from '../config/env.js';
import { sendMail } from '../config/mailer.js';

const allowedTypes = ['Ideia', 'Sugestao', 'Reclamacao', 'Denuncia'];
const allowedStatuses = ['novo', 'em analise', 'concluido'];

export const reportTypes = allowedTypes;
export const reportStatuses = allowedStatuses;

export const createReport = async (payload) => {
  await run('BEGIN TRANSACTION');

  try {
    const firstAttachment = payload.anexos[0];
    const result = await run(
      `INSERT INTO reports (
        tipo, area, descricao, anonimo, nome, email, arquivo_nome, arquivo_caminho, data_envio, status, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.tipo,
        payload.area,
        payload.descricao,
        payload.anonimo ? 1 : 0,
        payload.nome,
        payload.email,
        firstAttachment?.nome || null,
        firstAttachment?.caminho || null,
        payload.dataEnvio,
        'novo',
        null
      ]
    );

    for (const attachment of payload.anexos) {
      await run(
        `INSERT INTO report_attachments (
          report_id, original_name, stored_name, stored_path, mime_type, size
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          result.id,
          attachment.nome,
          attachment.nomeArmazenado,
          attachment.caminho,
          attachment.mimeType,
          attachment.tamanho
        ]
      );
    }

    await run('COMMIT');
    return result.id;
  } catch (error) {
    await run('ROLLBACK').catch(() => {});
    throw error;
  }
};

export const listReports = async (filters) => {
  const clauses = [];
  const params = [];

  if (filters.tipo) {
    clauses.push('tipo = ?');
    params.push(filters.tipo);
  }

  if (filters.status) {
    clauses.push('status = ?');
    params.push(filters.status);
  }

  if (filters.data) {
    clauses.push('date(data_envio) = date(?)');
    params.push(filters.data);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const reports = await all(
    `SELECT id, tipo, area, descricao, anonimo, nome, email, arquivo_nome AS arquivoNome, arquivo_caminho AS arquivoCaminho, data_envio AS dataEnvio, status, observacoes
     FROM reports
     ${whereClause}
     ORDER BY datetime(data_envio) DESC, id DESC`,
    params
  );

  if (!reports.length) {
    return reports;
  }

  const reportIds = reports.map((report) => report.id);
  const placeholders = reportIds.map(() => '?').join(', ');
  const attachments = await all(
    `SELECT id, report_id AS reportId, original_name AS nome, stored_name AS nomeArmazenado, stored_path AS caminho, mime_type AS mimeType, size AS tamanho
     FROM report_attachments
     WHERE report_id IN (${placeholders})
     ORDER BY id ASC`,
    reportIds
  );

  const groupedAttachments = attachments.reduce((accumulator, attachment) => {
    const current = accumulator.get(attachment.reportId) || [];
    current.push(attachment);
    accumulator.set(attachment.reportId, current);
    return accumulator;
  }, new Map());

  return reports.map((report) => ({
    ...report,
    anexos:
      groupedAttachments.get(report.id) ||
      (report.arquivoCaminho
        ? [
            {
              nome: report.arquivoNome,
              caminho: report.arquivoCaminho,
              mimeType: null,
              tamanho: null
            }
          ]
        : [])
  }));
};

export const updateReportStatus = async (id, status) =>
  run('UPDATE reports SET status = ? WHERE id = ?', [status, id]);

export const updateReportObservations = async (id, observacoes) =>
  run('UPDATE reports SET observacoes = ? WHERE id = ?', [observacoes || null, id]);

export const findReportById = async (id) =>
  get(
    `SELECT id, tipo, area, descricao, anonimo, nome, email, arquivo_nome AS arquivoNome, arquivo_caminho AS arquivoCaminho, data_envio AS dataEnvio, status, observacoes
     FROM reports
     WHERE id = ?`,
    [id]
  );

export const sendNotificationEmail = async (report) => {
  const formattedType =
    report.tipo === 'Sugestao'
      ? 'Sugestão'
      : report.tipo === 'Reclamacao'
        ? 'Reclamação'
        : report.tipo === 'Denuncia'
          ? 'Denúncia'
          : report.tipo;

  const lines = [
    `Tipo do relato: ${formattedType}`,
    `Área: ${report.area || 'Não informada'}`,
    `Envio anônimo: ${report.anonimo ? 'Sim' : 'Não'}`,
    `Nome: ${report.nome || 'Não informado'}`,
    `E-mail: ${report.email || 'Não informado'}`,
    `Anexos: ${report.anexos.length ? report.anexos.map((attachment) => attachment.nome).join(', ') : 'Nenhum'}`,
    `Descrição: ${report.descricao}`,
    `Data do envio: ${report.dataEnvio}`
  ];

  await sendMail({
    from: env.emailFrom,
    to: env.emailTo,
    subject: `Novo relato - ${formattedType} - ${report.area || 'Sem área informada'}`,
    text: lines.join('\n'),
    attachments: report.anexos.map((attachment) => ({
      filename: attachment.nome,
      path: attachment.caminhoFisico,
      contentType: attachment.mimeType
    }))
  });
};
