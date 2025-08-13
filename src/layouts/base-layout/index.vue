<script setup lang="ts">
import { computed, h, onMounted } from 'vue'
import { NButton, NIcon } from 'naive-ui'
import { ArrowBack } from '@vicons/ionicons5'
import { AdminLayout, LAYOUT_SCROLL_EL_ID } from '@sa/materials'
import type { LayoutMode } from '@sa/materials'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { useAppStore } from '@/store/modules/app'
import { useThemeStore } from '@/store/modules/theme'
import { useRouteStore } from '@/store/modules/route'
import { localStg } from '@/utils/storage'
import deviceStatusMp3 from '@/assets/audio/device-status.mp3'
import { useRouterPush } from '@/hooks/common/router'
import { useRouter, useRoute } from 'vue-router'
import { createLogger } from '@/utils/logger'
import { $t } from '@/locales'
import GlobalHeader from '../modules/global-header/index.vue'
import GlobalSider from '../modules/global-sider/index.vue'
import GlobalTab from '../modules/global-tab/index.vue'
import GlobalContent from '../modules/global-content/index.vue'
import GlobalFooter from '../modules/global-footer/index.vue'
import ThemeDrawer from '../modules/theme-drawer/index.vue'
import { setupMixMenuContext } from '../hooks/use-mix-menu'
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
let eventSource = null
let tryNum = 0
const createEventSource = () => {
  const token = localStg.get('token')
  eventSource = new EventSourcePolyfill(`${import.meta.env.MODE === 'development' ? '/proxy-default' : ''}/events`, {
    heartbeatTimeout: 3 * 60 * 1000, // 这是自定义配置请求超时时间  默认是4500ms(印象中是)
    headers: {
      'x-token': token
    }
  })
}
onMounted(() => {
  createEventSource()
  if (eventSource) {
    eventSource.onopen = () => {
      tryNum = 0
    }
    eventSource.addEventListener(
      'device_online',
      event => {
        const data = event.data ? JSON.parse(event.data) : {}
        if (data.is_online) {
          window.$notification?.success({
            title: `${data.device_name}${$t('card.deviceConnected')}`,

            duration: 5000,

            action: () =>
              h(
                NButton,
                {
                  text: true,
                  type: 'default',
                  onClick: () => {
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
          window.$notification?.info({
            title: `${data.device_name}${$t('card.deviceDisconnected')}`,

            duration: 5000,
            action: () =>
              h(
                NButton,
                {
                  text: true,
                  type: 'default',
                  onClick: () => {
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
        //         // 创建一个新的Audio对象
        const audio = new Audio(deviceStatusMp3)

        //  // 播放音乐
        audio.play()
      },
      false
    )
    eventSource.onerror = error => {
      logger.error(error)
      eventSource.close()
      if (tryNum < 3) {
        tryNum += 1
        createEventSource()
      }
    }
  }
})
</script>

<template>
  <!-- 移动端布局 -->
  <div v-if="appStore.isMobile" class="mobile-layout">
    <!-- iOS风格头部 -->
    <header class="ios-header">
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
  margin-top: 44px;
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
