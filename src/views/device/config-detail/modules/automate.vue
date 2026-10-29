<script setup lang="ts">
import sceneLinkage from '@/views/automation/scene-linkage/modules/dataList.vue'
import EffectiveRules from '@/views/automation/modules/effective-rules.vue'

defineProps<{
  // eslint-disable-next-line vue/prop-name-casing
  config_id: string
}>()
</script>

<template>
  <div class="h-500px flex-col">
    <EffectiveRules :device-config-id="config_id" />
    <sceneLinkage :device_config_id="config_id" back-type="config" />
  </div>
</template>

<style scoped></style>
