import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { submitReport } from '../controllers/reportController.js';
import { uploadReportFiles } from '../middleware/upload.js';

export const reportRouter = Router();

const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Recebemos muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.'
  }
});

reportRouter.post('/', reportLimiter, uploadReportFiles, submitReport);
