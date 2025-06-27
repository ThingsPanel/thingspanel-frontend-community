<script setup lang="ts">
import { useAppStore } from '@/store/modules/app'
import { $t } from '@/locales'

defineOptions({
  name: 'ThemeButton'
})

const appStore = useAppStore()
</script>

<template>
  <ButtonIcon
    icon="majesticons:color-swatch-line"
    :tooltip-content="主题配置"
    @click="appStore.openThemeDrawer"
  />
</template>

<style scoped></style>
