<script setup lang="ts">
import type { Device } from '@/service/api/device-native'

defineProps<{
  device: Device
  onBack: () => void
  onDetails: () => void
}>()
</script>

<template>
  <n-card title="设备登记结果" :bordered="false">
    <n-alert type="warning" :bordered="false" class="mb-4">
      <template v-if="device.activationState === 'inactive'">设备已登记，尚未完成连接配置。当前状态：未接入。</template>
      <template v-else-if="device.activationState === 'active'">设备已登记，当前状态：已接入。</template>
      <template v-else>设备已登记，接入状态尚未确认。</template>
    </n-alert>
    <n-descriptions bordered :column="1" size="small">
      <n-descriptions-item label="设备名称">{{ device.name }}</n-descriptions-item>
      <n-descriptions-item label="设备编号">{{ device.deviceNumber }}</n-descriptions-item>
      <n-descriptions-item label="设备 ID">{{ device.id }}</n-descriptions-item>
      <n-descriptions-item label="管理状态">{{ device.administrativeState }}</n-descriptions-item>
      <n-descriptions-item label="接入状态">{{ device.activationState }}</n-descriptions-item>
    </n-descriptions>
    <div class="mt-4 flex justify-end gap-2">
      <n-button @click="onBack">返回设备列表</n-button>
      <n-button type="primary" @click="onDetails">查看设备详情</n-button>
    </div>
  </n-card>
</template>
