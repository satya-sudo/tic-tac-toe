import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxy = { '/games': { target: env.API_PROXY_TARGET || 'http://localhost:8080', changeOrigin: true, ws: true } };
  return { server: { proxy }, preview: { proxy } };
});
