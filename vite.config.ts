import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** 网关：同一端口通过路径代理到各应用（/ -> 5176 main, /kami2/ -> 5174, /sudoku/ -> 5175） */
export default defineConfig({
  root: __dirname,
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/kami2': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        ws: true,
      },
      '/sudoku': {
        target: 'http://localhost:5175',
        changeOrigin: true,
        ws: true,
      },
      '/': {
        target: 'http://localhost:5176',
        changeOrigin: true,
      },
    },
  },
})
