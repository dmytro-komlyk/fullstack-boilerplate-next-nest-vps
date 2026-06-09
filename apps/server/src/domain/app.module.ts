import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Keyv from 'keyv';
import { LoggerModule } from 'nestjs-pino';

import { PrismaModule } from './prisma/prisma.module';
import { RedisProvider } from './redis/redis.provider';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local', '.env'],
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redis = new KeyvRedis(
          `redis://${config.get<string>('REDIS_HOST', 'localhost')}:${config.get<number>('REDIS_PORT', 6379)}`
        );
        return {
          stores: [new Keyv({ store: redis, ttl: 60_000 })],
        };
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        ...(process.env.NODE_ENV !== 'production' && {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
              singleLine: false,
            },
          },
        }),
      },
    }),
    PrismaModule,
    // other modules
  ],
  providers: [RedisProvider],
  exports: [RedisProvider],
})
export class AppModule {}
