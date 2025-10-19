import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import cookieParser from 'cookie-parser';
import { ExpressAdapter } from '@nestjs/platform-express';
const express = require('express');

// Create Express app instance for serverless
const expressApp = express();
let cachedApp: any = null;

async function createApp() {
  if (cachedApp) {
    return cachedApp;
  }

  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || true,
      credentials: true,
    },
  });
  
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  
  await app.init();
  cachedApp = app;
  return app;
}

async function bootstrap() {
  const app = await createApp();
  await app.listen(process.env.PORT || 4000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

// For local development
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}

// Export for Vercel serverless
export default async (req: Request, res: Response) => {
  await createApp();
  return expressApp(req, res);
};

