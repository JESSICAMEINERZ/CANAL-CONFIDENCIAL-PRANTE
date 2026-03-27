import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const toBool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return value === 'true';
};

export const env = {
  port: Number(process.env.PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  adminUser: process.env.ADMIN_USER || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'troque-essa-senha',
  jwtSecret: process.env.JWT_SECRET || 'troque-por-uma-chave-forte',
  emailFrom: process.env.EMAIL_FROM || 'onboarding@resend.dev',
  emailTo: process.env.EMAIL_TO || 'ouvidoria@grupoprante.com.br',
  resendApiKey: process.env.RESEND_API_KEY,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: toBool(process.env.SMTP_SECURE, false),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS
};
