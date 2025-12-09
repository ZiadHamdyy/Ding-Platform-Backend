import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { get } from 'env-var';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private isConnected = false;

  async onModuleInit() {
    const redisUrl = get('REDIS_URL').asString();

    // Skip Redis in development if not configured
    if (!redisUrl && process.env.NODE_ENV === 'development') {
      console.log('⚠️  Redis not configured, caching disabled');
      return;
    }

    try {
      this.client = createClient({
        url: redisUrl,
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        console.log('redisUrl', redisUrl);
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }

  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      console.log('Redis connection closed');
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL (in seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  /**
   * Delete keys matching pattern
   */
  async delPattern(pattern: string): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis delPattern error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  /**
   * Set expiration on key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      console.error('Redis expire error:', error);
      return false;
    }
  }

  /**
   * Increment value
   */
  async incr(key: string): Promise<number | null> {
    if (!this.isConnected) return null;

    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error('Redis incr error:', error);
      return null;
    }
  }

  /**
   * Get TTL of key
   */
  async ttl(key: string): Promise<number | null> {
    if (!this.isConnected) return null;

    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error('Redis ttl error:', error);
      return null;
    }
  }

  /**
   * Flush all keys (use with caution!)
   */
  async flushAll(): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Redis flushAll error:', error);
      return false;
    }
  }
}
