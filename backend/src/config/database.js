import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const databasePath = path.join(dataDir, 'canal-confidencial.sqlite');

export const db = new sqlite3.Database(databasePath);

export const initDatabase = async () =>
  new Promise((resolve, reject) => {
    db.serialize(() => {
      const ensureReportsObservationsColumn = () => {
        db.all('PRAGMA table_info(reports)', (pragmaError, columns) => {
          if (pragmaError) {
            reject(pragmaError);
            return;
          }

          const hasObservacoesColumn = columns.some((column) => column.name === 'observacoes');

          const continueSetup = () => {
            db.run(
              `CREATE TABLE IF NOT EXISTS report_attachments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER NOT NULL,
                original_name TEXT NOT NULL,
                stored_name TEXT NOT NULL,
                stored_path TEXT NOT NULL,
                mime_type TEXT NOT NULL,
                size INTEGER NOT NULL,
                FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
              )`,
              (attachmentError) => {
                if (attachmentError) {
                  reject(attachmentError);
                  return;
                }

                resolve();
              }
            );
          };

          if (hasObservacoesColumn) {
            continueSetup();
            return;
          }

          db.run('ALTER TABLE reports ADD COLUMN observacoes TEXT', (alterError) => {
            if (alterError) {
              reject(alterError);
              return;
            }

            continueSetup();
          });
        });
      };

      db.run('PRAGMA foreign_keys = ON');
      db.run(
        `CREATE TABLE IF NOT EXISTS reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tipo TEXT NOT NULL,
          area TEXT,
          descricao TEXT NOT NULL,
          anonimo INTEGER NOT NULL DEFAULT 1,
          nome TEXT,
          email TEXT,
          arquivo_nome TEXT,
          arquivo_caminho TEXT,
          data_envio TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'novo',
          observacoes TEXT
        )`,
        (error) => {
          if (error) {
            reject(error);
            return;
          }

          ensureReportsObservationsColumn();
        }
      );
    });
  });

export const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({ id: this.lastID, changes: this.changes });
    });
  });

export const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });

export const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
