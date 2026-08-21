import 'reflect-metadata';

import { API_PREFIX } from '@dataroom/shared';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { configureApp } from './bootstrap';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  configureApp(app);
  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim()),
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  Logger.log(`Listening on http://localhost:${port}/${API_PREFIX}`, 'Bootstrap');
}

void bootstrap();
