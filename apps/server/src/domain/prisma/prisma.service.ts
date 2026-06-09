import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connectPrisma, disconnectPrisma, PrismaClient } from '@package/prisma';
import { PinoLogger } from 'nestjs-pino';

type QueryEvent = {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
};

type PrismaWithQueryEvents = PrismaClient & {
  $on(event: 'query', callback: (event: QueryEvent) => void): void;
};

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject('PRISMA') private readonly prisma: PrismaClient,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext('Prisma');
  }

  async onModuleInit() {
    await connectPrisma();

    (this.prisma as PrismaWithQueryEvents).$on('query', (e: QueryEvent) => {
      this.logger.info(
        { sql: e.query, params: e.params, duration: `${e.duration}ms` },
        'Database Query'
      );
    });
  }

  async onModuleDestroy() {
    await disconnectPrisma();
  }
}
