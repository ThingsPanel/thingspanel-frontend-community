<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();

const panel_id = route.query.id as string;
</script>

<template>
  <PanelManage :panel-id="panel_id" />
</template>

<style scoped></style>
