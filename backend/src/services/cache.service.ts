import redis from '../config/redis';

export class CacheService {
  private static isRedisAvailable = true;

  /**
   * Get cached value
   */
  static async get<T>(key: string): Promise<T | null> {
    if (!this.isRedisAvailable) return null;

    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Cache GET error:', error);
      this.isRedisAvailable = false;
      return null;
    }
  }

  /**
   * Set cache value with TTL (time to live in seconds)
   */
  static async set(key: string, value: any, ttl: number = 300): Promise<void> {
    if (!this.isRedisAvailable) return;

    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.warn('Cache SET error:', error);
      this.isRedisAvailable = false;
    }
  }

  /**
   * Delete single cache key
   */
  static async del(key: string): Promise<void> {
    if (!this.isRedisAvailable) return;

    try {
      await redis.del(key);
    } catch (error) {
      console.warn('Cache DEL error:', error);
    }
  }

  /**
   * Delete all keys matching pattern
   */
  static async delPattern(pattern: string): Promise<void> {
    if (!this.isRedisAvailable) return;

    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.warn('Cache DEL PATTERN error:', error);
    }
  }

  /**
   * Generate consistent cache key
   */
  static cacheKey(prefix: string, params: any): string {
    const sanitized = JSON.stringify(params, Object.keys(params).sort());
    return `${prefix}:${sanitized}`;
  }

  /**
   * Invalidate all hotel-related caches
   */
  static async invalidateHotelCache(hotelId?: string): Promise<void> {
    if (hotelId) {
      await this.del(`hotel:${hotelId}`);
    }
    await this.delPattern('hotel:search:*');
    await this.delPattern('hotel:latest:*');
  }
}
