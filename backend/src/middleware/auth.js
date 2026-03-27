import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const requireAuth = (request, response, next) => {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    response.status(401).json({ message: 'Acesso não autorizado.' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    request.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    response.status(401).json({ message: 'Sua sessão expirou. Faça login novamente.' });
  }
};
