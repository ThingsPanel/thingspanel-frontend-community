<!--
gauge-dashboard-v2 组件属性配置面板
用于右侧配置面板显示组件属性设置
-->
<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { 
  NForm, 
  NFormItem, 
  NInput, 
  NInputNumber, 
  NSelect, 
  NSwitch, 
  NColorPicker, 
  NButton,
  NSpace,
  NCard,
  NDivider,
  NCollapse,
  NCollapseItem,
  NIcon
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { GaugeDashboardCustomize } from './settingConfig'

/**
 * Props 定义
 */
interface Props {
  /** 组件配置 */
  modelValue: {
    customize: GaugeDashboardCustomize
  }
  /** 组件ID */
  componentId?: string
  /** 是否只读 */
  readonly?: boolean
}

/**
 * Emits 定义
 */
interface Emits {
  /** 配置更新事件 */
  'update:modelValue': [config: Props['modelValue']]
  /** 配置变化事件 */
  'change': [config: Props['modelValue']]
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

/**
 * 本地配置状态
 */
const localConfig = reactive<Props['modelValue']>({
  customize: { ...props.modelValue.customize }
})

/**
 * 监听外部配置变化
 */
watch(
  () => props.modelValue,
  (newValue) => {
    Object.assign(localConfig, newValue)
  },
  { deep: true }
)

/**
 * 监听本地配置变化并同步到外部
 */
watch(
  localConfig,
  (newConfig) => {
    emit('update:modelValue', newConfig)
    emit('change', newConfig)
  },
  { deep: true }
)

/**
 * 显示模式选项
 */
const displayModeOptions = [
  { label: '弧形', value: 'arc' },
  { label: '半圆', value: 'semi-circle' },
  { label: '全圆', value: 'full-circle' },
  { label: '线性', value: 'linear' }
]

/**
 * 仪表盘类型选项
 */
const gaugeTypeOptions = [
  { label: '普通', value: 'normal' },
  { label: '速度计', value: 'speedometer' },
  { label: '温度计', value: 'temperature' },
  { label: '进度条', value: 'progress' },
  { label: '电池', value: 'battery' }
]

/**
 * 指针样式选项
 */
const pointerStyleOptions = [
  { label: '箭头', value: 'arrow' },
  { label: '线条', value: 'line' },
  { label: '三角形', value: 'triangle' }
]

/**
 * 动画类型选项
 */
const animationTypeOptions = [
  { label: '线性', value: 'linear' },
  { label: '缓入', value: 'ease-in' },
  { label: '缓出', value: 'ease-out' },
  { label: '缓入缓出', value: 'ease-in-out' },
  { label: '弹跳', value: 'bounce' }
]

/**
 * 重置为默认配置
 */
const resetToDefault = () => {
  const defaultConfig: GaugeDashboardCustomize = {
    title: '数据仪表盘V2',
    displayMode: 'arc',
    gaugeType: 'normal',
    
    // 数值设置
    minValue: 0,
    maxValue: 100,
    currentValue: 50,
    unit: '',
    decimal: 1,
    
    // 外观设置
    radius: 120,
    startAngle: 225,
    endAngle: -45,
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
    borderWidth: 2,
    
    // 刻度配置
    tickConfig: {
      show: true,
      majorCount: 6,
      minorCount: 2,
      color: '#6c757d'
    },
    
    // 指针配置
    pointerConfig: {
      color: '#1890ff',
      width: 4,
      lengthRatio: 0.8,
      style: 'arrow'
    },
    
    // 颜色区间
    colorRanges: [
      { from: 0, to: 60, color: '#52c41a', label: '正常' },
      { from: 60, to: 80, color: '#faad14', label: '警告' },
      { from: 80, to: 100, color: '#f5222d', label: '危险' }
    ],
    
    // 显示设置
    showValue: true,
    showUnit: true,
    showTitle: true,
    valueFontSize: 24,
    titleFontSize: 16,
    
    // 动画设置
    enableAnimation: true,
    animationDuration: 1000,
    animationType: 'ease-out',
    
    // 警告设置
    warningThreshold: 70,
    dangerThreshold: 90,
    enableThresholdAlert: false,
    
    // 交互设置
    clickable: false,
    showTooltip: true,
    tooltipTemplate: '{title}: {value}{unit}'
  }
  
  localConfig.customize = defaultConfig
}
</script>

<template>
  <div class="gauge-dashboard-v2-setting">
    <!-- 配置面板标题 -->
    <div class="setting-header">
      <h4>仪表盘V2 属性配置</h4>
      <n-button size="small" type="default" @click="resetToDefault">
        重置默认
      </n-button>
    </div>

    <n-form
      :model="localConfig.customize"
      label-placement="left"
      label-width="100px"
      size="small"
      class="gauge-config-form"
    >
      <!-- 基础设置折叠面板 -->
      <n-collapse :default-expanded-names="['basic', 'display']">
        <!-- 基础设置 -->
        <n-collapse-item name="basic" title="🎯 基础设置">
          <n-form-item label="标题">
            <n-input
              v-model:value="localConfig.customize.title"
              placeholder="请输入仪表盘标题"
              :disabled="readonly"
            />
          </n-form-item>

          <n-form-item label="显示模式">
            <n-select
              v-model:value="localConfig.customize.displayMode"
              :options="displayModeOptions"
              :disabled="readonly"
            />
          </n-form-item>

          <n-form-item label="仪表盘类型">
            <n-select
              v-model:value="localConfig.customize.gaugeType"
              :options="gaugeTypeOptions"
              :disabled="readonly"
            />
          </n-form-item>
        </n-collapse-item>

        <!-- 数值设置 -->
        <n-collapse-item name="values" title="🔢 数值设置">
          <n-space vertical>
            <n-space>
              <n-form-item label="最小值">
                <n-input-number
                  v-model:value="localConfig.customize.minValue"
                  :disabled="readonly"
                  style="width: 100px"
                />
              </n-form-item>
              
              <n-form-item label="最大值">
                <n-input-number
                  v-model:value="localConfig.customize.maxValue"
                  :disabled="readonly"
                  style="width: 100px"
                />
              </n-form-item>
            </n-space>

            <n-space>
              <n-form-item label="当前值">
                <n-input-number
                  v-model:value="localConfig.customize.currentValue"
                  :min="localConfig.customize.minValue"
                  :max="localConfig.customize.maxValue"
                  :disabled="readonly"
                  style="width: 100px"
                />
              </n-form-item>
              
              <n-form-item label="单位">
                <n-input
                  v-model:value="localConfig.customize.unit"
                  placeholder="如: ℃, %, km/h"
                  :disabled="readonly"
                  style="width: 100px"
                />
              </n-form-item>
            </n-space>

            <n-form-item label="小数位数">
              <n-input-number
                v-model:value="localConfig.customize.decimal"
                :min="0"
                :max="3"
                :disabled="readonly"
                style="width: 100px"
              />
            </n-form-item>
          </n-space>
        </n-collapse-item>

        <!-- 显示设置 -->
        <n-collapse-item name="display" title="👁️ 显示设置">
          <n-space vertical>
            <n-space>
              <n-form-item label="显示数值">
                <n-switch
                  v-model:value="localConfig.customize.showValue"
                  :disabled="readonly"
                />
              </n-form-item>
              
              <n-form-item label="显示单位">
                <n-switch
                  v-model:value="localConfig.customize.showUnit"
                  :disabled="readonly"
                />
              </n-form-item>
              
              <n-form-item label="显示标题">
                <n-switch
                  v-model:value="localConfig.customize.showTitle"
                  :disabled="readonly"
                />
              </n-form-item>
            </n-space>

            <n-space>
              <n-form-item label="数值字体大小">
                <n-input-number
                  v-model:value="localConfig.customize.valueFontSize"
                  :min="12"
                  :max="48"
                  :disabled="readonly"
                  style="width: 100px"
                />
              </n-form-item>
              
              <n-form-item label="标题字体大小">
                <n-input-number
                  v-model:value="localConfig.customize.titleFontSize"
                  :min="12"
                  :max="32"
                  :disabled="readonly"
                  style="width: 100px"
                />
              </n-form-item>
            </n-space>
          </n-space>
        </n-collapse-item>

        <!-- 外观设置 -->
        <n-collapse-item name="appearance" title="🎨 外观设置">
          <n-space vertical>
            <n-form-item label="半径">
              <n-input-number
                v-model:value="localConfig.customize.radius"
                :min="50"
                :max="300"
                :step="10"
                :disabled="readonly"
                style="width: 100px"
              />
            </n-form-item>

            <n-space>
              <n-form-item label="起始角度">
                <n-input-number
                  v-model:value="localConfig.customize.startAngle"
                  :min="0"
                  :max="360"
                  :disabled="readonly"
                  style="width: 100px"
                />
              </n-form-item>
              
              <n-form-item label="结束角度">
                <n-input-number
                  v-model:value="localConfig.customize.endAngle"
                  :min="-360"
                  :max="360"
                  :disabled="readonly"
                  style="width: 100px"
                />
              </n-form-item>
            </n-space>
          </n-space>
        </n-collapse-item>

        <!-- 指针设置 -->
        <n-collapse-item name="pointer" title="📍 指针设置">
          <n-space vertical>
            <n-form-item label="指针颜色">
              <n-color-picker
                v-model:value="localConfig.customize.pointerConfig.color"
                :disabled="readonly"
                :show-alpha="false"
              />
            </n-form-item>

            <n-space>
              <n-form-item label="指针宽度">
                <n-input-number
                  v-model:value="localConfig.customize.pointerConfig.width"
                  :min="1"
                  :max="10"
                  :disabled="readonly"
                  style="width: 100px"
                />
              </n-form-item>
              
              <n-form-item label="指针长度">
                <n-input-number
                  v-model:value="localConfig.customize.pointerConfig.lengthRatio"
                  :min="0.1"
                  :max="1"
                  :step="0.1"
                  :disabled="readonly"
                  style="width: 100px"
                />
              </n-form-item>
            </n-space>

            <n-form-item label="指针样式">
              <n-select
                v-model:value="localConfig.customize.pointerConfig.style"
                :options="pointerStyleOptions"
                :disabled="readonly"
              />
            </n-form-item>
          </n-space>
        </n-collapse-item>

        <!-- 动画设置 -->
        <n-collapse-item name="animation" title="🎬 动画设置">
          <n-space vertical>
            <n-form-item label="启用动画">
              <n-switch
                v-model:value="localConfig.customize.enableAnimation"
                :disabled="readonly"
              />
            </n-form-item>

            <n-space v-if="localConfig.customize.enableAnimation">
              <n-form-item label="动画持续时间">
                <n-input-number
                  v-model:value="localConfig.customize.animationDuration"
                  :min="100"
                  :max="3000"
                  :step="100"
                  :disabled="readonly"
                  style="width: 100px"
                />
              </n-form-item>
              
              <n-form-item label="动画类型">
                <n-select
                  v-model:value="localConfig.customize.animationType"
                  :options="animationTypeOptions"
                  :disabled="readonly"
                  style="width: 120px"
                />
              </n-form-item>
            </n-space>
          </n-space>
        </n-collapse-item>

        <!-- 警告设置 -->
        <n-collapse-item name="alert" title="⚠️ 警告设置">
          <n-space vertical>
            <n-form-item label="启用阈值警告">
              <n-switch
                v-model:value="localConfig.customize.enableThresholdAlert"
                :disabled="readonly"
              />
            </n-form-item>

            <n-space v-if="localConfig.customize.enableThresholdAlert">
              <n-form-item label="警告阈值">
                <n-input-number
                  v-model:value="localConfig.customize.warningThreshold"
                  :min="localConfig.customize.minValue"
                  :max="localConfig.customize.dangerThreshold - 1"
                  :disabled="readonly"
                  style="width: 100px"
                />
              </n-form-item>
              
              <n-form-item label="危险阈值">
                <n-input-number
                  v-model:value="localConfig.customize.dangerThreshold"
                  :min="localConfig.customize.warningThreshold + 1"
                  :max="localConfig.customize.maxValue"
                  :disabled="readonly"
                  style="width: 100px"
                />
              </n-form-item>
            </n-space>
          </n-space>
        </n-collapse-item>

        <!-- 交互设置 -->
        <n-collapse-item name="interaction" title="🖱️ 交互设置">
          <n-space vertical>
            <n-form-item label="可点击">
              <n-switch
                v-model:value="localConfig.customize.clickable"
                :disabled="readonly"
              />
            </n-form-item>

            <n-form-item label="显示提示信息">
              <n-switch
                v-model:value="localConfig.customize.showTooltip"
                :disabled="readonly"
              />
            </n-form-item>

            <n-form-item v-if="localConfig.customize.showTooltip" label="提示信息模板">
              <n-input
                v-model:value="localConfig.customize.tooltipTemplate"
                placeholder="支持变量: {value}, {unit}, {title}"
                type="textarea"
                :disabled="readonly"
                :autosize="{ minRows: 2, maxRows: 4 }"
              />
            </n-form-item>
          </n-space>
        </n-collapse-item>
      </n-collapse>
    </n-form>
  </div>
</template>

<style scoped>
.gauge-dashboard-v2-setting {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.setting-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.gauge-config-form {
  max-width: none;
}

.gauge-config-form :deep(.n-form-item) {
  margin-bottom: 12px;
}

.gauge-config-form :deep(.n-form-item-label) {
  font-size: 12px;
  color: var(--text-color-2);
}

/* 折叠面板样式优化 */
:deep(.n-collapse-item__header) {
  font-size: 13px;
  font-weight: 500;
  padding: 8px 0;
}

:deep(.n-collapse-item__content-inner) {
  padding: 12px 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .gauge-config-form :deep(.n-form-item) {
    margin-bottom: 8px;
  }
  
  .gauge-config-form :deep(.n-form-item-label) {
    min-width: 80px !important;
  }
}
</style>