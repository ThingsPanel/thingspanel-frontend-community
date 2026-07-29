<!--
  设备选择模式选择器
  让用户选择使用哪种设备选择模式
-->
<script setup lang="ts">
/**
 * DeviceSelectionModeChooser - 设备选择模式选择器
 * 让用户在3种不同复杂度的设备选择模式中选择
 */

import { ref } from 'vue'
import { NCard, NSpace, NText, NIcon, NButton, NRadioGroup, NRadio } from 'naive-ui'
import {
  PhonePortraitOutline as DeviceIcon,
  BarChartOutline as MetricIcon,
  RadioOutline as TelemetryIcon
} from '@vicons/ionicons5'
import type {
  DeviceParameterSourceType,
  DeviceSelectionMode
} from '@/core/data-architecture/types/device-parameter-group'

interface Props {
  /** 预选择的模式（编辑时使用） */
  preSelectedMode?: DeviceParameterSourceType
}

interface Emits {
  (e: 'modeSelected', mode: DeviceParameterSourceType): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 当前选择的模式
const selectedMode = ref<DeviceParameterSourceType>(props.preSelectedMode || 'device-id')

/**
 * 可用的选择模式配置
 */
const availableModes: DeviceSelectionMode[] = [
  {
    mode: 'device-id',
    title: '简单模式：设备ID',
    description: '只选择设备，生成deviceId参数',
    icon: 'device',
    enabled: true,
    expectedParams: 1
  },
  {
    mode: 'device-metric',
    title: '指标模式：设备+指标',
    description: '选择设备和指标，生成deviceId + metric参数',
    icon: 'metric',
    enabled: true,
    expectedParams: 2
  },
  {
    mode: 'telemetry',
    title: '遥测模式：灵活选择',
    description: '灵活选择多个参数（暂未开放，敬请期待）',
    icon: 'telemetry',
    enabled: false,
    expectedParams: 3
  }
]

/**
 * 获取模式图标组件
 */
const getModeIcon = (iconType: string) => {
  const iconMap = {
    device: DeviceIcon,
    metric: MetricIcon,
    telemetry: TelemetryIcon
  }
  return iconMap[iconType as keyof typeof iconMap] || DeviceIcon
}

/**
 * 获取模式颜色
 */
const getModeColor = (mode: DeviceParameterSourceType) => {
  const colorMap = {
    'device-id': '#2080f0',
    'device-metric': '#18a058',
    telemetry: '#f0a020'
  }
  return colorMap[mode]
}

/**
 * 确认选择模式
 */
const confirmMode = () => {
  emit('modeSelected', selectedMode.value)
}

/**
 * 取消选择
 */
const cancelSelection = () => {
  emit('cancel')
}
</script>

<template>
  <div class="mode-chooser">
    <!-- 标题 -->
    <div class="chooser-header">
      <n-text strong style="font-size: 16px">选择参数生成方式</n-text>
      <n-text depth="3" style="font-size: 12px; margin-top: 4px">
        不同模式会生成不同数量和类型的参数，请根据需要选择
      </n-text>
    </div>

    <!-- 模式选择 -->
    <div class="mode-selection">
      <n-radio-group v-model:value="selectedMode">
        <n-space vertical size="large">
          <div
            v-for="modeConfig in availableModes"
            :key="modeConfig.mode"
            class="mode-option"
            :class="{
              'mode-selected': selectedMode === modeConfig.mode,
              'mode-disabled': !modeConfig.enabled
            }"
          >
            <n-card :bordered="false" class="mode-card" :class="{ selected: selectedMode === modeConfig.mode }">
              <n-space align="center">
                <!-- 单选按钮 -->
                <n-radio :value="modeConfig.mode" :disabled="!modeConfig.enabled" />

                <!-- 模式图标 -->
                <n-icon size="24" :color="modeConfig.enabled ? getModeColor(modeConfig.mode) : '#ccc'">
                  <component :is="getModeIcon(modeConfig.icon)" />
                </n-icon>

                <!-- 模式信息 -->
                <div class="mode-info">
                  <n-text strong :class="{ 'text-disabled': !modeConfig.enabled }" style="font-size: 14px">
                    {{ modeConfig.title }}
                  </n-text>
                  <n-text
                    depth="3"
                    :class="{ 'text-disabled': !modeConfig.enabled }"
                    style="font-size: 12px; display: block; margin-top: 4px"
                  >
                    {{ modeConfig.description }}
                  </n-text>

                  <!-- 参数数量提示 -->
                  <div class="param-hint">
                    <n-text
                      :class="{ 'text-disabled': !modeConfig.enabled }"
                      style="font-size: 11px; color: var(--success-color)"
                    >
                      预期生成 {{ modeConfig.expectedParams }} 个参数
                    </n-text>
                  </div>
                </div>

                <!-- 禁用标识 -->
                <div v-if="!modeConfig.enabled" class="disabled-badge">
                  <n-text depth="3" style="font-size: 11px">敬请期待</n-text>
                </div>
              </n-space>
            </n-card>
          </div>
        </n-space>
      </n-radio-group>
    </div>

    <!-- 选择预览 -->
    <div class="selection-preview">
      <div v-if="selectedMode" class="preview-content">
        <n-text depth="3" style="font-size: 12px">
          当前选择：
          <strong>{{ availableModes.find(m => m.mode === selectedMode)?.title }}</strong>
        </n-text>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="chooser-actions">
      <n-space justify="end">
        <n-button @click="cancelSelection">取消</n-button>
        <n-button
          type="primary"
          :disabled="!availableModes.find(m => m.mode === selectedMode)?.enabled"
          @click="confirmMode"
        >
          下一步
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<style scoped>
.mode-chooser {
  padding: 20px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chooser-header {
  margin-bottom: 8px;
}

.mode-selection {
  flex: 1;
}

.mode-option {
  position: relative;
  transition: all 0.3s ease;
}

.mode-card {
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.mode-card:hover:not(.mode-disabled .mode-card) {
  background-color: var(--hover-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.mode-card.selected {
  border-color: var(--primary-color);
  background-color: var(--primary-color-suppl);
}

.mode-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mode-disabled .mode-card {
  cursor: not-allowed;
}

.mode-info {
  flex: 1;
  margin-left: 12px;
}

.text-disabled {
  opacity: 0.5;
}

.param-hint {
  margin-top: 6px;
}

.disabled-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--warning-color);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
}

.selection-preview {
  margin: 16px 0;
  padding: 12px;
  background: var(--code-color);
  border-radius: 6px;
}

.chooser-actions {
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}
</style>
