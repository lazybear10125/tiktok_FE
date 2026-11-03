import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig, transformWithOxc } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@fortawesome')) {
              return 'fontawesome'
            }
            if (id.includes('react') || id.includes('axios')) {
              return 'vendor'
            }
          }
        },
      },
    },
  },
  optimizeDeps: {
    rolldownOptions: {
      moduleTypes: {
        '.js': 'jsx',
      },
    },
  },
  plugins: [
    {
      name: 'treat-js-files-as-jsx',
      enforce: 'pre',
      async transform(code, id) {
        if (!id.replace(/\\/g, '/').includes('/src/')) return null
        if (!id.endsWith('.js')) return null
        return transformWithOxc(code, id, { lang: 'jsx' })
      },
    },
    react(),
  ],
  resolve: {
    alias: [
      { find: '~/components/Layouts', replacement: path.resolve(import.meta.dirname, 'src/components/Layout') },
      { find: '~/pages', replacement: path.resolve(import.meta.dirname, 'src/Pages') },
      { find: '~/routes', replacement: path.resolve(import.meta.dirname, 'src/Routes') },
      { find: '~', replacement: path.resolve(import.meta.dirname, 'src') },
    ],
  },
})
