<script lang="ts" setup>
import { useSysSettingStore } from '@/store/modules/sys-setting'
defineOptions({ name: 'SystemLogo' })
const sysSettingStore = useSysSettingStore()
const defaultLogo = import.meta.env.VITE_BRAND_LOGO_URL || `${import.meta.env.BASE_URL}brand/ygsoul-cloud-logo-v2.png`
export interface Props {
  width: string
}

withDefaults(defineProps<Props>(), {
  width: '40'
})
</script>

<template>
  <!-- <IconLocalLogo /> -->
  <div :style="{ height: width + 'rpx' }">
    <!--  v-if="sysSettingStore.logo_background"  -->
    <!-- {{sysSettingStore  }} -->
    <n-image
      :width="width"
      :src="sysSettingStore.logo_background === '' ? defaultLogo : sysSettingStore.logo_background"
    />
    <!-- <v-else icon-local-logo /> -->
  </div>
</template>

<style scoped></style>
