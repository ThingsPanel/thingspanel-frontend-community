<!--
  HTTP配置第2步 - 请求头配置组件
  使用DynamicParameterEditor配置HTTP请求头
-->
<script setup lang="ts">
/**
 * HttpConfigStep2 - HTTP请求头配置步骤
 * 使用通用的动态参数编辑器配置请求头
 */

import type { HttpConfig } from '@/core/data-architecture/types/http-config'
import type { EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'
import DynamicParameterEditor from '@/core/data-architecture/components/common/DynamicParameterEditor.vue'

interface Props {
  /** HTTP配置数据 */
  modelValue: Partial<HttpConfig>
  /** 当前选择的内部接口信息 */
  currentApiInfo?: any
  /** 🔥 新增：当前组件ID，用于属性绑定 */
  componentId?: string
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 更新请求头配置
 */
const updateHeaders = (headers: EnhancedParameter[]) => {
  const updatedValue = {
    ...props.modelValue,
    headers
  }

  emit('update:modelValue', updatedValue)
}
</script>

<template>
  <div class="http-config-step2">
    <!-- 默认请求头提示框 -->
    <n-alert
      v-if="showDefaultHeadersAlert && isInternalApi"
      type="info"
      closable
      style="margin-bottom: 16px"
      @close="dismissAlert"
    >
      <template #header>
        <n-space align="center">
          <span>✨ 建议添加默认请求头</span>
        </n-space>
      </template>

      <n-space vertical size="small">
        <n-text depth="3">
          内部接口通常需要以下请求头：
          <n-text type="info" strong>Accept: application/json</n-text>
        </n-text>

        <n-space>
          <n-button type="primary" size="small" @click="applyDefaultHeaders">添加默认请求头</n-button>
          <n-button size="small" @click="dismissAlert">手动配置</n-button>
        </n-space>
      </n-space>
    </n-alert>

    <!-- 请求头配置 -->
    <DynamicParameterEditor
      :model-value="modelValue.headers || []"
      parameter-type="header"
      title="请求头配置"
      add-button-text="添加请求头"
      key-placeholder="头部名称（如：Content-Type）"
      value-placeholder="头部值（如：application/json）"
      :current-api-info="currentApiInfo"
      :current-component-id="componentId"
      @update:model-value="updateHeaders"
    />
  </div>
</template>

<style scoped>
.http-config-step2 {
  width: 100%;
  padding: 12px;
}
</style>
