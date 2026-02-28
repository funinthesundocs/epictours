import { startEnqueueServer } from './enqueue-server';
import { startScraperWorker } from './scraper-worker';
import { startRemixWorker } from './remix-worker';
import { createLogger } from '../lib/logger';

const log = createLogger('worker');

// Start the enqueue HTTP server (receives POSTs from Netlify)
startEnqueueServer();

// Start BullMQ workers
const scraperWorker = startScraperWorker();
const remixWorker = startRemixWorker();

// Graceful shutdown
async function shutdown() {
  log.info('Shutting down workers...');
  await Promise.all([
    scraperWorker.close(),
    remixWorker.close(),
  ]);
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('uncaughtException', (err) => {
  log.fatal({ error: err.message }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.fatal({ reason }, 'Unhandled rejection');
  process.exit(1);
});

log.info('Worker process started (scraper + remix)');
