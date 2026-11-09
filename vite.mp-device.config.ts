import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Local preview only. Production uses vite.config.ts and the same-origin gateway.
const target = process.env.MP_DEVICE_PREVIEW_TARGET || 'https://demo.thingspanel.cn'
const remote = new URL(target)
if (
  !['https:', 'http:'].includes(remote.protocol) ||
  remote.username ||
  remote.password ||
  remote.search ||
  remote.hash ||
  remote.pathname !== '/'
)
  throw new Error('Invalid preview origin')
export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    host: '127.0.0.1',
    port: 5188,
    strictPort: true,
    proxy: Object.fromEntries(
      [
        '/api/v1',
        '/api/v2',
        '/thingsvis-api',
        '/main',
        '/static',
        '/widgets',
        '/registry.json',
        '/files',
        '/uploads'
      ].map(path => [path, { target: remote.origin, changeOrigin: true, ws: true }])
    )
  },
  build: {
    outDir: 'dist-mp-device-preview',
    rollupOptions: { input: fileURLToPath(new URL('./mp-device/index.html', import.meta.url)) }
  }
})
