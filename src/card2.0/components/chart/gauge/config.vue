<script setup lang="ts">
import { computed, ref } from 'vue'
import { 
  NForm, 
  NFormItem, 
  NInput, 
  NInputNumber, 
  NSwitch, 
  NSelect, 
  NColorPicker, 
  NCard,
  NSpace,
  NButton,
  NDivider,
  NSlider
} from 'naive-ui'
import type { GaugeConfig } from './index'
import { $t } from '@/locales'

interface Props {
  config: GaugeConfig
}

interface Emits {
  (e: 'update:config', config: GaugeConfig): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 本地配置状态
const localConfig = ref<GaugeConfig>({ ...props.config })

// 选项配置
const easingOptions = [
  { label: '线性', value: 'linear' },
  { label: '缓入', value: 'easeIn' },
  { label: '缓出', value: 'easeOut' },
  { label: '缓入缓出', value: 'easeInOut' },
  { label: '立方缓出', value: 'cubicOut' },
  { label: '弹性', value: 'elasticOut' }
]

// 更新配置
const updateConfig = () => {
  emit('update:config', { ...localConfig.value })
}

// 重置为默认值
const resetToDefault = () => {
  localConfig.value = {
    title: '仪表盘',
    value: {
      min: 0,
      max: 100,
      current: 0,
      unit: '',
      precision: 1
    },
    gauge: {
      startAngle: 180,
      endAngle: -45,
      radius: '100%',
      center: ['50%', '80%'],
      splitNumber: 1,
      axisLineWidth: 30,
      showPointer: false,
      showSplitLine: false,
      showAxisLabel: true
    },
    colors: {
      progressColor: '#105ba8',
      trackColor: '#ddd',
      textColor: '#333333',
      labelColor: '#666666',
      pointerColor: '#105ba8',
      gradient: {
        enabled: false,
        colors: []
      }
    },
    text: {
      showValue: true,
      showUnit: true,
      showTitle: true,
      valueFontSize: 20,
      titleFontSize: 16,
      labelFontSize: 14,
      valueOffset: ['0', '-20%'],
      titleOffset: ['0', '20%']
    },
    thresholds: {
      enabled: false,
      ranges: []
    },
    animation: {
      enabled: true,
      duration: 1000,
      easing: 'cubicOut',
      valueAnimation: true
    },
    data: {
      fieldName: 'value',
      defaultValue: 0,
      formatter: '{value}'
    },
    autoRefresh: {
      enabled: false,
      interval: 30
    }
  }
  updateConfig()
}

// 确保配置结构完整
const ensureConfigStructure = () => {
  if (!localConfig.value.value) localConfig.value.value = {}
  if (!localConfig.value.gauge) localConfig.value.gauge = {}
  if (!localConfig.value.colors) localConfig.value.colors = {}
  if (!localConfig.value.colors.gradient) localConfig.value.colors.gradient = {}
  if (!localConfig.value.text) localConfig.value.text = {}
  if (!localConfig.value.thresholds) localConfig.value.thresholds = {}
  if (!localConfig.value.animation) localConfig.value.animation = {}
  if (!localConfig.value.data) localConfig.value.data = {}
  if (!localConfig.value.autoRefresh) localConfig.value.autoRefresh = {}
}

ensureConfigStructure()
</script>

<template>
  <div class="gauge-config">
    <NForm :model="localConfig" label-placement="top" @submit.prevent>
      <!-- 基础设置 -->
      <NCard title="基础设置" size="small" class="config-section">
        <NFormItem label="组件标题">
          <NInput 
            v-model:value="localConfig.title" 
            placeholder="请输入组件标题"
            @blur="updateConfig"
          />
        </NFormItem>
      </NCard>

