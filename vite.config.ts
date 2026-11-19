import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

function excludeDevResourcesFromBuild(): Plugin {
  return {
    name: 'exclude-dev-resources-from-build',
    apply: 'build',
    closeBundle() {
      const aistudioOutDir = path.resolve(__dirname, 'dist', 'assets', 'aistudio');
      const excludedFile = path.join(aistudioOutDir, 'impeccable-main_cb5c32a0.zip');
      if (fs.existsSync(excludedFile)) {
        fs.rmSync(excludedFile, {force: true});
      }
      // Also guard against any other oversized (>24 MiB) AI Studio dev attachment copied from public/
      if (fs.existsSync(aistudioOutDir)) {
        for (const entry of fs.readdirSync(aistudioOutDir)) {
          const fullPath = path.join(aistudioOutDir, entry);
          const stat = fs.statSync(fullPath);
          if (stat.isFile() && stat.size > 24 * 1024 * 1024) {
            fs.rmSync(fullPath, {force: true});
          }
        }
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), excludeDevResourcesFromBuild()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('/motion/') || id.includes('\\motion\\') || id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (
                id.includes('/react/') ||
                id.includes('\\react\\') ||
                id.includes('/react-dom/') ||
                id.includes('\\react-dom\\') ||
                id.includes('/scheduler/') ||
                id.includes('\\scheduler\\')
              ) {
                return 'vendor-react';
              }
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
