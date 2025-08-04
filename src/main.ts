import { createApp, watch } from 'vue'
import './plugins/assets'
import { useSysSettingStore } from '@/store/modules/sys-setting'
import { setupDayjs, setupIconifyOffline, setupLoading, setupNProgress } from './plugins'
import { setupStore } from './store'
import { router, setupRouter } from './router'
import { i18n, setupI18n } from './locales'
import { initEChartsComponents } from '@/utils/echarts/echarts-manager'
import App from './App.vue'
// 定义 localStorage 的 key
const RECENTLY_VISITED_ROUTES_KEY = 'RECENTLY_VISITED_ROUTES'
const MAX_RECENT_ROUTES = 8

// --- 更新排除路径列表，支持通配符 ---
const excludedPaths = ['/login/*', '/404', '/home', '/visualization/kanban-details']

// 防抖函数 - 减少频繁的 localStorage 操作
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

// 内存缓存最近访问的路由，减少 localStorage 读取
let recentRoutesCache: any[] | null = null

async function setupApp() {
  const app = createApp(App)

  // 1. 关键同步初始化 - 应用启动必需
  setupStore(app)
  setupI18n(app)
  setupLoading()
  setupNProgress()

  // 2. 系统设置延迟加载 - 避免阻塞应用启动
  const sysSettingStore = useSysSettingStore()

  // 使用 Promise 但不等待，让系统设置并行加载
  sysSettingStore
    .initSysSetting()
    .then(() => {
      // 监听 system_name 的变化，并根据变化动态更新国际化消息
      watch(
        () => sysSettingStore.system_name,
        newSystemName => {
          const locales = i18n.global.availableLocales
          locales.forEach(locale => {
            i18n.global.mergeLocaleMessage(locale, {
              system: {
                title: newSystemName
              }
            })
          })
        },
        { immediate: true }
      )
    })
    .catch(error => {
      console.warn('系统设置加载失败，将使用默认配置:', error)
    })

  // 3. 非关键初始化 - 使用 requestIdleCallback 延迟执行
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(
      () => {
        setupIconifyOffline()
        setupDayjs()
        // ECharts 延迟初始化，减少启动内存占用
        initEChartsComponents()
      },
      { timeout: 2000 }
    )
  } else {
    // 兼容性回退
    setTimeout(() => {
      setupIconifyOffline()
      setupDayjs()
      initEChartsComponents()
    }, 100)
  }

  // 4. 路由初始化 - 应用启动必需
  await setupRouter(app)

  // 防抖保存函数 - 避免频繁的 localStorage 写入
  const debouncedSaveRoutes = debounce((routes: any[]) => {
    try {
      localStorage.setItem(RECENTLY_VISITED_ROUTES_KEY, JSON.stringify(routes))
      recentRoutesCache = routes
    } catch (error) {
      console.error('保存最近访问路由失败:', error)
    }
  }, 1000)

  // 初始化缓存
  try {
    const routesRaw = localStorage.getItem(RECENTLY_VISITED_ROUTES_KEY)
    recentRoutesCache = routesRaw ? JSON.parse(routesRaw) : []
  } catch (error) {
    console.warn('读取最近访问路由失败，使用空数组:', error)
    recentRoutesCache = []
  }

  // 添加路由后置守卫 - 优化版本
  router.afterEach(to => {
    // --- 更新排除逻辑以支持通配符 ---
    const isExcluded = excludedPaths.some(pattern => {
      if (pattern.endsWith('/*')) {
        // 处理通配符模式，确保匹配 /login/ 而不是 /login-other
        const prefix = pattern.slice(0, -1) // /login/
        return to.path.startsWith(prefix)
      } else {
        // 处理精确匹配模式
        return to.path === pattern
      }
    })

    if (isExcluded) {
      return
    }
    // --- 排除逻辑结束 ---

    // 简单过滤掉没有名称或者 title 的路由，以及重定向的路由
    if (!to.name || !to.meta?.title || to.redirectedFrom) {
      return
    }

    // 使用内存缓存避免频繁读取 localStorage
    if (!recentRoutesCache) {
      return
    }

    try {
      // 从内存缓存获取数据，避免 JSON.parse
      let recentRoutes = [...recentRoutesCache]

      // 检查是否已存在相同路由，避免重复添加
      const existingIndex = recentRoutes.findIndex(route => route.path === to.path)
      if (existingIndex === 0) {
        // 如果已经是第一个，直接返回
        return
      }

      // 移除已存在的相同路由
      if (existingIndex > 0) {
        recentRoutes.splice(existingIndex, 1)
      }

      // 添加新路由到列表开头
      const newRoute = {
        path: to.path,
        name: to.name,
        title: to.meta.title,
        i18nKey: to.meta.i18nKey,
        icon: to.meta.icon,
        query: to.query // 保存 query 参数
      }
      
      recentRoutes.unshift(newRoute)

      // 限制列表长度
      if (recentRoutes.length > MAX_RECENT_ROUTES) {
        recentRoutes = recentRoutes.slice(0, MAX_RECENT_ROUTES)
      }

      // 使用防抖保存，减少 localStorage 写入频率
      debouncedSaveRoutes(recentRoutes)
    } catch (error) {
      console.error('处理最近访问路由时出错:', error)
    }
  })

  app.config.globalProperties.getPlatform = () => {
    const { appVersion }: any = window.navigator
    if (['iPhone', 'Android', 'iPad'].includes(appVersion) || window.innerWidth < 680) {
      return true
    }
    return false
  }

  app.mount('#app')
}

setupApp()
