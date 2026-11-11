<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NAlert, NButton, NSpin } from 'naive-ui'
import { getAutomationMode, type AutomationMode } from '@/service/api/automation-runtime'
import RuleEditor from '../rule-edit/index.vue'

defineProps<{ kind: 'scene' | 'automation' }>()
const mode = ref<AutomationMode | null>(null)
const error = ref('')
const loading = ref(false)
async function load() {
  loading.value = true
  error.value = ''
  try {
    mode.value = await getAutomationMode()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '无法确认自动化服务状态'
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

<template>
  <NSpin :show="loading">
    <NAlert v-if="error" type="error">
      {{ error }}
      <NButton size="small" class="ml-3" @click="load">重试</NButton>
    </NAlert>
    <RuleEditor v-else-if="mode === 'native'" :initial-kind="kind" />
    <slot v-else-if="mode === 'legacy'" name="legacy" />
  </NSpin>
</template>
