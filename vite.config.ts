import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      // Base path for production (empty for root, or set to '/app' if needed)
      base: '/',
      
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false, // Disable sourcemaps in production for smaller bundle
        minify: 'esbuild', // Fast minification
        cssMinify: true,
        rollupOptions: {
          output: {
            // Optimize chunk splitting
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'chart-vendor': ['recharts'],
              'dexie-vendor': ['dexie'],
            },
            // Ensure consistent file names for better caching
            chunkFileNames: 'assets/[name]-[hash].js',
            entryFileNames: 'assets/[name]-[hash].js',
            // PWA assets (logo.png, manifest.json, sw.js) must be at root without hashing
            assetFileNames: (assetInfo) => {
              if (!assetInfo.name) {
                return `assets/[name]-[hash].[ext]`;
              }
              const fileName = assetInfo.name;
              // Keep PWA assets at root without hashing for proper manifest resolution
              if (fileName === 'logo.png' || fileName === 'manifest.json' || fileName === 'sw.js' || 
                  fileName.includes('logo.png') || fileName.includes('manifest.json') || fileName.includes('sw.js')) {
                return '[name].[ext]';
              }
              // All other assets go to assets folder with hash
              return `assets/[name]-[hash].[ext]`;
            },
          },
        },
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
      },
      
      plugins: [react()],
      
      define: {
        // SECURITY: Never include API keys in production bundle
        // Only include in development mode for local testing
        'import.meta.env.VITE_GEMINI_API_KEY': isProduction 
          ? JSON.stringify(null) // Never expose in production
          : JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || null),
        'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID),
        // Keep backward compatibility (but null in production)
        'process.env.API_KEY': isProduction ? JSON.stringify(null) : JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || null),
        'process.env.GEMINI_API_KEY': isProduction ? JSON.stringify(null) : JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || null),
        'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID),
        // Production mode flag
        'import.meta.env.PROD': JSON.stringify(isProduction),
        'import.meta.env.DEV': JSON.stringify(!isProduction),
      },
      
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      
      // Optimize dependencies
      optimizeDeps: {
        include: ['react', 'react-dom', 'recharts', 'dexie', 'lucide-react'],
      },
    };
});
