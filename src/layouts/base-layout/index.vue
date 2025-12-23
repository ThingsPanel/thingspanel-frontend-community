<script setup lang="ts">
import { computed, h, onMounted, onUnmounted } from 'vue'
import { NButton, NIcon } from 'naive-ui'
import { ArrowBack } from '@vicons/ionicons5'
import { AdminLayout, LAYOUT_SCROLL_EL_ID } from '@sa/materials'
import type { LayoutMode } from '@sa/materials'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { useAppStore } from '@/store/modules/app'
import { useThemeStore } from '@/store/modules/theme'
import { useRouteStore } from '@/store/modules/route'
import { localStg } from '@/utils/storage'
import { useRouterPush } from '@/hooks/common/router'
import { useRouter, useRoute } from 'vue-router'
import { createLogger } from '@/utils/logger'
import { $t } from '@/locales'
import { getSSEEndpoint } from '~/env.config'
import GlobalHeader from '../modules/global-header/index.vue'
import GlobalSider from '../modules/global-sider/index.vue'
import GlobalTab from '../modules/global-tab/index.vue'
import GlobalContent from '../modules/global-content/index.vue'
import GlobalFooter from '../modules/global-footer/index.vue'
import ThemeDrawer from '../modules/theme-drawer/index.vue'
import { setupMixMenuContext } from '../hooks/use-mix-menu'
import onlineAlert  from '@/assets/audio/online2.wav'
import offLineAlert  from '@/assets/audio/offline.wav'
const logger = createLogger('Layout')

const { routerPushByKey } = useRouterPush()
defineOptions({
  name: 'BaseLayout'
})

const appStore = useAppStore()
const themeStore = useThemeStore()
const routeStore = useRouteStore()
const router = useRouter()
const route = useRoute()

const layoutMode = computed(() => {
  const vertical: LayoutMode = 'vertical'
  const horizontal: LayoutMode = 'horizontal'
  return themeStore.layout.mode.includes(vertical) ? vertical : horizontal
})

const headerPropsConfig: Record<UnionKey.ThemeLayoutMode, App.Global.HeaderProps> = {
  vertical: {
    showLogo: false,
    showMenu: false,
    showMenuToggler: true
  },
  'vertical-mix': {
    showLogo: false,
    showMenu: false,
    showMenuToggler: false
  },
  horizontal: {
    showLogo: true,
    showMenu: true,
    showMenuToggler: false
  },
  'horizontal-mix': {
    showLogo: true,
    showMenu: true,
    showMenuToggler: false
  }
}

const headerProps = computed(() => headerPropsConfig[themeStore.layout.mode])

const siderVisible = computed(() => themeStore.layout.mode !== 'horizontal')

const isVerticalMix = computed(() => themeStore.layout.mode === 'vertical-mix')

const isHorizontalMix = computed(() => themeStore.layout.mode === 'horizontal-mix')

const siderWidth = computed(() => getSiderWidth())

const siderCollapsedWidth = computed(() => getSiderCollapsedWidth())

function getSiderWidth() {
  const { width, mixWidth, mixChildMenuWidth } = themeStore.sider
  let w = isVerticalMix.value || isHorizontalMix.value ? mixWidth : width
  if (isVerticalMix.value && appStore.mixSiderFixed) {
    w += mixChildMenuWidth
  }
  return w
}

function getSiderCollapsedWidth() {
  const { collapsedWidth, mixCollapsedWidth, mixChildMenuWidth } = themeStore.sider
  let w = isVerticalMix.value || isHorizontalMix.value ? mixCollapsedWidth : collapsedWidth

  if (isVerticalMix.value && appStore.mixSiderFixed) {
    w += mixChildMenuWidth
  }
  return w
}

// 移动端动态标题
const mobileTitle = computed(() => {
  // 使用Vue Router的当前路由
  if (route.meta?.i18nKey) {
    return $t(route.meta.i18nKey as string)
  }
  if (route.meta?.title) {
    return route.meta.title as string
  }
  return 'ThingsPanel'
})

// 是否显示返回按钮
const showBackButton = computed(() => {
  // 首页不显示返回按钮
  const noBackRoutes = ['home', 'root', 'login']
  return !noBackRoutes.includes(route.name as string)
})

