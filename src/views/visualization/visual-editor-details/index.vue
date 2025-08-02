<script setup lang="ts">
import { useRoute } from 'vue-router'
import PanelEditor from '@/components/visual-editor/PanelEditor.vue'

const route = useRoute()

const panel_id = route.query.id as string || 'd97cd749-bee7-7f34-148a-37872bc8594b'
</script>

<template>
  <PanelEditor :panel-id="panel_id" />
</template>

<style scoped></style>