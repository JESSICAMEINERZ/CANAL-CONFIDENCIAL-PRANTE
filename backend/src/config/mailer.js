import fs from 'fs/promises';
import { Resend } from 'resend';
import { env } from './env.js';

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

const buildAttachments = async (attachments = []) => {
  const payloads = await Promise.all(
    attachments.map(async (attachment) => {
      if (!attachment?.path) {
        return null;
      }

      const content = await fs.readFile(attachment.path);

      return {
        filename: attachment.filename,
        content: content.toString('base64'),
        contentType: attachment.contentType
      };
    })
  );

  return payloads.filter(Boolean);
};

export const sendMail = async (message) => {
  if (!resend) {
    throw new Error('O envio de e-mail não está configurado.');
  }

  const attachments = await buildAttachments(message.attachments);

  return resend.emails.send({
    from: message.from || env.emailFrom,
    to: message.to,
    subject: message.subject,
    html: message.html || '',
    text: message.text || undefined,
    attachments
  });
};
