<template>
  <div class="info-card-simple-setting">
    <n-form :model="localConfig" label-placement="left" label-width="80" size="small">
      <!-- 显示设置 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">显示设置</span>
      </n-divider>
      
      <n-form-item label="显示图标">
        <n-switch v-model:value="localConfig.showIcon" @update:value="handleConfigChange" />
      </n-form-item>
      
      <n-form-item label="显示标题">
        <n-switch v-model:value="localConfig.showTitle" @update:value="handleConfigChange" />
      </n-form-item>
      
      <n-form-item label="显示副文本">
        <n-switch v-model:value="localConfig.showSubtext" @update:value="handleConfigChange" />
      </n-form-item>
      
      <n-form-item label="显示时间">
        <n-switch v-model:value="localConfig.showUpdateTime" @update:value="handleConfigChange" />
      </n-form-item>
      
      <!-- 内容配置 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">内容配置</span>
      </n-divider>
      
      <n-form-item label="标题">
        <n-input v-model:value="localConfig.title" placeholder="请输入标题" @input="handleConfigChange" />
      </n-form-item>
      
      <n-form-item label="默认值">
        <n-input v-model:value="localConfig.defaultValue" placeholder="无数据时显示的默认值" @input="handleConfigChange" />
      </n-form-item>
      
      <n-form-item label="副文本">
        <n-input v-model:value="localConfig.subtext" placeholder="请输入副文本说明" @input="handleConfigChange" />
      </n-form-item>
      
      <!-- 样式配置 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">样式配置</span>
      </n-divider>
      
      <n-form-item label="背景颜色">
        <n-color-picker v-model:value="localConfig.backgroundColor" @update:value="handleConfigChange" />
      </n-form-item>
      
      <n-form-item label="边框颜色">
        <n-color-picker v-model:value="localConfig.borderColor" @update:value="handleConfigChange" />
      </n-form-item>
      
      <n-form-item label="圆角">
        <n-input-number
          v-model:value="localConfig.borderRadius"
          :min="0"
          :max="20"
          placeholder="6"
          @update:value="handleConfigChange"
        />
        <span style="margin-left: 8px; font-size: 12px; color: var(--text-color-3)">px</span>
      </n-form-item>
      
      <!-- 图标设置 -->
      <template v-if="localConfig.showIcon">
        <n-divider title-placement="left">
          <span style="font-size: 12px; color: var(--text-color-2)">图标设置</span>
        </n-divider>
        
        <n-form-item label="图标大小">
          <n-input-number
            v-model:value="localConfig.iconSize"
            :min="16"
            :max="48"
            placeholder="24"
            @update:value="handleConfigChange"
          />
          <span style="margin-left: 8px; font-size: 12px; color: var(--text-color-3)">px</span>
        </n-form-item>
        
        <n-form-item label="图标颜色">
          <n-color-picker v-model:value="localConfig.iconColor" @update:value="handleConfigChange" />
        </n-form-item>
      </template>
      
      <!-- 数值样式 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">数值样式</span>
      </n-divider>
      
      <n-form-item label="字体大小">
        <n-input-number
          v-model:value="localConfig.valueSize"
          :min="12"
          :max="48"
          placeholder="24"
          @update:value="handleConfigChange"
        />
        <span style="margin-left: 8px; font-size: 12px; color: var(--text-color-3)">px</span>
      </n-form-item>
      
      <n-form-item label="字体颜色">
        <n-color-picker v-model:value="localConfig.valueColor" @update:value="handleConfigChange" />
      </n-form-item>
      
      <n-form-item label="数值加粗">
        <n-switch v-model:value="localConfig.valueBold" @update:value="handleConfigChange" />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * 简单信息卡片组件配置表单 - 重写版本
 * 🔥 解决递归更新问题：使用本地状态管理，防抖更新
 */

import { ref, watch, onUnmounted } from 'vue'
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

// 🔥 使用本地状态，避免直接修改props
const localConfig = ref<InfoCardSimpleCustomize>({ ...props.modelValue })

// 防抖更新定时器
let updateTimer: number | null = null

/**
 * 🔥 处理配置变更 - 防抖发送事件
 */
const handleConfigChange = () => {
  if (props.readonly) return
  
  if (updateTimer) {
    clearTimeout(updateTimer)
  }
  
  updateTimer = setTimeout(() => {
    console.log(`🔥 [info-card-simple-setting] 配置变更:`, localConfig.value)
    emit('update:modelValue', { ...localConfig.value })
    emit('change', { ...localConfig.value })
  }, 50) // 50ms防抖，更快响应
}

/**
 * 🔥 监听外部配置变化，同步到本地状态（单向）
 */
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && JSON.stringify(newValue) !== JSON.stringify(localConfig.value)) {
      console.log(`🔥 [info-card-simple-setting] 外部配置变化:`, newValue)
      localConfig.value = { ...newValue }
    }
  },
  { deep: true, immediate: true }
)

// 组件卸载时清理定时器
onUnmounted(() => {
  if (updateTimer) {
    clearTimeout(updateTimer)
  }
})
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