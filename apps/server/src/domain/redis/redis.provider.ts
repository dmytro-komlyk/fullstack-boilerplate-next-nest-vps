import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const RedisProvider: Provider = {
  provide: 'REDIS',
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const logger = new Logger('Redis');

    const redis = new Redis({
      host: config.get<string>('REDIS_HOST', 'localhost'),
      port: config.get<number>('REDIS_PORT', 6379),
      password: config.get<string>('REDIS_PASSWORD'),
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    redis.on('connect', () => logger.log('Connected'));
    redis.on('error', (err: Error) => logger.error('Connection error', err.stack));
    redis.on('reconnecting', () => logger.warn('Reconnecting...'));

    return redis;
  },
};
