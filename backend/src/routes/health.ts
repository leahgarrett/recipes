import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function registerHealthRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get('/health', {
    schema: { response: { 200: z.object({ status: z.literal('ok') }) } },
  }, async () => ({ status: 'ok' as const }));
}
