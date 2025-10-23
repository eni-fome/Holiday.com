import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('Redis error:', err?.message?.replace(/[\r\n]/g, '') || 'Unknown error');
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('ready', () => {
  console.log('✅ Redis ready to accept commands');
});

// Graceful connection - don't fail if Redis is down
redis.connect().catch((err) => {
  console.warn('⚠️  Redis not available, continuing without cache:', err?.message?.replace(/[\r\n]/g, '') || 'Unknown error');
});

export default redis;
