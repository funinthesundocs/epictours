const WORKER_URL = process.env.WORKER_URL;
const WORKER_SECRET = process.env.WORKER_SECRET;

export async function enqueueJob(
  queue: string,
  jobName: string,
  data: Record<string, any>
): Promise<{ jobId: string }> {
  if (!WORKER_URL) throw new Error('WORKER_URL not configured');

  const response = await fetch(`${WORKER_URL}/enqueue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(WORKER_SECRET ? { 'Authorization': `Bearer ${WORKER_SECRET}` } : {}),
    },
    body: JSON.stringify({ queue, jobName, data }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to enqueue job: ${response.status} ${error}`);
  }

  return response.json();
}
