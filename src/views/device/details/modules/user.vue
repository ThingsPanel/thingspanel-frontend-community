<script setup lang="ts">
import { $t } from '@/locales';
defineProps<{
  id: string;
}>();
</script>

<template>
  <NCard>
    <div class="h-500px flex-center flex-col">
      <n-empty :description="$t('common.nodata')"></n-empty>
    </div>
  </NCard>
</template>

<style scoped></style>
