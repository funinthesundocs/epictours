import { Worker, Job } from 'bullmq';
import { redisConnection } from '../lib/queue/connection';
import { createLogger } from '../lib/logger';
import { handleRender, RenderJobData } from './handlers/render';

const log = createLogger('remix-worker');

async function processRemixJob(job: Job): Promise<void> {
  log.info({ jobId: job.id, name: job.name, data: job.data }, 'Processing remix job');

  switch (job.name) {
    case 'remix_title':
    case 'remix_thumbnail':
    case 'remix_script':
    case 'generate_audio':
    case 'generate_avatar':
    case 'generate_broll':
      log.info({ name: job.name }, 'Handler not yet implemented — processed by API routes');
      break;
    case 'render':
      await handleRender(job.data as RenderJobData);
      break;
    default:
      log.warn({ name: job.name }, 'Unknown remix job type');
  }
}

export function startRemixWorker(): Worker {
  const worker = new Worker('epic-remix', processRemixJob, {
    connection: redisConnection,
    concurrency: 3,
  });

  worker.on('completed', (job) => {
    log.info({ jobId: job?.id, name: job?.name }, 'Remix job completed');
  });

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, name: job?.name, error: err.message }, 'Remix job failed');
  });

  log.info('Remix worker started');
  return worker;
}
