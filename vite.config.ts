import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { buildContent } from './scripts/build-content.mjs';

/**
 * Regenerates `src/content/generated` whenever a markdown file under
 * `content/` is added, edited or removed, so `npm run dev` picks up new
 * articles without a restart.
 */
function contentPlugin(): Plugin {
  return {
    name: 'blog-content',
    enforce: 'pre',
    async buildStart() {
      await buildContent({ silent: true });
    },
    configureServer(server) {
      server.watcher.add(fileURLToPath(new URL('./content', import.meta.url)));
      const regenerate = async (file: string) => {
        if (!/\.mdx?$/.test(file)) return;
        try {
          await buildContent({ silent: true });
          server.ws.send({ type: 'full-reload' });
        } catch (error) {
          server.config.logger.error(String((error as Error).message ?? error));
        }
      };
      server.watcher.on('add', regenerate);
      server.watcher.on('change', regenerate);
      server.watcher.on('unlink', regenerate);
    },
  };
}

export default defineConfig(({ isPreview }) => ({
  // The production build emits a real HTML file per route, so `vite preview`
  // must serve directory indexes instead of falling back to the SPA shell.
  appType: isPreview ? 'mpa' : 'spa',
  plugins: [contentPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: false,
  },
  define: {
    // Baked at build time so the server and client markup always agree.
    __BUILD_YEAR__: JSON.stringify(new Date().getUTCFullYear()),
  },
}));
