import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';

function validateEnv(config: Record<string, any>) {
  const errors: string[] = [];
  if (!config.MONGO_URI) errors.push('MONGO_URI is required');
  if (!config.JWT_SECRET) errors.push('JWT_SECRET is required');
  // GOOGLE_CLIENT_ID is optional (only needed for Google auth). If present, basic shape check.
  if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_ID.length < 10) {
    errors.push('GOOGLE_CLIENT_ID appears invalid (too short)');
  }
  if (errors.length) {
    // Throwing causes Nest to fail fast at bootstrap.
    throw new Error('Configuration validation error:\n' + errors.map(e => ' - ' + e).join('\n'));
  }
  return config;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Using a custom validate function; could be replaced with Joi/Zod later.
      validate: validateEnv,
    }),
    // Use a factory pattern to ensure we do not start with empty URI.
    MongooseModule.forRootAsync({
      useFactory: () => {
        const uri = process.env.MONGO_URI;
        if (!uri) {
          throw new Error('MONGO_URI missing at runtime');
        }
        return ({ uri });
      },
    }),
    UsersModule,
  AuthModule,
  ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
