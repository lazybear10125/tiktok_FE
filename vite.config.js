import react from '@vitejs/plugin-react'
import { defineConfig, transformWithOxc } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'treat-js-files-as-jsx',
      enforce: 'pre',
      async transform(code, id) {
        if (!id.match(/src\/.*\.js$/)) return null
        return transformWithOxc(code, id, { lang: 'jsx' })
      },
    },
    react(),
  ],
})
