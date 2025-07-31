<!--
  GridPro 渲染器专用工具栏
  遵循工具栏分离原则，独立于渲染器组件
-->
<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NButtonGroup, NDropdown, NTooltip } from 'naive-ui'
import { useThemeVars } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import {
  ContractOutline as CompactIcon,
  GridOutline as GridIcon,
  RefreshOutline as RefreshIcon,
  LayersOutline as LayersIcon,
  AppsOutline as LayoutIcon,
  SpeedometerOutline as SpeedIcon,
  ChevronDownOutline as ChevronDownIcon
} from '@vicons/ionicons5'

import type { GridProConfig } from './types/gridpro'

interface Props {
  config: GridProConfig
  readonly?: boolean
}

interface Emits {
  (e: 'config-update', config: Partial<GridProConfig>): void
  (e: 'compact-layout'): void
  (e: 'reset-layout'): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<Emits>()

// 国际化和主题
const { t } = useI18n()
const themeVars = useThemeVars()

// 布局模式选项
const layoutModeOptions = computed(() => [
  {
    label: t('gridpro.layoutMode.compact', 'Compact'),
    key: 'compact'
  },
  {
    label: t('gridpro.layoutMode.relaxed', 'Relaxed'),
    key: 'relaxed'
  },
  {
    label: t('gridpro.layoutMode.free', 'Free'),
    key: 'free'
  }
])

// 动画速度选项
const animationSpeedOptions = computed(() => [
  {
    label: t('gridpro.animationSpeed.slow', 'Slow'),
    key: 'slow'
  },
  {
    label: t('gridpro.animationSpeed.normal', 'Normal'),
    key: 'normal'
  },
  {
    label: t('gridpro.animationSpeed.fast', 'Fast'),
    key: 'fast'
  }
])

// 主题样式变量
const toolbarStyles = computed(() => ({
  '--toolbar-bg': themeVars.value.bodyColor,
  '--toolbar-border': themeVars.value.dividerColor,
  '--button-color': themeVars.value.textColor2
}))

// 事件处理器
const handleCompactLayout = () => {
  emit('compact-layout')
}

const handleToggleGrid = () => {
  emit('config-update', { showGrid: !props.config.showGrid })
}

const handleResetLayout = () => {
  emit('reset-layout')
}

const handleToggleVirtualization = () => {
  emit('config-update', { 
    virtualization: { 
      ...props.config.virtualization,
      enabled: !props.config.virtualization?.enabled 
    }
  })
}

const handleLayoutModeChange = (key: string) => {
  emit('config-update', { layoutMode: key as GridProConfig['layoutMode'] })
}

const handleAnimationSpeedChange = (key: string) => {
  emit('config-update', { animationSpeed: key as GridProConfig['animationSpeed'] })
}
</script>

<template>
  <div class="gridpro-toolbar" :style="toolbarStyles">
    <div class="gridpro-toolbar__left">
      <n-button-group size="small">
        <n-tooltip trigger="hover" :delay="1000">
          <template #trigger>
            <n-button 
              :disabled="readonly"
              @click="handleCompactLayout"
            >
              <template #icon>
                <CompactIcon />
              </template>
              {{ t('gridpro.compact', 'Compact') }}
            </n-button>
          </template>
          {{ t('gridpro.compactTip', 'Automatically arrange items compactly') }}
        </n-tooltip>

        <n-tooltip trigger="hover" :delay="1000">
          <template #trigger>
            <n-button 
              :disabled="readonly"
              @click="handleToggleGrid"
            >
              <template #icon>
                <GridIcon />
              </template>
              {{ config.showGrid ? t('gridpro.hideGrid', 'Hide Grid') : t('gridpro.showGrid', 'Show Grid') }}
            </n-button>
          </template>
          {{ t('gridpro.gridTip', 'Toggle grid visibility') }}
        </n-tooltip>

        <n-tooltip trigger="hover" :delay="1000">
          <template #trigger>
            <n-button 
              :disabled="readonly"
              @click="handleResetLayout"
            >
              <template #icon>
                <RefreshIcon />
              </template>
              {{ t('gridpro.reset', 'Reset') }}
            </n-button>
          </template>
          {{ t('gridpro.resetTip', 'Reset layout to default') }}
        </n-tooltip>
      </n-button-group>
    </div>

    <div class="gridpro-toolbar__right">
      <n-button-group size="small">
        <n-tooltip trigger="hover" :delay="1000">
          <template #trigger>
            <n-button 
              :disabled="readonly"
              @click="handleToggleVirtualization"
            >
              <template #icon>
                <LayersIcon />
              </template>
              {{ config.virtualization?.enabled ? t('gridpro.disableVirtualization', 'Disable Virtualization') : t('gridpro.enableVirtualization', 'Enable Virtualization') }}
            </n-button>
          </template>
          {{ t('gridpro.virtualizationTip', 'Toggle virtualization for better performance') }}
        </n-tooltip>

        <n-dropdown 
          trigger="click" 
          :options="layoutModeOptions" 
          :disabled="readonly"
          @select="handleLayoutModeChange"
        >
          <n-button>
            <template #icon>
              <LayoutIcon />
            </template>
            {{ t(`gridpro.layoutMode.${config.layoutMode}`, config.layoutMode) }}
            <template #suffix>
              <ChevronDownIcon />
            </template>
          </n-button>
        </n-dropdown>

        <n-dropdown 
          trigger="click" 
          :options="animationSpeedOptions" 
          :disabled="readonly"
          @select="handleAnimationSpeedChange"
        >
          <n-button>
            <template #icon>
              <SpeedIcon />
            </template>
            {{ t(`gridpro.animationSpeed.${config.animationSpeed}`, config.animationSpeed) }}
            <template #suffix>
              <ChevronDownIcon />
            </template>
          </n-button>
        </n-dropdown>
      </n-button-group>
    </div>
  </div>
</template>

<style scoped>
.gridpro-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--toolbar-bg);
  border-bottom: 1px solid var(--toolbar-border);
  height: 48px;
  flex-shrink: 0;
}

.gridpro-toolbar__left,
.gridpro-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gridpro-toolbar {
    padding: 8px 12px;
    height: 44px;
  }

  .gridpro-toolbar__left,
  .gridpro-toolbar__right {
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .gridpro-toolbar {
    flex-direction: column;
    height: auto;
    padding: 8px;
    gap: 8px;
  }

  .gridpro-toolbar__left,
  .gridpro-toolbar__right {
    width: 100%;
    justify-content: center;
  }
}
</style>