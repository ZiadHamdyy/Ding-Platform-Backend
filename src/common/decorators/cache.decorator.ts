import { RedisService } from '../../configs/redis/redis.service';

/**
 * Cache decorator for methods
 * Usage: @Cacheable('keyPrefix', ttlSeconds)
 */
export function Cacheable(keyPrefix: string, ttl = 300) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const redisService: RedisService = this.redisService || this.redis;

      if (!redisService) {
        // If Redis not available, just call original method
        return originalMethod.apply(this, args);
      }

      // Generate cache key from prefix and arguments
      const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;

      // Try to get from cache
      const cached = await redisService.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Call original method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      await redisService.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache invalidation decorator
 * Usage: @InvalidateCache('keyPattern')
 */
export function InvalidateCache(keyPattern: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      const redisService: RedisService = this.redisService || this.redis;
      if (redisService) {
        // Invalidate cache pattern
        await redisService.delPattern(keyPattern);
      }

      return result;
    };

    return descriptor;
  };
}
