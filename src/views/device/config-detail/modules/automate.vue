<script setup lang="ts">
import sceneLinkage from '@/views/automation/scene-linkage/modules/dataList.vue';

defineProps<{
  // eslint-disable-next-line vue/prop-name-casing
  config_id: string;
}>();
</script>

<template>
  <div class="h-500px flex-col">
    <!--      <n-empty :description="$t('common.nodata')"></n-empty>-->
    <sceneLinkage :device_config_id="config_id" />
  </div>
</template>

<style scoped></style>
