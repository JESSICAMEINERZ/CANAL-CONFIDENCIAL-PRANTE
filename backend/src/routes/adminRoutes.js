import { Router } from 'express';
import { getReports, patchReportObservations, patchReportStatus } from '../controllers/adminController.js';
import { requireAuth } from '../middleware/auth.js';

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.get('/reports', getReports);
adminRouter.patch('/reports/:id/status', patchReportStatus);
adminRouter.patch('/reports/:id/observacoes', patchReportObservations);
