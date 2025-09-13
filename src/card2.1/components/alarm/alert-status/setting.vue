<template>
  <div class="alert-status-setting">
    <n-form :model="config" label-placement="left" label-width="80" size="small">
      <!-- 基本配置 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">基本配置</span>
      </n-divider>
      
      <n-form-item label="标题">
        <n-input v-model:value="config.title" placeholder="请输入标题" />
      </n-form-item>
      
      <n-form-item label="金额">
        <n-input-number 
          v-model:value="config.amount" 
          placeholder="请输入金额"
        />
      </n-form-item>
      
      <n-form-item label="简介">
        <n-input 
          v-model:value="config.description" 
          type="textarea" 
          placeholder="请输入简介信息"
          :autosize="{ minRows: 2, maxRows: 4 }"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * 告警状态组件配置表单 - 简化版
 */

import { ref, watch, nextTick } from 'vue'
import { 
  NForm, 
  NFormItem, 
  NInput, 
  NInputNumber, 
  NDivider
} from 'naive-ui'
import type { AlertStatusCustomize } from './settingConfig'

// Props - 配置表单接收的是扁平的自定义配置对象
interface Props {
  modelValue?: AlertStatusCustomize
  widget?: any
  config?: AlertStatusCustomize
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    title: '告警状态',
    amount: 0,
    description: '系统运行正常'
  }),
  readonly: false
})

// Emits - 发射扁平的配置对象
interface Emits {
  (e: 'update:modelValue', value: AlertStatusCustomize): void
  (e: 'change', value: AlertStatusCustomize): void
}

const emit = defineEmits<Emits>()

// 配置数据
const config = ref<AlertStatusCustomize>({ ...props.modelValue })

// 防止循环更新的标记
const isUpdatingFromProps = ref(false)

// 监听配置变化并向上传递
watch(
  config,
  (newConfig) => {
    if (!props.readonly && !isUpdatingFromProps.value) {
      emit('update:modelValue', { ...newConfig })
      emit('change', { ...newConfig })
    }
  },
  { deep: true }
)

// 监听外部配置变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && !isUpdatingFromProps.value) {
      isUpdatingFromProps.value = true
      try {
        config.value = { ...newValue }
      } finally {
        // 使用 nextTick 确保更新完成后再重置标记
        nextTick(() => {
          isUpdatingFromProps.value = false
        })
      }
    }
  },
  { deep: true }
)
</script>

<style scoped>
.alert-status-setting {
  padding: 16px;
}
</style>