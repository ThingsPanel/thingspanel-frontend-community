<script setup lang="ts">
import sceneLinkage from '@/views/automation/scene-linkage/modules/dataList.vue'
import EffectiveRules from '@/views/automation/modules/effective-rules.vue'

defineProps<{
  id: string
}>()
</script>

<template>
  <div>
    <!-- What actually applies to this device, including rules inherited from its
         template. The list below stays the same editable list it always was. -->
    <EffectiveRules :device-id="id" />
    <sceneLinkage :device_id="id" back-type="device" />
  </div>
</template>

<style scoped></style>
