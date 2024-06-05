<script lang="ts" setup>
import { WorkbenchHeader, WorkbenchMain } from './components';
</script>

<template>
  <NSpace :vertical="true" :size="16">
    <WorkbenchHeader />
    <WorkbenchMain />
  </NSpace>
</template>

<style scoped></style>
