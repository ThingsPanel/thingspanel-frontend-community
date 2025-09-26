<template>
  <div class="digit-indicator-setting">
    <n-form :model="config" label-placement="left" label-width="100" size="small">
      <!-- 基本配置 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">基本配置</span>
      </n-divider>

      <n-form-item label="标题">
        <n-input
          v-model:value="config.title"
          placeholder="请输入标题"
        />
      </n-form-item>

      <n-form-item :label="$t('device_template.table_header.unit')">
        <n-input
          v-model:value="config.unit"
          :placeholder="$t('device_template.table_header.pleaseEnterTheUnit')"
        />
        <template #feedback>
          <span style="font-size: 11px; color: var(--text-color-3)">
            例如：%、℃、kW/h等，留空则使用数据源中的单位
          </span>
        </template>
      </n-form-item>

      <!-- 样式配置 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">样式配置</span>
      </n-divider>

      <n-form-item label="图标">
        <IconSelector
          :default-icon="config.iconName"
          @icon-selected="handleIconSelect"
        />
      </n-form-item>

      <n-form-item :label="$t('generate.color')">
        <n-color-picker
          v-model:value="config.color"
          :show-alpha="false"
          :modes="['hex']"
        />
      </n-form-item>

      <!-- 调试配置 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">调试配置</span>
      </n-divider>

      <n-form-item label="显示调试信息">
        <n-switch v-model:value="config.showDebug" />
        <template #feedback>
          <span style="font-size: 11px; color: var(--text-color-3)">
            开启后将显示组件的调试信息面板
          </span>
        </template>
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * 数字指示器组件配置表单
 * 基于原始 card-config.vue 迁移到 Card 2.1 系统
 */

import { ref, watch, nextTick } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NColorPicker,
  NSwitch,
  NDivider
} from 'naive-ui'
import { $t } from '@/locales'
import IconSelector from '@/components/common/icon-selector.vue'
import type { DigitIndicatorCustomize } from './settingConfig'

// Props - 配置表单接收的是扁平的自定义配置对象
interface Props {
  modelValue?: DigitIndicatorCustomize
  widget?: any
  config?: DigitIndicatorCustomize
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    unit: '%',
    color: '#1890ff',
    iconName: 'Water',
    title: '',
    showDebug: false
  }),
  readonly: false
})

// Emits - 发射扁平的配置对象
interface Emits {
  (e: 'update:modelValue', value: DigitIndicatorCustomize): void
  (e: 'change', value: DigitIndicatorCustomize): void
}

const emit = defineEmits<Emits>()

// 配置数据
const config = ref<DigitIndicatorCustomize>({ ...props.modelValue })

// 防止循环更新的标记
const isUpdatingFromProps = ref(false)

// 图标选择处理器
const handleIconSelect = (iconName: string) => {
  config.value.iconName = iconName
}

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
  { deep: true, immediate: true }
)
</script>

<style scoped>
.digit-indicator-setting {
  padding: 16px;
}

/* 样式优化 */
.n-form-item {
  margin-bottom: 16px;
}

.n-divider {
  margin: 20px 0 16px 0;
}

/* 颜色选择器样式优化 */
:deep(.n-color-picker) {
  width: 100%;
}

/* 开关样式优化 */
:deep(.n-switch) {
  margin-right: 8px;
}
</style>