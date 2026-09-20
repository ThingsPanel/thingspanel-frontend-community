<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'compact' | 'rich'
  }>(),
  {
    variant: 'compact'
  }
)
</script>

<template>
  <div class="thingspanel-card-grid" :class="`thingspanel-card-grid--${variant}`">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.thingspanel-card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;

  :deep(> *) {
    min-width: 0;
  }
}

.thingspanel-card-grid--rich {
  gap: 24px;
}

@media (max-width: 1360px) {
  .thingspanel-card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .thingspanel-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .thingspanel-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
