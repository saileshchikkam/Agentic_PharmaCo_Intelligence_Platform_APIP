import { startServer } from './server';

void startServer().catch(error => {
  console.error('APIP startup failed:', error.message);
  process.exitCode = 1;
});
