// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import compression from 'compression';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

async function bootstrap() {
  /* ------------------------------------------------------------------ *
   * 0) Carrega variáveis de ambiente
   * ------------------------------------------------------------------ */
  dotenv.config();

  /* ------------------------------------------------------------------ *
   * 0.1) Força Prisma a usar o engine BINÁRIO
   *      (evita P1001 quando o engine "library" falha)
   * ------------------------------------------------------------------ */
  if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
  }
  console.log(
    `🔧 Prisma engine type: ${process.env.PRISMA_CLIENT_ENGINE_TYPE}`,
  );

  /* ------------------------------------------------------------------ *
   * 1) Cria a aplicação Nest
   * ------------------------------------------------------------------ */
  const app = await NestFactory.create(AppModule);

  /* ------------------------------------------------------------------ *
   * 2) CORS — deve vir antes de qualquer outro middleware
   * ------------------------------------------------------------------ */
  app.enableCors({
    origin: [
      'http://localhost:5173', // Vite dev server
      'http://localhost:4173', // Vite preview
      'https://iconic-seven.vercel.app',
      'https://iconicxp.netlify.app',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Transaction-Id'],
    credentials: false,
  });

  /* ------------------------------------------------------------------ *
   * 3) GZIP compression
   * ------------------------------------------------------------------ */
  app.use(compression());

  /* ------------------------------------------------------------------ *
   * 4) Validação global
   * ------------------------------------------------------------------ */
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  /* ------------------------------------------------------------------ *
   * 5) Prefixo global da API
   * ------------------------------------------------------------------ */
  app.setGlobalPrefix('api');

  /* ------------------------------------------------------------------ *
   * 6) Swagger
   * ------------------------------------------------------------------ */
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ICONIC API')
    .setDescription('Documentação da API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  /* ------------------------------------------------------------------ *
   * 7) Inicializa o servidor — mesma linha serve local/render
   * ------------------------------------------------------------------ */
  const port = parseInt(process.env.PORT ?? '3000', 10);
  const host = process.env.RENDER ? '0.0.0.0' : '127.0.0.1';

  await app.listen(port, host);

  /* ------------------------------------------------------------------ *
   * Log amistoso indicando URL correta
   * ------------------------------------------------------------------ */
  const baseUrl = process.env.RENDER
    ? `https://${
        process.env.RENDER_EXTERNAL_HOSTNAME ?? 'your-service.onrender.com'
      }`
    : `http://localhost:${port}`;
  console.log(`🚀 Server running on ${baseUrl}/api`);
}

bootstrap();
