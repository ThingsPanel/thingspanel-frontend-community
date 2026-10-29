<script setup lang="ts">
import NativeAutomationPanel from '@/views/device/shared/native-automation-panel.vue'

defineProps<{
  // eslint-disable-next-line vue/prop-name-casing
  config_id: string
}>()
</script>

<template>
  <NativeAutomationPanel scope="template" :target-id="config_id" kind="automation" />
</template>
