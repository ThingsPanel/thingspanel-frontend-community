<script setup lang="ts">
import { useRoute } from 'vue-router'
import PanelEditor from '@/components/visual-editor/PanelEditor.vue'

const route = useRoute()

const panel_id = (route.query.id as string) || '72da0887-52f9-b546-27ce-e4c06ea07ca7'
</script>

<template>
  <PanelEditor :panel-id="panel_id" />
</template>

<style scoped></style>
