import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.ADMIN_KEY) {
  throw new Error('ADMIN_KEY must be set in production.');
}

export const config = {
  port: Number(process.env.PORT) || 4200,
  adminKey: process.env.ADMIN_KEY || 'admin-demo',
  clientOrigin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  dataFile: path.resolve(root, process.env.DATA_FILE || 'data/reservations.json'),
  clientDist: path.resolve(root, '../client/dist'),
};
