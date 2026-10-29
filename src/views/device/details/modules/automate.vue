<script setup lang="ts">
import NativeAutomationPanel from '@/views/device/shared/native-automation-panel.vue'

defineProps<{ id: string }>()
</script>

<template>
  <NativeAutomationPanel scope="device" :target-id="id" kind="automation" />
</template>