      <!-- 数值设置 -->
      <NCard title="数值设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="最小值">
            <NInputNumber 
              v-model:value="localConfig.value!.min" 
              placeholder="最小值"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="最大值">
            <NInputNumber 
              v-model:value="localConfig.value!.max" 
              placeholder="最大值"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="数值单位">
            <NInput 
              v-model:value="localConfig.value!.unit" 
              placeholder="请输入单位"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="数值精度">
            <NInputNumber 
              v-model:value="localConfig.value!.precision" 
              placeholder="数值精度"
              :min="0"
              :max="10"
              :precision="0"
              @blur="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 仪表盘设置 -->
      <NCard title="仪表盘设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="起始角度">
            <NSlider 
              v-model:value="localConfig.gauge!.startAngle" 
              :min="0"
              :max="360"
              :step="1"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.gauge!.startAngle" 
              :min="0"
              :max="360"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="结束角度">
            <NSlider 
              v-model:value="localConfig.gauge!.endAngle" 
              :min="-360"
              :max="360"
              :step="1"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.gauge!.endAngle" 
              :min="-360"
              :max="360"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="半径">
            <NInput 
              v-model:value="localConfig.gauge!.radius" 
              placeholder="例如: 100%, 80px"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="轴线宽度">
            <NSlider 
              v-model:value="localConfig.gauge!.axisLineWidth" 
              :min="1"
              :max="100"
              :step="1"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.gauge!.axisLineWidth" 
              :min="1"
              :max="100"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="显示指针">
            <NSwitch 
              v-model:value="localConfig.gauge!.showPointer" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="显示刻度线">
            <NSwitch 
              v-model:value="localConfig.gauge!.showSplitLine" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="显示刻度标签">
            <NSwitch 
              v-model:value="localConfig.gauge!.showAxisLabel" 
              @update:value="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 颜色设置 -->
      <NCard title="颜色设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="进度颜色">
            <NColorPicker 
              v-model:value="localConfig.colors!.progressColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="轨道颜色">
            <NColorPicker 
              v-model:value="localConfig.colors!.trackColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="文字颜色">
            <NColorPicker 
              v-model:value="localConfig.colors!.textColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="标签颜色">
            <NColorPicker 
              v-model:value="localConfig.colors!.labelColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.gauge!.showPointer" label="指针颜色">
            <NColorPicker 
              v-model:value="localConfig.colors!.pointerColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 文字设置 -->
      <NCard title="文字设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="显示数值">
            <NSwitch 
              v-model:value="localConfig.text!.showValue" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="显示单位">
            <NSwitch 
              v-model:value="localConfig.text!.showUnit" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="显示标题">
            <NSwitch 
              v-model:value="localConfig.text!.showTitle" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.text!.showValue" label="数值字体大小">
            <NSlider 
              v-model:value="localConfig.text!.valueFontSize" 
              :min="10"
              :max="100"
              :step="1"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.text!.valueFontSize" 
              :min="10"
              :max="100"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.text!.showTitle" label="标题字体大小">
            <NSlider 
              v-model:value="localConfig.text!.titleFontSize" 
              :min="10"
              :max="50"
              :step="1"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.text!.titleFontSize" 
              :min="10"
              :max="50"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.gauge!.showAxisLabel" label="标签字体大小">
            <NSlider 
              v-model:value="localConfig.text!.labelFontSize" 
              :min="8"
              :max="30"
              :step="1"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.text!.labelFontSize" 
              :min="8"
              :max="30"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 阈值设置 -->
      <NCard title="阈值设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="启用阈值">
            <NSwitch 
              v-model:value="localConfig.thresholds!.enabled" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <!-- 这里可以添加阈值范围配置，暂时简化 -->
          <div v-if="localConfig.thresholds!.enabled" class="threshold-hint">
            <p style="color: #666; font-size: 12px; margin: 0;">
              阈值配置功能将在后续版本中完善
            </p>
          </div>
        </NSpace>
      </NCard>

      <!-- 动画设置 -->
      <NCard title="动画设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="启用动画">
            <NSwitch 
              v-model:value="localConfig.animation!.enabled" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.animation!.enabled" label="动画持续时间(ms)">
            <NSlider 
              v-model:value="localConfig.animation!.duration" 
              :min="100"
              :max="5000"
              :step="100"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.animation!.duration" 
              :min="100"
              :max="5000"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.animation!.enabled" label="缓动函数">
            <NSelect 
              v-model:value="localConfig.animation!.easing" 
              :options="easingOptions"
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.animation!.enabled" label="数值变化动画">
            <NSwitch 
              v-model:value="localConfig.animation!.valueAnimation" 
              @update:value="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 数据设置 -->
      <NCard title="数据设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="数据字段名">
            <NInput 
              v-model:value="localConfig.data!.fieldName" 
              placeholder="数据字段名"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="默认值">
            <NInputNumber 
              v-model:value="localConfig.data!.defaultValue" 
              placeholder="默认值"
              @blur="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 自动刷新设置 -->
      <NCard title="自动刷新" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="启用自动刷新">
            <NSwitch 
              v-model:value="localConfig.autoRefresh!.enabled" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.autoRefresh!.enabled" label="刷新间隔(秒)">
            <NSlider 
              v-model:value="localConfig.autoRefresh!.interval" 
              :min="1"
              :max="3600"
              :step="1"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.autoRefresh!.interval" 
              :min="1"
              :max="3600"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 操作按钮 -->
      <NCard size="small" class="config-section">
        <NSpace justify="center">
          <NButton type="primary" @click="updateConfig">
            应用配置
          </NButton>
          <NButton @click="resetToDefault">
            重置为默认值
          </NButton>
        </NSpace>
      </NCard>
    </NForm>
  </div>
</template>

<style scoped>
.gauge-config {
  padding: 16px;
  max-height: 70vh;
  overflow-y: auto;
}

.config-section {
  margin-bottom: 16px;
}

.config-section:last-child {
  margin-bottom: 0;
}

.threshold-hint {
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  border-left: 4px solid #18a058;
}

:deep(.n-card-header) {
  padding: 12px 16px;
  font-weight: 600;
}

:deep(.n-card__content) {
  padding: 16px;
}

:deep(.n-form-item) {
  margin-bottom: 12px;
}

:deep(.n-form-item:last-child) {
  margin-bottom: 0;
}

:deep(.n-form-item-label) {
  font-size: 13px;
  font-weight: 500;
}

/* 滚动条样式 */
.gauge-config::-webkit-scrollbar {
  width: 6px;
}

.gauge-config::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.gauge-config::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.gauge-config::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>