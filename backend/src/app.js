import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { authRouter } from './routes/authRoutes.js';
import { reportRouter } from './routes/reportRoutes.js';
import { adminRouter } from './routes/adminRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

const vercelFrontendUrl = 'https://canal-confidencial-prante-frontend.vercel.app';
const configuredOrigins = (env.frontendUrl || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...configuredOrigins, vercelFrontendUrl]));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origem não permitida pelo CORS.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/reports', reportRouter);
app.use('/api/admin', adminRouter);

const frontendDist = path.resolve(__dirname, '../../frontend/dist');

app.use(express.static(frontendDist));

app.get('*', (request, response, next) => {
  if (request.path.startsWith('/api')) {
    next();
    return;
  }

  // Em producao, o backend entrega o frontend compilado e preserva as rotas do React.
  response.sendFile(path.join(frontendDist, 'index.html'), (error) => {
    if (error) {
      next();
    }
  });
});

app.use(notFoundHandler);
app.use(errorHandler);
