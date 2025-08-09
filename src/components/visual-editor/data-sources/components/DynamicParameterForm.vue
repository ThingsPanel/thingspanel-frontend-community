<template>
  <div v-if="apiType" class="dynamic-parameter-form">
    <n-card :title="formTitle" size="small">
      <!-- 简单表单 -->
      <template v-if="formComplexity === 'simple'">
        <SimpleParameterForm v-model="parameters" :api-type="apiType" @parameters-change="onParametersChange" />
      </template>

      <!-- 中等表单 -->
      <template v-else-if="formComplexity === 'medium'">
        <MediumParameterForm v-model="parameters" :api-type="apiType" @parameters-change="onParametersChange" />
      </template>

      <!-- 复杂表单（telemetryDataHistoryList）-->
      <template v-else-if="formComplexity === 'complex'">
        <ComplexParameterForm v-model="parameters" :api-type="apiType" @parameters-change="onParametersChange" />
      </template>

      <!-- 发送表单 -->
      <template v-else-if="formComplexity === 'send'">
        <SendParameterForm v-model="parameters" :api-type="apiType" @parameters-change="onParametersChange" />
      </template>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NCard } from 'naive-ui'
// 导入不同复杂度的表单组件
import SimpleParameterForm from './parameter-forms/SimpleParameterForm.vue'
import MediumParameterForm from './parameter-forms/MediumParameterForm.vue'
import ComplexParameterForm from './parameter-forms/ComplexParameterForm.vue'
import SendParameterForm from './parameter-forms/SendParameterForm.vue'

interface Props {
  apiType?: string
  modelValue?: Record<string, any>
}

interface Emits {
  'update:modelValue': [value: Record<string, any>]
  'parameters-change': [parameters: Record<string, any>]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const parameters = ref<Record<string, any>>(props.modelValue || {})

// API类型配置映射
const apiTypeConfig = {
  // 简单接口（2个参数）
  telemetryDataCurrentKeys: { complexity: 'simple', title: '遥测当前值参数配置' },
  getAttributeDatasKey: { complexity: 'simple', title: '指定属性值参数配置' },

  // 中等接口（1个参数）
  getAttributeDataSet: { complexity: 'medium', title: '属性数据集参数配置' },

  // 复杂接口（5个参数）
  telemetryDataHistoryList: { complexity: 'complex', title: '遥测历史数据参数配置（复杂）' },

  // 发送接口（3个参数）
  telemetryDataPub: { complexity: 'send', title: '发送遥测数据参数配置' },
  attributeDataPub: { complexity: 'send', title: '发送属性数据参数配置' },
  commandDataPub: { complexity: 'send', title: '发送命令数据参数配置' }
}

// 计算表单复杂度
const formComplexity = computed(() => {
  if (!props.apiType) return 'simple'
  return apiTypeConfig[props.apiType]?.complexity || 'simple'
})

// 计算表单标题
const formTitle = computed(() => {
  if (!props.apiType) return '参数配置'
  return apiTypeConfig[props.apiType]?.title || '参数配置'
})

// 参数变化处理
const onParametersChange = (newParameters: Record<string, any>) => {
  console.log('🔧 DynamicParameterForm - 参数变化:', newParameters)
  parameters.value = newParameters
  emit('update:modelValue', newParameters)
  emit('parameters-change', newParameters)
}

// 监听外部modelValue变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && newValue !== parameters.value) {
      parameters.value = { ...newValue }
    }
  },
  { deep: true, immediate: true }
)

// 监听apiType变化，重置参数
watch(
  () => props.apiType,
  (newApiType, oldApiType) => {
    if (newApiType !== oldApiType && newApiType) {
      console.log('🔧 DynamicParameterForm - API类型变化，重置参数:', newApiType)
      parameters.value = {}
      emit('update:modelValue', {})
      emit('parameters-change', {})
    }
  }
)
</script>

<style scoped>
.dynamic-parameter-form {
  margin-top: 16px;
}
</style>
