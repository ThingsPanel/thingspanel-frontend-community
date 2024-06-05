<script setup lang="ts">
defineOptions({ name: 'DashboardWorkbenchMainShortcutsCard' });

interface Props {
  /** 快捷操作名称 */
  label: string;
  /** 图标 */
  icon: string;
  /** 图标颜色 */
  iconColor: string;
}

defineProps<Props>();
</script>

<template>
  <div
    class="h-120px flex-col-center cursor-pointer border-1px border-#efeff5 rounded-4px p-12px dark:border-#ffffff17 hover:shadow-sm"
  >
    <SvgIcon :icon="icon" :style="{ color: iconColor }" class="text-30px" />
    <p class="py-8px text-16px">{{ label }}</p>
  </div>
</template>

<style scoped></style>
