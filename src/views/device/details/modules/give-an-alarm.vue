<script setup lang="ts">
import NativeDeviceAlarms from '@/views/device/shared/native-device-alarms.vue'

defineProps<{ id: string }>()
</script>

<template>
  <NativeDeviceAlarms :device-id="id" />
</template>
