<!--
  HTTP配置第4步 - 请求前脚本配置组件
  使用SimpleScriptEditor配置请求前处理脚本
-->
<script setup lang="ts">
/**
 * HttpConfigStep4 - HTTP请求前脚本配置步骤
 * 用于在发送请求前动态修改URL、请求头和参数
 */

import { useI18n } from 'vue-i18n'
import type { HttpConfig } from '@/core/data-architecture/types/http-config'
import SimpleScriptEditor from '@/core/script-engine/components/SimpleScriptEditor.vue'

interface Props {
  /** HTTP配置数据 */
  modelValue: Partial<HttpConfig>
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

/**
 * 更新请求前脚本
 */
const updatePreRequestScript = (script: string) => {
  emit('update:modelValue', {
    ...props.modelValue,
    preRequestScript: script
  })
}
</script>

<template>
  <div class="http-config-step4">
    <div class="script-editor-section">
      <SimpleScriptEditor
        :model-value="modelValue.preRequestScript || ''"
        template-category="http-pre-request"
        placeholder="请求前处理脚本"
        height="300px"
        @update:model-value="updatePreRequestScript"
      />
    </div>
  </div>
</template>

<style scoped>
.http-config-step4 {
  width: 100%;
  padding: 12px;
}

.script-editor-section {
  min-height: 280px;
}
</style>
