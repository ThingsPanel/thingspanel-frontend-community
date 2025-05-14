<template>
  <div class="automatic-mode-step-content">
        11111111111
  </div>
</template>

<script setup lang="ts">
import { $t } from '@/locales';

const props = defineProps({
  accessPointName: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    default: 'automatic'
  }
});
</script>

<style scoped lang="scss">
.automatic-mode-step-content {
  padding: 20px;
}
</style> 