<script setup lang="ts">
import InstallationDetail from '../InstallationDetail.vue'

defineProps<{
  id: string
}>()
</script>

<template>
  <InstallationDetail :id="id" />
</template>
