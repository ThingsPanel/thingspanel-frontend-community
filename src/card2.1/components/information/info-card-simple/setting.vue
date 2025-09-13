<template>
  <div class="info-card-simple-setting">
    <n-form :model="config" label-placement="left" label-width="80" size="small">
      <!-- 显示设置 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">显示设置</span>
      </n-divider>
      
      <n-form-item label="显示图标">
        <n-switch v-model:value="config.showIcon" />
      </n-form-item>
      
      <n-form-item label="显示标题">
        <n-switch v-model:value="config.showTitle" />
      </n-form-item>
      
      <n-form-item label="显示副文本">
        <n-switch v-model:value="config.showSubtext" />
      </n-form-item>
      
      <n-form-item label="显示时间">
        <n-switch v-model:value="config.showUpdateTime" />
      </n-form-item>
      
      <!-- 内容配置 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">内容配置</span>
      </n-divider>
      
      <n-form-item label="标题">
        <n-input v-model:value="config.title" placeholder="请输入标题" />
      </n-form-item>
      
      <n-form-item label="默认值">
        <n-input v-model:value="config.defaultValue" placeholder="无数据时显示的默认值" />
      </n-form-item>
      
      <n-form-item label="副文本">
        <n-input v-model:value="config.subtext" placeholder="请输入副文本说明" />
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
          placeholder="6"
        />
        <span style="margin-left: 8px; font-size: 12px; color: var(--text-color-3)">px</span>
      </n-form-item>
      
      <!-- 图标设置 -->
      <template v-if="config.showIcon">
        <n-divider title-placement="left">
          <span style="font-size: 12px; color: var(--text-color-2)">图标设置</span>
        </n-divider>
        
        <n-form-item label="图标大小">
          <n-input-number
            v-model:value="config.iconSize"
            :min="16"
            :max="48"
            placeholder="24"
          />
          <span style="margin-left: 8px; font-size: 12px; color: var(--text-color-3)">px</span>
        </n-form-item>
        
        <n-form-item label="图标颜色">
          <n-color-picker v-model:value="config.iconColor" />
        </n-form-item>
      </template>
      
      <!-- 数值样式 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">数值样式</span>
      </n-divider>
      
      <n-form-item label="字体大小">
        <n-input-number
          v-model:value="config.valueSize"
          :min="12"
          :max="48"
          placeholder="24"
        />
        <span style="margin-left: 8px; font-size: 12px; color: var(--text-color-3)">px</span>
      </n-form-item>
      
      <n-form-item label="字体颜色">
        <n-color-picker v-model:value="config.valueColor" />
      </n-form-item>
      
      <n-form-item label="数值加粗">
        <n-switch v-model:value="config.valueBold" />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * 简单信息卡片组件配置表单
 */

import { ref, watch } from 'vue'
import { 
  NForm, 
  NFormItem, 
  NSwitch, 
  NInput, 
  NInputNumber, 
  NColorPicker,
  NDivider
} from 'naive-ui'
import type { InfoCardSimpleCustomize } from './settingConfig'

// Props
interface Props {
  modelValue?: InfoCardSimpleCustomize
  widget?: any
  config?: InfoCardSimpleCustomize
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    // 显示控制
    showIcon: true,
    showTitle: true,
    showSubtext: false,
    showUpdateTime: true,
    
    // 内容配置
    title: '信息标题',
    defaultValue: '暂无数据',
    subtext: '附加说明',
    
    // 样式配置
    backgroundColor: 'transparent',
    borderColor: 'var(--border-color)',
    borderRadius: 6,
    
    // 图标配置
    iconSize: 24,
    iconColor: 'var(--primary-color)',
    
    // 数值样式
    valueSize: 24,
    valueColor: 'var(--text-color-1)',
    valueBold: true
  }),
  readonly: false
})

// Emits
interface Emits {
  (e: 'update:modelValue', value: InfoCardSimpleCustomize): void
  (e: 'change', value: InfoCardSimpleCustomize): void
}

const emit = defineEmits<Emits>()

// 配置数据
const config = ref<InfoCardSimpleCustomize>({ ...props.modelValue })

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
.info-card-simple-setting {
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