const normalizeText = (value = '') => String(value).trim().replace(/\s+/g, ' ');

export const sanitizeText = (value = '') =>
  normalizeText(value)
    .replace(/[<>]/g, '')
    .slice(0, 255);

export const sanitizeLongText = (value = '') =>
  String(value)
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 5000);

export const sanitizeEmail = (value = '') => normalizeText(value).toLowerCase().slice(0, 255);

export const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

