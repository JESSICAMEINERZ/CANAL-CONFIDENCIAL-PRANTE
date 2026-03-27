import { createReport, reportTypes, sendNotificationEmail } from '../services/reportService.js';
import { removeUploadedFiles } from '../middleware/upload.js';
import { isValidEmail, sanitizeEmail, sanitizeLongText, sanitizeText } from '../utils/sanitize.js';

const audioExtensionByMimeType = {
  'audio/webm': '.webm',
  'audio/mp3': '.mp3',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/wave': '.wav'
};

const resolveAttachmentExtension = (file) => {
  const originalExtension = file.originalname?.includes('.') ? `.${file.originalname.split('.').pop()}` : '';

  if (originalExtension) {
    return originalExtension.toLowerCase();
  }

  const mimeType = typeof file.mimetype === 'string' ? file.mimetype.split(';')[0] : '';
  return audioExtensionByMimeType[mimeType] || '';
};

export const submitReport = async (request, response, next) => {
  const attachmentFiles = [...(request.files?.arquivos || []), ...(request.files?.arquivo || [])];
  const audioFiles = request.files?.audio || [];
  const uploadedFiles = [...attachmentFiles, ...audioFiles];
  let reportCreated = false;

  const cleanupBeforeExit = async () => {
    if (!reportCreated) {
      await removeUploadedFiles(uploadedFiles);
    }
  };

  try {
    const tipo = sanitizeText(request.body.tipo);
    const area = sanitizeText(request.body.area);
    const descricao = sanitizeLongText(request.body.descricao);
    const modoIdentificacao = sanitizeText(request.body.identificacao);
    const nome = sanitizeText(request.body.nome);
    const email = sanitizeEmail(request.body.email);
    const anonimo = modoIdentificacao !== 'identificado';

    if (!reportTypes.includes(tipo)) {
      await cleanupBeforeExit();
      response.status(400).json({ message: 'Tipo de relato inválido.' });
      return;
    }

    if (!descricao) {
      await cleanupBeforeExit();
      response.status(400).json({ message: 'A descrição do relato é obrigatória.' });
      return;
    }

    if (!anonimo && (!nome || !email)) {
      await cleanupBeforeExit();
      response.status(400).json({ message: 'Informe nome e e-mail para um envio identificado.' });
      return;
    }

    if (!anonimo && !isValidEmail(email)) {
      await cleanupBeforeExit();
      response.status(400).json({ message: 'Informe um e-mail válido.' });
      return;
    }

    let attachmentIndex = 0;
    const anexos = uploadedFiles.map((file) => {
      const isAudio = file.fieldname === 'audio';
      const extension = resolveAttachmentExtension(file);

      if (!isAudio) {
        attachmentIndex += 1;
      }

      return {
        nome: isAudio
          ? `audio-relato${extension || '.webm'}`
          : anonimo
            ? `anexo-confidencial-${attachmentIndex}${extension}`
            : file.originalname,
        nomeArmazenado: file.filename,
        caminho: file.filename,
        caminhoFisico: file.path,
        mimeType: file.mimetype,
        tamanho: file.size
      };
    });

    const payload = {
      tipo,
      area,
      descricao,
      anonimo,
      nome: anonimo ? null : nome,
      email: anonimo ? null : email,
      anexos,
      dataEnvio: new Date().toISOString()
    };

    const reportId = await createReport(payload);
    reportCreated = true;

    try {
      await sendNotificationEmail(payload);
    } catch (error) {
      console.error('Falha ao enviar e-mail:', error.message);
    }

    response.status(201).json({
      message: 'Relato enviado com sucesso.',
      id: reportId
    });
  } catch (error) {
    await cleanupBeforeExit();
    next(error);
  }
};
