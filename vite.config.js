import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig, transformWithOxc } from 'vite'

// https://vite.dev/config/
export default defineConfig({
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
      { find: '~', replacement: path.resolve(import.meta.dirname, 'src') },
    ],
  },
})
