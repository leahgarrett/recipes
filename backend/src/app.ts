import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  serializerCompiler, validatorCompiler, jsonSchemaTransform,
} from 'fastify-type-provider-zod';
import { registerHealthRoutes } from './routes/health.js';
import { registerRecipeRoutes } from './routes/recipes.js';

export async function buildApp(options: { logger?: boolean } = {}) {
  const app = Fastify({ logger: options.logger ?? false });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, { origin: true });
  await app.register(swagger, {
    openapi: { info: { title: 'Recipe Admin API', version: '1.0.0' } },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  app.get('/openapi.json', async () => app.swagger());

  await app.register(registerHealthRoutes);
  await app.register(registerRecipeRoutes);

  await app.ready();
  return app;
}
