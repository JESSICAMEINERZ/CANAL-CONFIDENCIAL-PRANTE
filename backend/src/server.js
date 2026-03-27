import { app } from './app.js';
import { initDatabase } from './config/database.js';
import { env } from './config/env.js';

const start = async () => {
  await initDatabase();

  app.listen(env.port, () => {
    console.log(`Servidor ativo em http://localhost:${env.port}`);
  });
};

start().catch((error) => {
  console.error('Falha ao iniciar servidor:', error);
  process.exit(1);
});
