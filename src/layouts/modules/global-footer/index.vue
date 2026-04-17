<script setup lang="ts">
import { $t } from '@/locales'
import useVersionInfo from '@/hooks/business/use-version-info'
import { useSysSettingStore } from '@/store/modules/sys-setting'

defineOptions({
  name: 'GlobalFooter'
})

const sysSettingStore = useSysSettingStore()
const { currentVersion, latestVersion } = useVersionInfo()
</script>

<template>
  <DarkModeContainer class="h-full flex-center">
    <div class="flex flex-wrap items-center justify-center gap-x-2 text-center text-xs text-[var(--n-text-color)]">
      <a
        href="https://github.com/ThingsPanel/thingspanel-ui/blob/main/LICENSE"
        target="_blank"
        rel="noopener noreferrer"
      >
        Copyright &copy; 2024 {{ sysSettingStore.system_name }}
      </a>
      <span>|</span>
      <span>{{ $t('card.versionInfo.currentVersion') }} {{ currentVersion }}</span>
      <span>|</span>
      <span>{{ $t('card.versionInfo.latestVersion') }}{{ latestVersion }}</span>
    </div>
  </DarkModeContainer>
</template>

<style scoped></style>
