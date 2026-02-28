import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

// Upstash only accepts AUTH <password> (old format), not AUTH <username> <password> (ACL).
// Passing a URL with credentials makes ioredis use ACL AUTH — even with empty username.
// Parse into components and pass host/port/password individually so ioredis uses old AUTH.
function parseRedisUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port || '6379', 10),
    password: u.password || undefined,
    tls: url.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
  };
}

export const redisConnection = new IORedis({
  ...parseRedisUrl(REDIS_URL),
  maxRetriesPerRequest: null,
});
