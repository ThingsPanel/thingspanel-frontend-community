<script setup lang="ts">
import { $t } from '@/locales'
defineProps<{
  id: string
}>()
</script>

<template>
  <NCard>
    <div class="h-500px flex-center flex-col">
      <n-empty :description="暂无数据"></n-empty>
    </div>
  </NCard>
</template>

<style scoped></style>
