import express from 'express';
import { Queue } from 'bullmq';
import { redisConnection } from '../lib/queue/connection';
import { createLogger } from '../lib/logger';

const log = createLogger('enqueue-server');
const app = express();
app.use(express.json());

const WORKER_SECRET = process.env.WORKER_SECRET;

app.use((req, res, next) => {
  if (WORKER_SECRET && req.headers.authorization !== `Bearer ${WORKER_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

const queues: Record<string, Queue> = {};

function getQueue(name: string): Queue {
  if (!queues[name]) {
    queues[name] = new Queue(name, { connection: redisConnection });
  }
  return queues[name];
}

app.post('/enqueue', async (req, res) => {
  try {
    const { queue, jobName, data } = req.body;
    if (!queue || !jobName) {
      return res.status(400).json({ error: 'queue and jobName required' });
    }
    const q = getQueue(queue);
    const job = await q.add(jobName, data);
    log.info({ queue, jobName, jobId: job.id }, 'Job enqueued');
    res.json({ jobId: job.id });
  } catch (error: any) {
    log.error({ error: error.message }, 'Enqueue failed');
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

export function startEnqueueServer() {
  app.listen(PORT, () => {
    log.info({ port: PORT }, 'Enqueue server started');
  });
}
