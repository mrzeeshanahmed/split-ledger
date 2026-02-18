import { validateEnv } from './config/validateEnv.js';

const startServer = () => {
  validateEnv();
  console.log('Split-Ledger backend starting...');
};

startServer();
