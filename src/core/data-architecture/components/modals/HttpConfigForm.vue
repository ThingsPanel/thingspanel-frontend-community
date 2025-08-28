<!--
  HTTP接口配置表单组件
  专门处理HTTP接口相关的配置
-->
<script setup lang="ts">
/**
 * HttpConfigForm - HTTP接口配置表单
 * 处理HTTP请求的复杂配置逻辑
 */

import { reactive } from 'vue'

// Props接口
interface Props {
  /** HTTP URL */
  url?: string
  /** HTTP 方法 */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** 请求头JSON字符串 */
  headers?: string
  /** 请求体JSON字符串 */
  body?: string
}

// Emits接口
interface Emits {
  (e: 'update:url', value: string): void
  (e: 'update:method', value: 'GET' | 'POST' | 'PUT' | 'DELETE'): void
  (e: 'update:headers', value: string): void
  (e: 'update:body', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  url: 'https://api.example.com/data',
  method: 'GET',
  headers: '{\n  "Authorization": "Bearer your-token",\n  "Content-Type": "application/json"\n}',
  body: '{}'
})

const emit = defineEmits<Emits>()
</script>

<template>
  <div class="http-config-form">
    <n-form-item label="请求URL" label-placement="top" :show-feedback="false">
      <n-input
        :value="props.url"
        placeholder="https://api.example.com/data"
        @update:value="v => emit('update:url', v)"
      />
    </n-form-item>

    <n-form-item label="请求方法" label-placement="top" :show-feedback="false">
      <n-select
        :value="props.method"
        :options="[
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' }
        ]"
        @update:value="v => emit('update:method', v)"
      />
    </n-form-item>

    <n-form-item label="请求头 (JSON)" label-placement="top" :show-feedback="false">
      <n-input
        :value="props.headers"
        type="textarea"
        :rows="3"
        placeholder='{"Authorization": "Bearer token"}'
        :input-props="{ style: 'font-family: Monaco, Consolas, monospace; font-size: 12px;' }"
        @update:value="v => emit('update:headers', v)"
      />
    </n-form-item>

    <n-form-item v-if="props.method !== 'GET'" label="请求体 (JSON)" label-placement="top" :show-feedback="false">
      <n-input
        :value="props.body"
        type="textarea"
        :rows="4"
        placeholder='{"key": "value"}'
        :input-props="{ style: 'font-family: Monaco, Consolas, monospace; font-size: 12px;' }"
        @update:value="v => emit('update:body', v)"
      />
    </n-form-item>
  </div>
</template>

<style scoped>
.http-config-form {
  width: 100%;
}
</style>
