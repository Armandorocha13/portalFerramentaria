import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { importCargaSaldo } from './scripts/import_carga_saldo'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'update-carga-api',
      configureServer(server) {
        server.middlewares.use('/api/update-carga', async (req, res) => {
          try {
            const result = await importCargaSaldo();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (error: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      }
    }
  ],
})
