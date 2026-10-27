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
  <RouterLink
    to="/"
    class="global-logo w-full flex items-center nowrap-hidden"
    :class="{ 'global-logo--collapsed': !showTitle }"
    :aria-label="sysSettingStore.system_name || $t('title')"
  >
    <div class="logo-box">
      <SystemLogo width="32" />
      <div v-show="showTitle" class="pl-8px">
        <n-ellipsis
          style="max-width: 150px"
          class="text-16px text-primary font-bold transition duration-300 ease-in-out"
        >
          {{ sysSettingStore.system_name === '' ? $t('title') : sysSettingStore.system_name }}
        </n-ellipsis>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.global-logo {
  box-sizing: border-box;
  padding-inline: 12px;
}

.global-logo--collapsed {
  justify-content: center;
  padding-inline: 0;
}

.logo-box {
  display: flex;
  align-items: center;
}
</style>
