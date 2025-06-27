<script setup lang="ts">
import { computed } from 'vue'
import { $t } from '@/locales'
import { useThemeStore } from '@/store/modules/theme'
import { themePageAnimationModeOptions, themeScrollModeOptions, themeTabModeOptions } from '@/constants/app'
import { translateOptions } from '@/utils/common4'
import SettingItem from '../components/setting-item.vue'

defineOptions({
  name: 'PageFun'
})

const themeStore = useThemeStore()

const layoutMode = computed(() => themeStore.layout.mode)

const isMixLayoutMode = computed(() => layoutMode.value.includes('mix'))

const isWrapperScrollMode = computed(() => themeStore.layout.scrollMode === 'wrapper')
</script>

<template>
  <NDivider>{{ "页面功能" }}</NDivider>
  <TransitionGroup tag="div" name="setting-list" class="flex-vertical-stretch gap-12px">
    <SettingItem key="1" :label="滚动模式">
      <NSelect
        v-model:value="themeStore.layout.scrollMode"
        :options="translateOptions(themeScrollModeOptions)"
        size="small"
        class="w-120px"
      ></NSelect>
    </SettingItem>
    <SettingItem key="1-1" :label="页面切换动画">
      <NSwitch v-model:value="themeStore.page.animate" />
    </SettingItem>
    <SettingItem v-if="themeStore.page.animate" key="1-2" :label="页面切换动画类型">
      <NSelect
        v-model:value="themeStore.page.animateMode"
        :options="translateOptions(themePageAnimationModeOptions)"
        size="small"
        class="w-120px"
      />
    </SettingItem>
    <SettingItem v-if="isWrapperScrollMode" key="2" :label="固定头部和标签栏">
      <NSwitch v-model:value="themeStore.fixedHeaderAndTab" />
    </SettingItem>
    <SettingItem key="3" :label="头部高度">
      <NInputNumber v-model:value="themeStore.header.height" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem key="4" :label="显示面包屑">
      <NSwitch v-model:value="themeStore.header.breadcrumb.visible" />
    </SettingItem>
    <SettingItem v-if="themeStore.header.breadcrumb.visible" key="4-1" :label="显示面包屑图标">
      <NSwitch v-model:value="themeStore.header.breadcrumb.showIcon" />
    </SettingItem>
    <SettingItem key="5" :label="显示标签栏">
      <NSwitch v-model:value="themeStore.tab.visible" />
    </SettingItem>
    <SettingItem v-if="themeStore.tab.visible" key="5-1" :label="缓存标签页">
      <NSwitch v-model:value="themeStore.tab.cache" />
    </SettingItem>
    <SettingItem v-if="themeStore.tab.visible" key="5-2" :label="标签栏高度">
      <NInputNumber v-model:value="themeStore.tab.height" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem v-if="themeStore.tab.visible" key="5-3" :label="标签栏风格">
      <NSelect
        v-model:value="themeStore.tab.mode"
        :options="translateOptions(themeTabModeOptions)"
        size="small"
        class="w-120px"
      />
    </SettingItem>
    <SettingItem v-if="layoutMode === 'vertical'" key="6-1" :label="侧边栏宽度">
      <NInputNumber v-model:value="themeStore.sider.width" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem v-if="layoutMode === 'vertical'" key="6-2" :label="侧边栏折叠宽度">
      <NInputNumber v-model:value="themeStore.sider.collapsedWidth" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem v-if="isMixLayoutMode" key="6-3" :label="混合布局侧边栏宽度">
      <NInputNumber v-model:value="themeStore.sider.mixWidth" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem v-if="isMixLayoutMode" key="6-4" :label="混合布局侧边栏折叠宽度">
      <NInputNumber v-model:value="themeStore.sider.mixCollapsedWidth" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem v-if="layoutMode === 'vertical-mix'" key="6-5" :label="混合布局子菜单宽度">
      <NInputNumber v-model:value="themeStore.sider.mixChildMenuWidth" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem key="7" :label="显示底部">
      <NSwitch v-model:value="themeStore.footer.visible" />
    </SettingItem>
    <SettingItem v-if="themeStore.footer.visible && isWrapperScrollMode" key="7-1" :label="固定底部">
      <NSwitch v-model:value="themeStore.footer.fixed" />
    </SettingItem>
    <SettingItem v-if="themeStore.footer.visible" key="7-2" :label="底部高度">
      <NInputNumber v-model:value="themeStore.footer.height" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem
      v-if="themeStore.footer.visible && layoutMode === 'horizontal-mix'"
      key="7-3"
      :label="底部局右"
    >
      <NSwitch v-model:value="themeStore.footer.right" />
    </SettingItem>
  </TransitionGroup>
</template>

<style scoped>
.setting-list-move,
.setting-list-enter-active,
.setting-list-leave-active {
  transition: all 0.3s ease-in-out;
}

.setting-list-enter-from,
.setting-list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.setting-list-leave-active {
  position: absolute;
}
</style>
