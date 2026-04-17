import process from 'node:process'
import { URL, fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import dayjs from 'dayjs'
import svgLoader from 'vite-svg-loader'
import { setupVitePlugins } from './build/plugins'
import { createViteProxy } from './build/config'

export default defineConfig(configEnv => {
  const viteEnv = loadEnv(configEnv.mode, process.cwd()) as unknown as Env.ImportMeta

  const buildTime = dayjs().format('YYYY-MM-DD HH:mm:ss')

  return {
    base: viteEnv.VITE_BASE_URL,
    resolve: {
      alias: {
        '~': fileURLToPath(new URL('./', import.meta.url)),
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        './src/utils/Logger.ts': './src/utils/Logger.ts'
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "./src/styles/scss/global.scss" as *;`
        }
      }
    },
    plugins: [...setupVitePlugins(viteEnv), svgLoader()],
    server: {
      host: '0.0.0.0',
      port: 5002,
      open: true,
      proxy: createViteProxy(viteEnv),
      fs: {
        cachedChecks: false
      },
      watch: {
        // 开启轮询模式
        usePolling: true
      }
    },
    preview: {
      port: 9725
    },
    build: {
      // 提高块大小警告阈值
      chunkSizeWarningLimit: 4000,
      sourcemap: false,
      reportCompressedSize: false,
      // sourcemap: viteEnv.VITE_SOURCE_MAP === 'Y',
      commonjsOptions: {
        ignoreTryCatch: false
      },
      // 内存优化配置
      rollupOptions: {
        // 限制并行处理数量以减少内存使用
        maxParallelFileOps: 2,
        output: {
          // 手动分包以减少单个包的大小
          manualChunks: {
            // 将大型第三方库分离
            'vendor-vue': ['vue', 'vue-router', 'pinia'],
            'vendor-ui': ['naive-ui'],
            'vendor-charts': ['@antv/g2', '@antv/data-set'],
            'vendor-utils': ['dayjs', 'lodash-es']
          }
        }
      }
    },
    define: {
      BUILD_TIME: JSON.stringify(buildTime)
    },
    lintOnSave: false
  }
})
