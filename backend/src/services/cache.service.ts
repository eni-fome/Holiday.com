export class CacheService {
  /**
   * Get cached value - No-op without Redis
   */
  static async get<T>(key: string): Promise<T | null> {
    return null;
  }

  /**
   * Set cache value - No-op without Redis
   */
  static async set(key: string, value: any, ttl: number = 300): Promise<void> {
    return;
  }

  /**
   * Delete single cache key - No-op without Redis
   */
  static async del(key: string): Promise<void> {
    return;
  }

  /**
   * Delete all keys matching pattern - No-op without Redis
   */
  static async delPattern(pattern: string): Promise<void> {
    return;
  }

  /**
   * Generate consistent cache key
   */
  static cacheKey(prefix: string, params: any): string {
    let sanitized: string;
    if (
      params &&
      typeof params === 'object' &&
      !Array.isArray(params)
    ) {
      sanitized = JSON.stringify(params, Object.keys(params).sort());
    } else {
      sanitized = JSON.stringify(params);
    }
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
