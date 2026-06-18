import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import organizeHandler from './api/organize.js';

function createMockResponse(serverResponse) {
  return {
    status(code) {
      serverResponse.statusCode = code;
      return this;
    },
    json(payload) {
      serverResponse.setHeader('Content-Type', 'application/json; charset=utf-8');
      serverResponse.end(JSON.stringify(payload));
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [
      react(),
      {
        name: 'local-openai-api',
        configureServer(server) {
          server.middlewares.use('/api/organize', async (req, res) => {
            await organizeHandler(req, createMockResponse(res));
          });
        }
      }
    ]
  };
});
