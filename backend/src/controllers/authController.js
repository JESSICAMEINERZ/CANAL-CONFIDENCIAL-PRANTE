import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sanitizeText } from '../utils/sanitize.js';

let cachedPasswordHash;

const getAdminPasswordHash = async () => {
  if (!cachedPasswordHash) {
    cachedPasswordHash = await bcrypt.hash(env.adminPassword, 10);
  }

  return cachedPasswordHash;
};

export const login = async (request, response, next) => {
  try {
    const username = sanitizeText(request.body.username);
    const password = String(request.body.password || '');

    const passwordHash = await getAdminPasswordHash();
    const validUser = username === env.adminUser;
    const validPassword = await bcrypt.compare(password, passwordHash);

    if (!validUser || !validPassword) {
      response.status(401).json({ message: 'Usuário ou senha inválidos.' });
      return;
    }

    const token = jwt.sign({ username }, env.jwtSecret, { expiresIn: '8h' });

    response.json({
      token,
      user: {
        username
      }
    });
  } catch (error) {
    next(error);
  }
};
