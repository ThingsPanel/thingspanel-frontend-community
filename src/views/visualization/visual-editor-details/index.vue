<script setup lang="ts">
import { useRoute } from 'vue-router'
import PanelEditor from '@/components/visual-editor/PanelEditor.vue'

const route = useRoute()

const panel_id = (route.query.id as string) || 'fb368f9b-dc2b-ef3e-d444-f304b9f8cf8b'
</script>

<template>
  <PanelEditor :panel-id="panel_id" />
</template>

<style scoped></style>
