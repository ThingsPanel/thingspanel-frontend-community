<!--
  HTTP配置第3步 - 参数配置组件
  配置查询参数和路径参数
-->
<script setup lang="ts">
/**
 * HttpConfigStep3 - HTTP参数配置步骤
 * 包含查询参数和路径参数的配置
 */

import { NText } from 'naive-ui'
import type { HttpConfig } from '../../types/http-config'
import type { EnhancedParameter } from '../../types/parameter-editor'
import DynamicParameterEditor from './DynamicParameterEditor.vue'

interface Props {
  /** HTTP配置数据 */
  modelValue: Partial<HttpConfig>
  /** 当前选择的内部接口信息 */
  currentApiInfo?: any
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 更新查询参数
 */
const updateParams = (params: EnhancedParameter[]) => {
  console.log('📊 更新查询参数:', params)
  emit('update:modelValue', {
    ...props.modelValue,
    params
  })
}
</script>

<template>
  <div class="http-config-step3">
    <!-- 查询参数配置 -->
    <DynamicParameterEditor
      :model-value="modelValue.params || []"
      parameter-type="query"
      title="查询参数配置"
      add-button-text="添加查询参数"
      key-placeholder="参数名（如：deviceId）"
      value-placeholder="参数值（如：DEV001）"
      :current-api-info="currentApiInfo"
      @update:model-value="updateParams"
    />

    <div style="margin-top: 16px; padding: 12px; background: var(--info-color-suppl); border-radius: 6px">
      <n-text depth="3" style="font-size: 12px">
        💡 注意：路径参数已在第1步地址配置中处理，这里只配置查询参数（URL中?后面的参数）
      </n-text>
    </div>
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
