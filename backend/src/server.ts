import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 8000);

const app = await buildApp({ logger: true });
app
  .listen({ port, host: '0.0.0.0' })
  .then(() => console.log(`Recipe Admin API on http://localhost:${port} (docs at /docs)`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
