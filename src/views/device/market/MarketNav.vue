<script setup lang="ts">
/**
 * MarketNav - 市场导航组件
 *
 * 用于设备市场模块的页面导航
 */
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NSpace, NButton, NIcon } from 'naive-ui'
import { GridOutline, CloudDownloadOutline } from '@vicons/ionicons5'
import { $t } from '@/locales'

// ========== Router ==========

const router = useRouter()
const route = useRoute()

// ========== State ==========

/** 导航项 */
const navItems = computed(() => [
  {
    key: 'browse',
    label: $t('market.nav.browse'),
    path: '/device/market/browse',
    icon: GridOutline,
    routeName: 'device_market-browse'
  },
  {
    key: 'installed',
    label: $t('market.nav.installed'),
    path: '/device/market/installed',
    icon: CloudDownloadOutline,
    routeName: 'device_market-installed'
  }
])

// ========== Computed ==========

/** 当前激活的导航项 */
const activeKey = computed(() => {
  const path = route.path
  const item = navItems.value.find(item => path.startsWith(item.path))
  return item?.key || 'browse'
})

// ========== Methods ==========

/**
 * 跳转到导航项
 */
function navigateTo(item: (typeof navItems.value)[0]) {
  router.push({ name: item.routeName })
}

/**
 * 是否激活
 */
function isActive(key: string): boolean {
  return activeKey.value === key
}
</script>

<template>
  <div class="market-nav">
    <div class="nav-container">
      <div class="nav-title">
        <NIcon size="20" color="#18a058">
          <GridOutline />
        </NIcon>
        <span>{{ $t('market.nav.title') }}</span>
      </div>

      <NSpace class="nav-items">
        <NButton
          v-for="item in navItems"
          :key="item.key"
          :type="isActive(item.key) ? 'primary' : 'default'"
          :quaternary="!isActive(item.key)"
          @click="navigateTo(item)"
        >
          <template #icon>
            <NIcon><component :is="item.icon" /></NIcon>
          </template>
          {{ item.label }}
        </NButton>
      </NSpace>
    </div>
  </div>
</template>

<style scoped lang="scss">
.market-nav {
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 24px;
  margin-bottom: 24px;
}

.nav-container {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  padding: 16px 0;
}

.nav-items {
  display: flex;
  gap: 8px;
}
</style>
