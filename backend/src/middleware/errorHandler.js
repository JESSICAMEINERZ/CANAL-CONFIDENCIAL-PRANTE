import multer from 'multer';
import { removeUploadedFiles } from './upload.js';

export const notFoundHandler = (_request, response) => {
  response.status(404).json({ message: 'Rota não encontrada.' });
};

export const errorHandler = async (error, request, response, _next) => {
  const uploadedFiles = [
    ...(request.files?.arquivos || []),
    ...(request.files?.arquivo || []),
    ...(request.files?.audio || [])
  ];

  if (error instanceof multer.MulterError) {
    await removeUploadedFiles(uploadedFiles);

    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'Cada arquivo pode ter até 5 MB.'
        : error.code === 'LIMIT_UNEXPECTED_FILE'
          ? error.field === 'audio'
            ? 'Envie apenas 1 arquivo de áudio por relato.'
            : 'Há um arquivo em um campo não reconhecido na solicitação.'
        : error.code === 'LIMIT_FILE_COUNT'
          ? 'Você pode enviar até 5 arquivos e 1 áudio por relato.'
          : 'Não foi possível processar os arquivos enviados.';

    response.status(400).json({ message });
    return;
  }

  if (
    error.message === 'Formato de arquivo não permitido.' ||
    error.message === 'Formato de arquivo nao permitido.'
  ) {
    await removeUploadedFiles(uploadedFiles);
    response.status(400).json({ message: 'Envie apenas arquivos em PDF, JPG, PNG, WEBM, MP3 ou WAV.' });
    return;
  }

  console.error(error);
  response.status(error.statusCode || 500).json({
    message: error.message || 'Ocorreu um erro interno no servidor.'
  });
};