// 返回功能
function handleBack() {
  router.go(-1)
}

setupMixMenuContext()

/**
 * ===========================================
 * 物联网设备状态实时监控系统 (SSE)
 * ===========================================
 * 
 * 功能说明：
 * 1. 通过Server-Sent Events与后端建立长连接
 * 2. 实时接收设备上线/下线状态变化通知
 * 3. 在全局范围内显示设备状态变化通知
 * 4. 播放音效提醒用户注意设备状态变化
 * 
 * 技术实现：
 * - 使用EventSourcePolyfill确保浏览器兼容性
 * - 自动重连机制处理网络中断
 * - 完整的错误处理和日志记录
 * - 组件销毁时自动清理连接资源
 */

/**
 * ===========================================
 * 全局设备状态监控系统
 * ===========================================
 *
 * 功能说明：
 * 1. 全局设备状态实时监控，覆盖整个应用
 * 2. 当设备上线/下线时，显示通知并播放提示音
 * 3. 提供用户友好的设备状态变化提醒
 * 4. 与页面级监控系统配合，实现完整的状态同步
 *
 * 技术特点：
 * - 显示弹窗通知 + 播放音效（全局提醒）
 * - 智能重连机制，确保连接稳定性
 * - 完整的错误处理和数据验证
 * - 组件卸载时自动清理资源
 * - 网络状态检测和优雅降级
 */

// EventSource 连接实例，用于全局设备状态监控
let eventSource: EventSourcePolyfill | null = null
// 重连尝试次数计数器
let reconnectAttempts = 0
// 最大重连尝试次数限制
const MAX_RECONNECT_ATTEMPTS = 5
// 重连延迟配置（毫秒）- 指数退避策略
const RECONNECT_DELAYS = [2000, 5000, 10000, 20000, 30000]
// 连接状态标识
let isConnecting = false
// 重连定时器
let reconnectTimer: NodeJS.Timeout | null = null
// 最后错误时间，用于避免频繁错误日志
let lastErrorTime = 0
const ERROR_LOG_THROTTLE = 10000 // 10秒内只记录一次相同错误

/**
 * 检查网络连接状态
 */
const checkNetworkStatus = (): boolean => {
  return navigator.onLine !== false
}

/**
 * 节流错误日志记录
 */
const logErrorThrottled = (message: string, error?: any) => {
  const now = Date.now()
  if (now - lastErrorTime > ERROR_LOG_THROTTLE) {
    logger.error(message, error)
    lastErrorTime = now
  }
}

/**
 * 创建全局设备状态监控EventSource连接
 * 建立与后端的实时通信连接，用于接收设备状态变化事件
 */
