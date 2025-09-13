<template>
  <div class="switch-controller-setting">
    <n-form :model="config" label-placement="left" label-width="90" size="small">
      <!-- 显示设置 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">显示设置</span>
      </n-divider>
      
      <n-form-item label="显示状态">
        <n-switch v-model:value="config.showStatus" />
      </n-form-item>
      
      <n-form-item label="显示描述">
        <n-switch v-model:value="config.showDescription" />
      </n-form-item>
      
      <n-form-item label="显示更新时间">
        <n-switch v-model:value="config.showLastUpdate" />
      </n-form-item>
      
      <n-form-item label="操作通知">
        <n-switch v-model:value="config.showNotification" />
      </n-form-item>
      
      <!-- 内容配置 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">内容配置</span>
      </n-divider>
      
      <n-form-item label="标题">
        <n-input v-model:value="config.title" placeholder="请输入控制器标题" />
      </n-form-item>
      
      <n-form-item label="描述">
        <n-input 
          v-model:value="config.description" 
          type="textarea"
          placeholder="请输入控制器描述"
          :autosize="{ minRows: 2, maxRows: 3 }"
        />
      </n-form-item>
      
      <n-form-item label="开启状态文字">
        <n-input v-model:value="config.onText" placeholder="开启时显示的文字" />
      </n-form-item>
      
      <n-form-item label="关闭状态文字">
        <n-input v-model:value="config.offText" placeholder="关闭时显示的文字" />
      </n-form-item>
      
      <!-- 控制配置 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">控制配置</span>
      </n-divider>
      
      <n-form-item label="禁用控制">
        <n-switch v-model:value="config.disabled" />
        <span style="margin-left: 8px; font-size: 11px; color: var(--text-color-3)">
          禁用后无法操作开关
        </span>
      </n-form-item>
      
      <n-form-item label="开关大小">
        <n-select
          v-model:value="config.switchSize"
          :options="switchSizeOptions"
        />
      </n-form-item>
      
      <!-- 样式配置 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">样式配置</span>
      </n-divider>
      
      <n-form-item label="背景颜色">
        <n-color-picker v-model:value="config.backgroundColor" />
      </n-form-item>
      
      <n-form-item label="边框颜色">
        <n-color-picker v-model:value="config.borderColor" />
      </n-form-item>
      
      <n-form-item label="圆角">
        <n-input-number
          v-model:value="config.borderRadius"
          :min="0"
          :max="20"
          placeholder="8"
        />
        <span style="margin-left: 8px; font-size: 12px; color: var(--text-color-3)">px</span>
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * 开关控制器组件配置表单
 */

import { ref, watch } from 'vue'
import { 
  NForm, 
  NFormItem, 
  NSwitch, 
  NInput, 
  NInputNumber, 
  NColorPicker,
  NSelect,
  NDivider
} from 'naive-ui'
import type { SwitchControllerCustomize } from './settingConfig'

// Props
interface Props {
  modelValue?: SwitchControllerCustomize
  widget?: any
  config?: SwitchControllerCustomize
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    // 显示控制
    showStatus: true,
    showDescription: true,
    showLastUpdate: true,
    showNotification: true,
    
    // 内容配置
    title: '设备开关',
    description: '控制设备的开关状态',
    onText: '已开启',
    offText: '已关闭',
    
    // 控制配置
    disabled: false,
    switchSize: 'medium' as const,
    
    // 样式配置
    backgroundColor: 'transparent',
    borderColor: 'var(--border-color)',
    borderRadius: 8
  }),
  readonly: false
})

// Emits
interface Emits {
  (e: 'update:modelValue', value: SwitchControllerCustomize): void
  (e: 'change', value: SwitchControllerCustomize): void
}

const emit = defineEmits<Emits>()

// 开关大小选项
const switchSizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' }
]

// 配置数据
const config = ref<SwitchControllerCustomize>({ ...props.modelValue })

// 监听配置变化并向上传递
watch(
  config,
  (newConfig) => {
    if (!props.readonly) {
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
    if (newValue) {
      config.value = { ...newValue }
    }
  },
  { deep: true }
)
</script>

<style scoped>
.switch-controller-setting {
  padding: 16px;
}

.n-form-item :deep(.n-form-item-label) {
  font-size: 12px;
}

.n-divider {
  margin: 16px 0 12px 0;
}

.n-divider:first-child {
  margin-top: 0;
}
</style>