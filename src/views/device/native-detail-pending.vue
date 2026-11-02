<script setup lang="ts">
import { NAlert } from 'naive-ui'

defineOptions({ inheritAttrs: false })
defineProps<{ title?: string }>()
</script>

<template>
  <NAlert type="warning" :show-icon="false" class="my-4">
    <span v-if="title" class="mr-2">{{ title }}</span>
    此功能正在接入，暂时无法操作。
  </NAlert>
</template>