const createEventSource = () => {
  // 防止重复连接
  if (isConnecting || eventSource?.readyState === EventSource.OPEN) {
    return
  }

  try {
    // 检查网络状态
    if (!checkNetworkStatus()) {
      return
    }

    // 获取用户认证token，用于SSE连接身份验证
    const token = localStg.get('token')
    if (!token) {
      logger.warn('未找到用户token，跳过EventSource连接创建')
      return
    }

    isConnecting = true

    // 清理之前的连接，避免重复连接
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }

    // 清除之前的重连定时器
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    /**
     * 创建EventSource连接
     * 根据环境配置自动选择正确的SSE端点
     */
    eventSource = new EventSourcePolyfill(getSSEEndpoint(import.meta.env), {
      heartbeatTimeout: 3 * 60 * 1000, // 心跳超时时间：3分钟
      headers: {
        'x-token': token // 传递用户认证token
      }
    })
    
    /**
     * 连接成功回调
     * 重置重连计数器，记录连接成功状态
     */
    eventSource.onopen = () => {
      isConnecting = false
      reconnectAttempts = 0
      logger.info('设备状态监控SSE连接建立成功')
    }
    
    /**
     * 监听设备在线状态变化事件
     * 当设备上线或下线时，服务器会推送'device_online'事件
     */
    eventSource.addEventListener(
      'device_online',
      event => {
        try {
          // 数据安全验证：检查事件数据是否存在
          if (!event.data) {
            logger.warn('接收到空的设备状态事件数据')
            return
          }
          
          // 解析JSON格式的设备状态数据
          const data = JSON.parse(event.data)
          
          // 验证设备数据的必要字段
          if (!data.device_name || typeof data.device_name !== 'string') {
            logger.warn('设备状态事件数据无效，缺少有效的设备名称:', data)
            return
          }
          
          /**
           * 根据设备状态显示不同类型的通知
           * is_online: true = 设备上线，false = 设备下线
           */
          if (data.is_online) {
            // 设备上线通知（成功类型，绿色）
            window.$notification?.success({
              title: `${data.device_name}${$t('card.deviceConnected')}`,
              duration: 5000, // 显示5秒
              action: () =>
                h(
                  NButton,
                  {
                    text: true,
                    type: 'default',
                    onClick: () => {
                      // 点击通知跳转到设备详情页
                      routerPushByKey('device_details', {
                        query: {
                          d_id: data.device_id
                        }
                      })
                    }
                  },
                  {
                    default: () => $t('card.toDeviceDetailPage')
                  }
                )
            })
          } else {
            // 设备下线通知（信息类型，蓝色）
            window.$notification?.info({
              title: `${data.device_name}${$t('card.deviceDisconnected')}`,
              duration: 5000, // 显示5秒
              action: () =>
                h(
                  NButton,
                  {
                    text: true,
                    type: 'default',
                    onClick: () => {
                      // 点击通知跳转到设备详情页
                      routerPushByKey('device_details', {
                        query: {
                          d_id: data.device_id
                        }
                      })
                    }
                  },
                  {
                    default: () => $t('card.toDeviceDetailPage')
                  }
                )
            })
          }
          
          /**
           * 播放设备状态变化提示音
           * 使用异步播放，避免阻塞UI线程
           * 处理浏览器自动播放策略限制
           */
          try {

            // 上下线区分提示音
            const audio = new Audio(data.is_online ? onlineAlert : offLineAlert)
            // 设置音频属性以符合浏览器策略
            audio.volume = 0.5 // 设置适中的音量
            audio.preload = 'auto' // 预加载音频
            
            audio.play().catch(audioError => {
              // 静默处理自动播放被阻止的情况，这是正常的浏览器行为
              if (audioError.name === 'NotAllowedError') {
                return
              }
              // 其他音频错误才记录警告
              logger.warn('播放设备状态变化提示音失败:', audioError)
            })
          } catch (audioError) {
            logger.warn('创建音频对象失败:', audioError)
          }
          
        } catch (parseError) {
          logger.error('解析设备状态事件数据失败:', parseError, '原始数据:', event.data)
        }
      },
      false
    )
    
    /**
     * 错误处理和智能重连机制
     */
    eventSource.onerror = (error) => {
      isConnecting = false
      logErrorThrottled('EventSource连接错误:', error)

      // 立即清理当前连接
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }

      // 智能重连：使用预定义的延迟时间
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts += 1
        const delay = RECONNECT_DELAYS[Math.min(reconnectAttempts - 1, RECONNECT_DELAYS.length - 1)]
        
        reconnectTimer = setTimeout(() => {
          if (checkNetworkStatus()) {
            createEventSource()
          } else {
            // 网络不可用时，延长重连间隔
            reconnectTimer = setTimeout(() => {
              createEventSource()
            }, 60000) // 1分钟后重试
          }
        }, delay)
      } else {
        // 达到最大重连次数后，每5分钟尝试一次
        reconnectTimer = setTimeout(() => {
          reconnectAttempts = 0 // 重置计数器
          createEventSource()
        }, 5 * 60 * 1000)
      }
    }
    
  } catch (error) {
    isConnecting = false
    logger.error('创建设备状态监控EventSource连接失败:', error)
  }
}

/**
 * 清理EventSource连接
 * 确保组件销毁时正确释放连接资源，避免内存泄漏
 */
const cleanupEventSource = () => {
  // 清理EventSource连接
  if (eventSource) {
    eventSource.close()
    eventSource = null
    logger.info('设备状态监控SSE连接已清理')
  }
  
  // 清理重连定时器
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  
  // 重置状态
  isConnecting = false
  reconnectAttempts = 0
}

