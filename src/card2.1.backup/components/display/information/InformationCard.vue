<template>
  <div class="information-card-placeholder">
    <div class="placeholder-icon">
      <SvgIcon :icon="icon" />
    </div>
    <div class="placeholder-text">{{ text }}</div>
  </div>
</template>

<script setup lang="ts">
import SvgIcon from '@/components/custom/svg-icon.vue'

defineProps<{
  icon: string
  text: string
}>()
</script>

<style scoped>
.information-card-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  background-color: var(--n-color-embedded);
  border: 1px dashed var(--n-border-color);
  border-radius: 4px;
  padding: 16px;
  box-sizing: border-box;
  color: var(--n-text-color-3);
}
.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.placeholder-text {
  font-size: 16px;
  text-align: center;
}
</style>
