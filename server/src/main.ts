import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { LogLevel, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './logging/global-exception.filter';
import { requestLoggingMiddleware } from './logging/request-logging.middleware';

function resolveLoggerLevels(): LogLevel[] {
  const allowedLevels: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];
  const configured = process.env.LOG_LEVELS?.split(',')
    .map((level) => level.trim())
    .filter((level): level is LogLevel => allowedLevels.includes(level as LogLevel));

  if (configured && configured.length > 0) {
    return configured;
  }

  return allowedLevels;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: resolveLoggerLevels(),
  });
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(requestLoggingMiddleware);
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });
  
  const port = process.env.PORT ? Number(process.env.PORT) : 8080;
  if (Number.isNaN(port)) {
    throw new Error('PORT must be a number');
  }

  const enableSwagger =
    process.env.ENABLE_SWAGGER === 'true' ||
    (process.env.NODE_ENV !== 'production' && process.env.ENABLE_SWAGGER !== 'false');

  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('Sebotics API')
      .setDescription('The Sebotics API description')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);
  }

  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  if (enableSwagger) {
    console.log(`Swagger UI available at: http://localhost:${port}/api`);
  }
}

bootstrap();
