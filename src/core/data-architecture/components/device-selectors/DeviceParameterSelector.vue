<!--
  设备参数选择器主控制器
  整合所有设备选择模式，提供统一的入口
-->
<script setup lang="ts">
/**
 * DeviceParameterSelector - 设备参数选择器主控制器
 * 统一管理3种设备选择模式的切换和参数生成
 */

import { ref, computed, nextTick } from 'vue'
import { NDrawer, NDrawerContent } from 'naive-ui'
import DeviceSelectionModeChooser from '@/core/data-architecture/components/device-selectors/DeviceSelectionModeChooser.vue'
import DeviceIdSelector from '@/core/data-architecture/components/device-selectors/DeviceIdSelector.vue'
import DeviceMetricSelector from '@/core/data-architecture/components/device-selectors/DeviceMetricSelector.vue'

import {
  generateDeviceIdParameters,
  generateDeviceMetricParameters,
  convertToEnhancedParameters,
  globalParameterGroupManager
} from '../../utils/device-parameter-generator'

import type {
  DeviceParameterSourceType,
  DeviceInfo,
  DeviceMetric,
  DeviceSelectionConfig
} from '../../types/device-parameter-group'
import type { EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'

interface Props {
  /** 是否显示选择器 */
  visible: boolean
  /** 编辑模式：如果提供了现有参数组则为编辑模式 */
  editingGroupId?: string
  /** 预选择的设备（编辑模式） */
  preSelectedDevice?: DeviceInfo
  /** 预选择的指标（编辑模式） */
  preSelectedMetric?: DeviceMetric
  /** 预选择的模式（编辑模式） */
  preSelectedMode?: DeviceParameterSourceType
}

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'parametersSelected', parameters: EnhancedParameter[]): void
  (e: 'parametersUpdated', data: { groupId: string; parameters: EnhancedParameter[] }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 当前选择步骤：'mode' | 'selector' | 'completed'
const currentStep = ref<'mode' | 'selector' | 'completed'>('mode')

// 选择的模式
const selectedMode = ref<DeviceParameterSourceType>('device-id')

// 是否为编辑模式
const isEditMode = computed(() => !!props.editingGroupId)

// 抽屉标题
const drawerTitle = computed(() => {
  if (isEditMode.value) {
    return '编辑设备参数组'
  }

  switch (currentStep.value) {
    case 'mode':
      return '选择参数生成方式'
    case 'selector':
      return getStepTitle()
    default:
      return '设备参数选择'
  }
})

/**
 * 获取当前步骤标题
 */
const getStepTitle = (): string => {
  switch (selectedMode.value) {
    case 'device-id':
      return '设备ID选择器'
    case 'device-metric':
      return '设备指标选择器'
    case 'telemetry':
      return '遥测数据选择器'
    default:
      return '设备参数选择器'
  }
}

/**
 * 初始化编辑模式
 */
const initEditMode = () => {
  if (isEditMode.value && props.preSelectedMode) {
    selectedMode.value = props.preSelectedMode
    currentStep.value = 'selector'
  } else {
    currentStep.value = 'mode'
  }
}

/**
 * 处理模式选择
 */
const handleModeSelected = (mode: DeviceParameterSourceType) => {
  selectedMode.value = mode
  currentStep.value = 'selector'
}

/**
 * 处理设备ID选择完成
 */
const handleDeviceIdSelected = (device: DeviceInfo) => {
  // 生成参数
  const result = generateDeviceIdParameters(device)
  const parameters = convertToEnhancedParameters(result)

  // 注册参数组
  globalParameterGroupManager.addGroup(result.groupInfo)

  if (isEditMode.value) {
    // 编辑模式：发射更新事件
    emit('parametersUpdated', {
      groupId: props.editingGroupId!,
      parameters
    })
  } else {
    // 新建模式：发射选择事件
    emit('parametersSelected', parameters)
  }

  closeDrawer()
}

/**
 * 处理设备指标选择完成
 */
const handleDeviceMetricSelected = (data: { device: DeviceInfo; metric: DeviceMetric }) => {
  // 生成参数
  const result = generateDeviceMetricParameters(data.device, data.metric)
  const parameters = convertToEnhancedParameters(result)

  // 注册参数组
  globalParameterGroupManager.addGroup(result.groupInfo)

  if (isEditMode.value) {
    // 编辑模式：发射更新事件
    emit('parametersUpdated', {
      groupId: props.editingGroupId!,
      parameters
    })
  } else {
    // 新建模式：发射选择事件
    emit('parametersSelected', parameters)
  }

  closeDrawer()
}

/**
 * 处理取消选择
 */
const handleCancel = () => {
  if (currentStep.value === 'selector' && !isEditMode.value) {
    // 返回模式选择
    currentStep.value = 'mode'
  } else {
    // 关闭抽屉
    closeDrawer()
  }
}

/**
 * 关闭抽屉
 */
const closeDrawer = () => {
  emit('update:visible', false)
  // 延迟重置状态，避免关闭动画时看到状态变化
  nextTick(() => {
    currentStep.value = 'mode'
    selectedMode.value = 'device-id'
  })
}

/**
 * 监听抽屉显示状态
 */
const handleDrawerVisibilityChange = (visible: boolean) => {
  if (visible) {
    initEditMode()
  } else {
    emit('update:visible', false)
  }
}
</script>

<template>
  <n-drawer :show="visible" width="600" placement="right" @update:show="handleDrawerVisibilityChange">
    <n-drawer-content :title="drawerTitle" closable>
      <!-- 模式选择步骤 -->
      <DeviceSelectionModeChooser
        v-if="currentStep === 'mode'"
        :pre-selected-mode="selectedMode"
        @mode-selected="handleModeSelected"
        @cancel="handleCancel"
      />

      <!-- 设备ID选择器 -->
      <DeviceIdSelector
        v-else-if="currentStep === 'selector' && selectedMode === 'device-id'"
        :pre-selected-device="preSelectedDevice"
        :edit-mode="isEditMode"
        @device-selected="handleDeviceIdSelected"
        @cancel="handleCancel"
      />

      <!-- 设备指标选择器 -->
      <DeviceMetricSelector
        v-else-if="currentStep === 'selector' && selectedMode === 'device-metric'"
        :pre-selected-device="preSelectedDevice"
        :pre-selected-metric="preSelectedMetric"
        :edit-mode="isEditMode"
        @selection-completed="handleDeviceMetricSelected"
        @cancel="handleCancel"
      />

      <!-- 遥测选择器（预留） -->
      <div
        v-else-if="currentStep === 'selector' && selectedMode === 'telemetry'"
        style="padding: 40px; text-align: center"
      >
        <n-text depth="3">遥测模式选择器正在开发中，敬请期待...</n-text>
        <div style="margin-top: 20px">
          <n-button @click="handleCancel">返回</n-button>
        </div>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<style scoped>
/* 抽屉内容样式由各个子组件自行处理 */
</style>
