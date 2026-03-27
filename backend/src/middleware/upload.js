import fs from 'fs';
import fsPromises from 'fs/promises';
import { randomUUID } from 'crypto';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, uploadDir);
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname);
    callback(null, `${Date.now()}-${randomUUID()}${extension}`);
  }
});

const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
const allowedAudioMimeTypes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/wave'];
const allowedAudioExtensions = ['.webm', '.mp3', '.wav'];

const matchesMimeType = (mimeType, allowedTypes) =>
  allowedTypes.some((allowedType) => mimeType === allowedType || mimeType.startsWith(`${allowedType};`));

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6
  },
  fileFilter: (_request, file, callback) => {
    const mimeType = typeof file.mimetype === 'string' ? file.mimetype : '';
    const extension = path.extname(file.originalname || '').toLowerCase();
    const isAudioField = file.fieldname === 'audio';
    const isSupportedDocument = matchesMimeType(mimeType, allowedMimeTypes);
    const isSupportedAudio =
      isAudioField && (matchesMimeType(mimeType, allowedAudioMimeTypes) || allowedAudioExtensions.includes(extension));

    if (!isSupportedDocument && !isSupportedAudio) {
      callback(new Error('Formato de arquivo não permitido.'));
      return;
    }

    callback(null, true);
  }
});

export const uploadReportFiles = upload.fields([
  { name: 'arquivos', maxCount: 5 },
  { name: 'arquivo', maxCount: 5 },
  { name: 'audio', maxCount: 1 }
]);

export const removeUploadedFiles = async (files = []) => {
  await Promise.all(
    files
      .filter((file) => file?.path)
      .map(async (file) => {
        try {
          await fsPromises.unlink(file.path);
        } catch (error) {
          if (error.code !== 'ENOENT') {
            console.error('Falha ao remover arquivo temporário:', error.message);
          }
        }
      })
  );
};
