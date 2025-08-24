<template>
  <div class="http-config-form">
    <n-form :model="internalConfig" label-placement="left" label-width="auto">
      <n-form-item label="URL">
        <n-input v-model:value="internalConfig.url" placeholder="https://api.example.com/data" />
      </n-form-item>

      <n-form-item label="请求方法">
        <n-select v-model:value="internalConfig.method" :options="httpMethodOptions" />
      </n-form-item>

      <n-tabs type="card" size="small">
        <n-tab-pane name="headers" tab="请求头">
          <key-value-editor v-model:value="internalConfig.headers" />
        </n-tab-pane>
        <n-tab-pane name="params" tab="URL参数">
          <key-value-editor v-model:value="internalConfig.params" />
        </n-tab-pane>
        <n-tab-pane name="body" tab="请求体">
          <n-radio-group v-model:value="internalConfig.bodyType" name="radiogroup">
            <n-radio-button value="none">None</n-radio-button>
            <n-radio-button value="form-data">Form Data</n-radio-button>
            <n-radio-button value="json">JSON</n-radio-button>
          </n-radio-group>

          <div v-if="internalConfig.bodyType === 'form-data'" class="mt-4">
            <key-value-editor v-model:value="internalConfig.body" />
          </div>

          <div v-if="internalConfig.bodyType === 'json'" class="mt-4">
            <code-editor v-model:value="internalConfig.body" language="json" :height="150" />
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { NForm, NFormItem, NInput, NSelect, NTabs, NTabPane, NRadioGroup, NRadioButton } from 'naive-ui'
import KeyValueEditor from './key-value-editor.vue'
import CodeEditor from './code-editor.vue'

const props = defineProps({
  value: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:value'])

const internalConfig = ref(props.value)

watch(
  () => props.value,
  newValue => {
    internalConfig.value = newValue
  },
  { deep: true, immediate: true }
)

watch(
  internalConfig,
  newValue => {
    emit('update:value', newValue)
  },
  { deep: true }
)

const httpMethodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' }
]
</script>

<style scoped>
.http-config-form {
  padding: 16px;
}
.mt-4 {
  margin-top: 16px;
}
</style>
