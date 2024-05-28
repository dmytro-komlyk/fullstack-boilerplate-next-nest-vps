import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { useContainer } from 'class-validator';
import { API, STATIC_ASSETS } from './constants/env.constants';
import { AppModule } from './domain/app.module';
import { TrpcRouter } from './domain/trpc/trpc.router';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'Range'],
    exposedHeaders: 'Content-Range',
  });

  app.setGlobalPrefix(API);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.useStaticAssets(`${process.cwd()}/${STATIC_ASSETS}`, {
    prefix: `/${STATIC_ASSETS}`,
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const trpc = app.get(TrpcRouter);
  trpc.applyMiddleware(app);

  await app.listen(process.env.APP_PORT || 3000);
}
bootstrap();
