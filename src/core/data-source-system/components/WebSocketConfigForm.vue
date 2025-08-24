<template>
  <div class="websocket-config-form">
    <n-form :model="config" label-placement="top">
      <n-form-item label="URL">
        <n-input v-model:value="config.url" placeholder="wss://example.com/socket" />
      </n-form-item>
      <!-- 其他 WebSocket 相关配置可以在这里添加 -->
    </n-form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { NForm, NFormItem, NInput } from 'naive-ui'

const props = defineProps({
  config: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:config'])

const internalConfig = ref(props.config)

watch(
  () => props.config,
  newConfig => {
    internalConfig.value = newConfig
  },
  { deep: true }
)

watch(
  internalConfig,
  newConfig => {
    emit('update:config', newConfig)
  },
  { deep: true }
)
</script>

<style scoped>
.websocket-config-form {
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 8px;
}
</style>
