import nodemailer from 'nodemailer';
import { env } from './env.js';

const isConfigured = Boolean(env.smtpHost && env.smtpUser && env.smtpPass);

export const transporter = isConfigured
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      }
    })
  : null;

export const sendMail = async (message) => {
  if (!transporter) {
    throw new Error('O envio de e-mail não está configurado.');
  }

  return transporter.sendMail(message);
};
