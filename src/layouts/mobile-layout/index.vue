<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NIcon } from 'naive-ui'
import { LAYOUT_SCROLL_EL_ID } from '@sa/materials'
import { useAppStore } from '@/store/modules/app'
import { useRouteStore } from '@/store/modules/route'
import { useRouterPush } from '@/hooks/common/router'
import GlobalContent from '../modules/global-content/index.vue'
import GlobalLogo from '../modules/global-logo/index.vue'
import UserAvatar from '../modules/global-header/components/user-avatar.vue'

defineOptions({
  name: 'MobileLayout'
})

const appStore = useAppStore()
const routeStore = useRouteStore()
const { routerPushByKey } = useRouterPush()

// 移动端主要菜单项
const mobileMenus = computed(() => {
  const mainMenus = routeStore.menus.filter(menu => {
    // 过滤出主要的一级菜单项，适合在底部导航显示
    return ['home', 'device', 'dashboard', 'visualization'].includes(menu.routeKey as string)
  })
  return mainMenus.slice(0, 4) // 最多显示4个主要菜单
})

const currentRoute = computed(() => routeStore.currentRoute)

function handleMenuClick(menu: any) {
  routerPushByKey(menu.routeKey)
}

// 获取图标组件
function getIconComponent(iconString: string) {
  // 这里可以根据图标字符串返回对应的图标组件
  // 简化处理，直接返回图标字符串
  return iconString
}
</script>

<template>
  <div class="mobile-layout">
    <!-- 移动端头部 -->
    <header class="mobile-header">
      <div class="header-content">
        <GlobalLogo class="logo" />
        <h1 class="title">ThingsPanel</h1>
        <UserAvatar class="avatar" />
      </div>
    </header>

    <!-- 主内容区域 -->
    <main :id="LAYOUT_SCROLL_EL_ID" class="mobile-main">
      <GlobalContent :show-padding="true" />
    </main>

    <!-- 移动端底部导航 -->
    <nav class="mobile-bottom-nav">
      <div class="nav-items">
        <div
          v-for="menu in mobileMenus"
          :key="menu.routeKey"
          class="nav-item"
          :class="{ active: currentRoute?.name === menu.routeKey }"
          @click="handleMenuClick(menu)"
        >
          <div class="nav-icon">
            <NIcon :component="getIconComponent(menu.icon)" />
          </div>
          <span class="nav-text">{{ menu.label }}</span>
        </div>
      </div>
    </nav>
  </div>
</template>

<style lang="scss" scoped>
.mobile-layout {
  @apply h-screen flex flex-col bg-layout;
}

.mobile-header {
  @apply fixed top-0 left-0 right-0 z-50 bg-white shadow-sm;
  height: 60px;

  .header-content {
    @apply h-full flex items-center justify-between px-4;
  }

  .logo {
    @apply h-8 w-8;
  }

  .title {
    @apply text-lg font-medium text-text flex-1 ml-3;
  }

  .avatar {
    @apply ml-auto;
  }
}

.mobile-main {
  @apply flex-1 overflow-auto;
  margin-top: 60px;
  margin-bottom: 70px;
  @include scrollbar();
}

.mobile-bottom-nav {
  @apply fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50;
  height: 70px;

  .nav-items {
    @apply h-full flex items-center justify-around;
  }

  .nav-item {
    @apply flex flex-col items-center justify-center cursor-pointer transition-colors;
    min-width: 60px;
    padding: 8px 12px;

    &:hover {
      @apply text-primary;
    }

    &.active {
      @apply text-primary;

      .nav-icon {
        @apply text-primary;
      }
    }

    .nav-icon {
      @apply text-lg mb-1 transition-colors;
    }

    .nav-text {
      @apply text-xs;
    }
  }
}

// 深色模式支持
[data-theme='dark'] {
  .mobile-header,
  .mobile-bottom-nav {
    @apply bg-container border-border-dark;
  }
}
</style>
</style>