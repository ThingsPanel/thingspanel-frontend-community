<script setup lang="ts">
import { $t } from '@/locales'
import { useSysSettingStore } from '@/store/modules/sys-setting'

defineOptions({
  name: 'GlobalLogo'
})
const sysSettingStore = useSysSettingStore()

interface Props {
  /** Whether to show the title */
  showTitle?: boolean
}

withDefaults(defineProps<Props>(), {
  showTitle: true
})
</script>

<template>
  <RouterLink to="/" class="w-full flex-center nowrap-hidden">
    <SystemLogo class="text-64px text-primary" />
    <h2 v-show="showTitle" class="pl-8px text-16px text-primary font-bold transition duration-300 ease-in-out">
      {{ sysSettingStore.system_name === '' ? $t('title') : sysSettingStore.system_name }}
    </h2>
  </RouterLink>
</template>

<style scoped></style>