/**
 * 组件挂载时建立设备状态监控连接
 * 在用户进入系统后立即开始监控设备状态变化
 */
onMounted(() => {
  // createEventSource()
})

/**
 * 组件卸载时清理连接
 * 确保用户离开或组件销毁时正确清理资源
 */
onUnmounted(() => {
  // cleanupEventSource()
})
</script>

<template>
  <!-- 移动端布局 -->
  <div v-if="appStore.isMobile" class="mobile-layout">
    <!-- iOS风格头部 -->
    <header v-if="0" class="ios-header">
      <!-- 返回按钮 -->
      <div 
        v-if="showBackButton" 
        class="ios-back-btn" 
        @click="handleBack"
      >
        <NIcon size="20">
          <ArrowBack />
        </NIcon>
      </div>
      
      <!-- 标题 -->
      <h1 class="ios-title">{{ mobileTitle }}</h1>
    </header>

    <!-- 主内容区域 -->
    <main :id="LAYOUT_SCROLL_EL_ID" class="mobile-main">
      <GlobalContent :show-padding="true" />
    </main>

    <ThemeDrawer />
  </div>

  <!-- 桌面端布局 -->
  <AdminLayout
    v-else
    v-model:sider-collapse="appStore.siderCollapse"
    :mode="layoutMode"
    :scroll-el-id="LAYOUT_SCROLL_EL_ID"
    :scroll-mode="themeStore.layout.scrollMode"
    :is-mobile="appStore.isMobile"
    :full-content="appStore.fullContent"
    :fixed-top="themeStore.fixedHeaderAndTab"
    :header-height="themeStore.header.height"
    :tab-visible="themeStore.tab.visible"
    :tab-height="themeStore.tab.height"
    :content-class="appStore.contentXScrollable ? 'overflow-x-hidden' : ''"
    :sider-visible="siderVisible"
    :sider-width="siderWidth"
    :sider-collapsed-width="siderCollapsedWidth"
    :footer-visible="themeStore.footer.visible"
    :fixed-footer="themeStore.footer.fixed"
    :right-footer="themeStore.footer.right"
  >
    <template #header>
      <GlobalHeader v-bind="headerProps" />
    </template>
    <template #tab>
      <GlobalTab />
    </template>
    <template #sider>
      <GlobalSider />
    </template>
    <GlobalContent />
    <ThemeDrawer />
    <template #footer>
      <GlobalFooter />
    </template>
  </AdminLayout>
</template>

<style lang="scss">
#__SCROLL_EL_ID__ {
  @include scrollbar();
}

// 移动端布局样式
.mobile-layout {
  @apply h-screen flex flex-col bg-layout;
}

// iOS风格头部
.ios-header {
  @apply fixed top-0 left-0 right-0 z-50 relative;
  height: 44px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);

  .ios-back-btn {
    @apply absolute left-0 top-0 h-full flex items-center justify-center;
    width: 44px;
    background: none;
    border: none;
    color: #007AFF;
    cursor: pointer;
    padding: 0;
    z-index: 10;
    pointer-events: auto;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.6;
    }

    &:active {
      opacity: 0.3;
    }

    // 确保触摸区域足够大
    &::before {
      content: '';
      position: absolute;
      top: -10px;
      left: -10px;
      right: -10px;
      bottom: -10px;
      background: transparent;
    }
  }

  .ios-title {
    @apply absolute inset-0 flex items-center justify-center;
    font-size: 17px;
    font-weight: 600;
    color: #000;
    margin: 0;
    // 为返回按钮留出空间
    padding: 0 44px;
  }
}

.mobile-main {
  @apply flex-1 overflow-auto;

  @include scrollbar();
}

// 深色模式支持
[data-theme='dark'] {
  .ios-header {
    background: rgba(0, 0, 0, 0.8);
    border-bottom: 0.5px solid rgba(255, 255, 255, 0.1);
    
    .ios-back-btn {
      color: #0A84FF;
    }
    
    .ios-title {
      color: #fff;
    }
  }
}
</style>
