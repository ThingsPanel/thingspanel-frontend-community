<!--
  HTTP配置第3步 - 参数配置组件
  配置查询参数和路径参数
-->
<script setup lang="ts">
/**
 * HttpConfigStep3 - HTTP参数配置步骤
 * 包含查询参数和路径参数的配置
 */

import type { HttpConfig } from '../../types/http-config'
import DynamicParameterEditor from './DynamicParameterEditor.vue'

interface Props {
  /** HTTP配置数据 */
  modelValue: Partial<HttpConfig>
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 更新查询参数
 */
const updateParams = (params: any[]) => {
  emit('update:modelValue', {
    ...props.modelValue,
    params
  })
}

/**
 * 更新路径参数
 */
const updatePathParams = (pathParams: any[]) => {
  emit('update:modelValue', {
    ...props.modelValue,
    pathParams
  })
}
</script>

<template>
  <div class="http-config-step3">
    <n-space vertical size="large">
      <!-- 查询参数配置 -->
      <div class="param-section">
        <DynamicParameterEditor
          :model-value="modelValue.params || []"
          parameter-type="query"
          title="查询参数配置"
          add-button-text="添加查询参数"
          key-placeholder="参数名（如：deviceId）"
          value-placeholder="参数值（如：DEV001）"
          @update:model-value="updateParams"
        />
        
      </div>

      <!-- 路径参数配置 -->
      <div class="param-section">
        <DynamicParameterEditor
          :model-value="modelValue.pathParams || []"
          parameter-type="path"
          title="路径参数配置"
          add-button-text="添加路径参数"
          key-placeholder="参数名（如：id）"
          value-placeholder="参数值（如：123）"
          custom-class="path-params-editor"
          @update:model-value="updatePathParams"
        />

      </div>
    </n-space>

  </div>
</template>

<style scoped>
.http-config-step3 {
  width: 100%;
  padding: 12px;
}

.param-section {
  margin-bottom: 16px;
}
</style>