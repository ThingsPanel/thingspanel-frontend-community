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
  <RouterLink to="/" class="w-full flex items-center nowrap-hidden ml-3">
    <SystemLogo width="64" class="text-64px text-primary" />
    <div
      v-show="showTitle"
      class="pl-8px mt-2"
    >
      <n-ellipsis
        style="max-width: 150px"
        class="text-18px text-primary font-bold transition duration-300 ease-in-out"
      >
        {{ sysSettingStore.system_name === '' ? $t('title') : sysSettingStore.system_name }}
      </n-ellipsis>
    </div>
  </RouterLink>
</template>

<style scoped></style>
