import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// The production bundle never consumes preview configuration or a remote origin.
export default defineConfig(({ command }) => {
  const target = command === 'serve' ? process.env.MP_DEVICE_PREVIEW_TARGET : undefined
  let proxy
  if (target) {
    const remote = new URL(target)
    if (!['https:', 'http:'].includes(remote.protocol) || remote.username || remote.password ||
      remote.search || remote.hash || remote.pathname !== '/') throw new Error('Invalid preview origin')
    proxy = Object.fromEntries([
      '/api/v1', '/api/v2', '/thingsvis-api', '/main', '/static', '/widgets', '/registry.json', '/files', '/uploads'
    ].map(path => [path, { target: remote.origin, changeOrigin: true, ws: true }]))
  }
  return {
    root: fileURLToPath(new URL('../', import.meta.url)),
    plugins: [vue()],
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    server: { host: '127.0.0.1', port: 5188, strictPort: true, proxy },
    build: {
      outDir: 'dist-mp-device-preview',
      rollupOptions: { input: fileURLToPath(new URL('../mp-device/index.html', import.meta.url)) }
    }
  }
})
