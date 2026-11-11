<script setup lang="ts">
import EngineEditor from '../modules/engine-editor.vue'
import LegacyEditor from './modules/legacy-editor.vue'
</script>

<template>
  <EngineEditor kind="scene">
    <template #legacy><LegacyEditor /></template>
  </EngineEditor>
</template>
