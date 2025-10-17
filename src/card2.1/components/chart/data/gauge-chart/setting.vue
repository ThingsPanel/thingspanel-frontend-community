<template>
  <div class="gauge-chart-setting">
    <n-space vertical :size="16">
      <!-- 数据配置 -->
      <n-card title="📊 数据配置" size="small" embedded>
        <n-space vertical :size="12">
          <n-form-item label="当前值">
            <n-input-number
              v-model:value="localConfig.value"
              :min="0"
              :max="1000"
              @update:value="handleUpdate"
              placeholder="请输入当前值"
            />
          </n-form-item>
          <n-form-item label="最小值">
            <n-input-number
              v-model:value="localConfig.min"
              @update:value="handleUpdate"
              placeholder="请输入最小值"
            />
          </n-form-item>
          <n-form-item label="最大值">
            <n-input-number
              v-model:value="localConfig.max"
              @update:value="handleUpdate"
              placeholder="请输入最大值"
            />
          </n-form-item>
          <n-form-item label="单位">
            <n-input
              v-model:value="localConfig.unit"
              @update:value="handleUpdate"
              placeholder="如：℃、%、RPM"
            />
          </n-form-item>
        </n-space>
      </n-card>

      <!-- 样式配置 -->
      <n-card title="🎨 样式配置" size="small" embedded>
        <n-space vertical :size="12">
          <n-form-item label="标题">
            <n-input
              v-model:value="localConfig.title"
              @update:value="handleUpdate"
              placeholder="请输入标题"
            />
          </n-form-item>
          <n-form-item label="标题颜色">
            <n-color-picker
              v-model:value="localConfig.titleColor"
              @update:value="handleUpdate"
              :show-alpha="false"
            />
          </n-form-item>
          <n-form-item label="数值颜色">
            <n-color-picker
              v-model:value="localConfig.valueColor"
              @update:value="handleUpdate"
              :show-alpha="false"
            />
          </n-form-item>
          <n-form-item label="仪表盘大小">
            <n-input
              v-model:value="localConfig.radius"
              @update:value="handleUpdate"
              placeholder="如：75%"
            />
          </n-form-item>
          <n-form-item label="指针厚度">
            <n-input-number
              v-model:value="localConfig.thickness"
              :min="1"
              :max="50"
              @update:value="handleUpdate"
            />
          </n-form-item>
        </n-space>
      </n-card>

      <!-- 动画配置 -->
      <n-card title="⚡ 动画配置" size="small" embedded>
        <n-form-item label="动画时长（毫秒）">
          <n-input-number
            v-model:value="localConfig.animationDuration"
            :min="0"
            :max="5000"
            :step="100"
            @update:value="handleUpdate"
          />
        </n-form-item>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
/**
 * 仪表盘图表配置面板
 * 用于配置仪表盘组件的各项参数
 */

import { ref, watch } from 'vue'
import {
  NSpace,
  NCard,
  NFormItem,
  NInput,
  NInputNumber,
  NColorPicker
} from 'naive-ui'
import type { GaugeChartCustomize } from './settingConfig'
import { customConfig } from './settingConfig'

interface Props {
  config?: GaugeChartCustomize
}

interface Emits {
  (e: 'update:config', config: GaugeChartCustomize): void
  (e: 'change', config: GaugeChartCustomize): void
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({ ...customConfig })
})

const emit = defineEmits<Emits>()

// 本地配置副本
const localConfig = ref<GaugeChartCustomize>({ ...customConfig, ...props.config })

/**
 * 处理配置更新
 */
const handleUpdate = () => {
  emit('update:config', { ...localConfig.value })
  emit('change', { ...localConfig.value })
}

/**
 * 监听外部配置变化
 */
watch(
  () => props.config,
  (newConfig) => {
    if (newConfig) {
      localConfig.value = { ...customConfig, ...newConfig }
    }
  },
  { deep: true }
)
</script>

<style scoped>
.gauge-chart-setting {
  padding: 12px;
}

:deep(.n-form-item) {
  margin-bottom: 0;
}

:deep(.n-form-item-label) {
  font-size: 13px;
  color: var(--text-color-2);
}
</style>
