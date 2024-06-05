<script lang="ts" setup>
import { BottomPart, DataCard, TopChart } from './components';
</script>

<template>
  <NSpace :vertical="true" :size="16">
    <TopChart />
    <DataCard />
    <BottomPart />
  </NSpace>
</template>

<style scoped></style>
