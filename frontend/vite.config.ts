// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/', 
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: { // Adicionar esta seção
    proxy: {
      '/api': { // Redirecionar todas as chamadas que começam com /api
        target: 'http://localhost:3000', // Para o seu backend rodando na porta 3000
        changeOrigin: true, // Necessário para evitar erros de CORS
        // Não precisa de rewrite, pois o backend já espera /api por causa do setGlobalPrefix
      }
    }
  }
});

