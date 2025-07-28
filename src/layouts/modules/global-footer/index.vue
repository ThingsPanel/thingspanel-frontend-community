<script setup lang="ts">
import { useSysSettingStore } from '@/store/modules/sys-setting'
defineOptions({
  name: 'GlobalFooter'
})
const sysSettingStore = useSysSettingStore()
</script>

<template>
  <DarkModeContainer class="h-full flex-center">
    <a href="https://github.com/ThingsPanel/thingspanel-ui/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">
      Copyright © 2024 {{ sysSettingStore.system_name }}
    </a>
  </DarkModeContainer>
</template>

<style scoped></style>
