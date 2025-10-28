import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
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
  const allowedOrigins = process.env.FRONTEND_ORIGIN
    ? process.env.FRONTEND_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];

  expressApp.set('trust proxy', 1);
  
  const app = await NestFactory.create(AppModule, adapter, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) {
          return callback(null, true);
        }
        // Check if origin is allowed
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          console.warn(`CORS: Origin ${origin} not allowed. Allowed origins: ${JSON.stringify(allowedOrigins)}`);
          // For production, only allow specific origins for security
          // In development, allow all for easier testing
          if (process.env.NODE_ENV === 'production') {
            callback(new Error('Not allowed by CORS'));
          } else {
            callback(null, true);
          }
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400, // Cache preflight requests for 24 hours
    },
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  await app.init();
  cachedApp = app;
  return app;
}

async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
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

