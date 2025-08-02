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
  NSlider,
  NCheckboxGroup,
  NCheckbox,
  NRadioGroup,
  NRadio,
  NDynamicInput,
  NIcon
} from 'naive-ui'
import { AddOutline, TrashOutline } from '@vicons/ionicons5'
import type { TextInfoConfig } from './index'
import { $t } from '@/locales'

interface Props {
  config: TextInfoConfig
}

interface Emits {
  (e: 'update:config', config: TextInfoConfig): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 本地配置状态
const localConfig = ref<TextInfoConfig>({ ...props.config })

// 选项配置
const metricNamePositionOptions = [
  { label: '顶部', value: 'top' },
  { label: '底部', value: 'bottom' },
  { label: '左侧', value: 'left' },
  { label: '右侧', value: 'right' }
]

const unitPositionOptions = [
  { label: '后方', value: 'after' },
  { label: '下方', value: 'below' },
  { label: '上方', value: 'above' }
]

const fontWeightOptions = [
  { label: '正常', value: 'normal' },
  { label: '粗体', value: 'bold' },
  { label: '更粗', value: 'bolder' },
  { label: '100', value: 100 },
  { label: '200', value: 200 },
  { label: '300', value: 300 },
  { label: '400', value: 400 },
  { label: '500', value: 500 },
  { label: '600', value: 600 },
  { label: '700', value: 700 },
  { label: '800', value: 800 },
  { label: '900', value: 900 }
]

const textAlignOptions = [
  { label: '左对齐', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右对齐', value: 'right' }
]

const verticalAlignOptions = [
  { label: '顶部', value: 'top' },
  { label: '中间', value: 'middle' },
  { label: '底部', value: 'bottom' }
]

const dataTypeOptions = [
  { label: '字符串', value: 'string' },
  { label: '数值', value: 'number' },
  { label: '布尔值', value: 'boolean' }
]

const animationEasingOptions = [
  { label: '线性', value: 'linear' },
  { label: '缓动', value: 'ease' },
  { label: '缓入', value: 'ease-in' },
  { label: '缓出', value: 'ease-out' },
  { label: '缓入缓出', value: 'ease-in-out' }
]

// 更新配置
const updateConfig = () => {
  emit('update:config', { ...localConfig.value })
}

// 重置为默认值
const resetToDefault = () => {
  localConfig.value = {
    title: '文本信息',
    display: {
      showMetricName: true,
      metricNamePosition: 'bottom',
      showUnit: false,
      unitPosition: 'after'
    },
    style: {
      valueFontSize: 48,
      valueFontWeight: 'bold',
      valueColor: '#333333',
      metricNameFontSize: 14,
      metricNameColor: '#666666',
      unitFontSize: 16,
      unitColor: '#999999',
      backgroundColor: 'transparent',
      border: {
        show: false,
        width: 1,
        color: '#e0e0e0',
        radius: 4
      },
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      },
      textAlign: 'center',
      verticalAlign: 'middle'
    },
    data: {
      defaultValue: '1.9.2',
      format: {
        type: 'string',
        precision: 2,
        thousandsSeparator: false
      },
      mapping: {
        enabled: false,
        rules: []
      }
    },
    animation: {
      enabled: false,
      valueChange: {
        duration: 300,
        easing: 'ease-out'
      },
      blink: {
        enabled: false,
        color: '#ff4d4f',
        count: 3,
        interval: 200
      }
    },
    responsive: {
      enabled: true,
      minFontSize: 12,
      maxFontSize: 72,
      fontScale: 0.1
    }
  }
  updateConfig()
}

// 确保配置结构完整
const ensureConfigStructure = () => {
  if (!localConfig.value.display) localConfig.value.display = {}
  if (!localConfig.value.style) localConfig.value.style = {}
  if (!localConfig.value.style.border) localConfig.value.style.border = {}
  if (!localConfig.value.style.padding) localConfig.value.style.padding = {}
  if (!localConfig.value.data) localConfig.value.data = {}
  if (!localConfig.value.data.format) localConfig.value.data.format = {}
  if (!localConfig.value.data.mapping) localConfig.value.data.mapping = {}
  if (!localConfig.value.data.mapping.rules) localConfig.value.data.mapping.rules = []
  if (!localConfig.value.animation) localConfig.value.animation = {}
  if (!localConfig.value.animation.valueChange) localConfig.value.animation.valueChange = {}
  if (!localConfig.value.animation.blink) localConfig.value.animation.blink = {}
  if (!localConfig.value.responsive) localConfig.value.responsive = {}
}

ensureConfigStructure()

// 添加映射规则
const addMappingRule = () => {
  if (!localConfig.value.data!.mapping!.rules) {
    localConfig.value.data!.mapping!.rules = []
  }
  localConfig.value.data!.mapping!.rules.push({
    value: '',
    display: '',
    color: '#333333'
  })
  updateConfig()
}

// 删除映射规则
const removeMappingRule = (index: number) => {
  if (localConfig.value.data!.mapping!.rules) {
    localConfig.value.data!.mapping!.rules.splice(index, 1)
    updateConfig()
  }
}
</script>

<template>
  <div class="text-info-config">
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

      <!-- 显示设置 -->
      <NCard title="显示设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="显示指标名称">
            <NSwitch 
              v-model:value="localConfig.display!.showMetricName" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.display!.showMetricName" label="指标名称位置">
            <NSelect 
              v-model:value="localConfig.display!.metricNamePosition" 
              :options="metricNamePositionOptions"
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.display!.showMetricName" label="自定义指标名称">
            <NInput 
              v-model:value="localConfig.display!.customMetricName" 
              placeholder="留空使用数据源中的名称"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="显示单位">
            <NSwitch 
              v-model:value="localConfig.display!.showUnit" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.display!.showUnit" label="单位位置">
            <NSelect 
              v-model:value="localConfig.display!.unitPosition" 
              :options="unitPositionOptions"
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.display!.showUnit" label="自定义单位">
            <NInput 
              v-model:value="localConfig.display!.customUnit" 
              placeholder="留空使用数据源中的单位"
              @blur="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 样式设置 -->
      <NCard title="样式设置" size="small" class="config-section">
        <NSpace vertical>
          <!-- 值样式 -->
          <NDivider title-placement="left">值样式</NDivider>
          
          <NFormItem label="值字体大小">
            <NSlider 
              v-model:value="localConfig.style!.valueFontSize" 
              :min="12"
              :max="100"
              :step="1"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.style!.valueFontSize" 
              :min="12"
              :max="100"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="值字体权重">
            <NSelect 
              v-model:value="localConfig.style!.valueFontWeight" 
              :options="fontWeightOptions"
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="值颜色">
            <NColorPicker 
              v-model:value="localConfig.style!.valueColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <!-- 指标名称样式 -->
          <NDivider title-placement="left">指标名称样式</NDivider>
          
          <NFormItem label="指标名称字体大小">
            <NSlider 
              v-model:value="localConfig.style!.metricNameFontSize" 
              :min="10"
              :max="32"
              :step="1"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.style!.metricNameFontSize" 
              :min="10"
              :max="32"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="指标名称颜色">
            <NColorPicker 
              v-model:value="localConfig.style!.metricNameColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <!-- 单位样式 -->
          <NDivider title-placement="left">单位样式</NDivider>
          
          <NFormItem label="单位字体大小">
            <NSlider 
              v-model:value="localConfig.style!.unitFontSize" 
              :min="10"
              :max="32"
              :step="1"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.style!.unitFontSize" 
              :min="10"
              :max="32"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="单位颜色">
            <NColorPicker 
              v-model:value="localConfig.style!.unitColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <!-- 容器样式 -->
          <NDivider title-placement="left">容器样式</NDivider>
          
          <NFormItem label="背景色">
            <NColorPicker 
              v-model:value="localConfig.style!.backgroundColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="显示边框">
            <NSwitch 
              v-model:value="localConfig.style!.border!.show" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.style!.border!.show" label="边框宽度">
            <NSlider 
              v-model:value="localConfig.style!.border!.width" 
              :min="1"
              :max="10"
              :step="1"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.style!.border!.width" 
              :min="1"
              :max="10"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.style!.border!.show" label="边框颜色">
            <NColorPicker 
              v-model:value="localConfig.style!.border!.color" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.style!.border!.show" label="边框圆角">
            <NSlider 
              v-model:value="localConfig.style!.border!.radius" 
              :min="0"
              :max="20"
              :step="1"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.style!.border!.radius" 
              :min="0"
              :max="20"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="文本对齐">
            <NSelect 
              v-model:value="localConfig.style!.textAlign" 
              :options="textAlignOptions"
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="垂直对齐">
            <NSelect 
              v-model:value="localConfig.style!.verticalAlign" 
              :options="verticalAlignOptions"
              @update:value="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 数据设置 -->
      <NCard title="数据设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="默认值">
            <NInput 
              v-model:value="localConfig.data!.defaultValue" 
              placeholder="无数据时显示的默认值"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <!-- 数据格式化 -->
          <NDivider title-placement="left">数据格式化</NDivider>
          
          <NFormItem label="数据类型">
            <NSelect 
              v-model:value="localConfig.data!.format!.type" 
              :options="dataTypeOptions"
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.data!.format!.type === 'number'" label="数值精度">
            <NSlider 
              v-model:value="localConfig.data!.format!.precision" 
              :min="0"
              :max="10"
              :step="1"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.data!.format!.precision" 
              :min="0"
              :max="10"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.data!.format!.type === 'number'" label="千分位分隔符">
            <NSwitch 
              v-model:value="localConfig.data!.format!.thousandsSeparator" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="前缀">
            <NInput 
              v-model:value="localConfig.data!.format!.prefix" 
              placeholder="显示值前缀"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="后缀">
            <NInput 
              v-model:value="localConfig.data!.format!.suffix" 
              placeholder="显示值后缀"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <!-- 数据映射 -->
          <NDivider title-placement="left">数据映射</NDivider>
          
          <NFormItem label="启用数据映射">
            <NSwitch 
              v-model:value="localConfig.data!.mapping!.enabled" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.data!.mapping!.enabled" label="映射规则">
            <div class="mapping-rules">
              <div 
                v-for="(rule, index) in localConfig.data!.mapping!.rules" 
                :key="index" 
                class="mapping-rule"
              >
                <NSpace>
                  <NInput 
                    v-model:value="rule.value" 
                    placeholder="原始值"
                    style="width: 100px;"
                    @blur="updateConfig"
                  />
                  <span>→</span>
                  <NInput 
                    v-model:value="rule.display" 
                    placeholder="显示值"
                    style="width: 100px;"
                    @blur="updateConfig"
                  />
                  <NColorPicker 
                    v-model:value="rule.color" 
                    @update:value="updateConfig"
                  />
                  <NButton 
                    size="small" 
                    type="error" 
                    @click="removeMappingRule(index)"
                  >
                    <template #icon>
                      <NIcon><TrashOutline /></NIcon>
                    </template>
                  </NButton>
                </NSpace>
              </div>
              
              <NButton 
                size="small" 
                type="primary" 
                dashed 
                style="margin-top: 8px;"
                @click="addMappingRule"
              >
                <template #icon>
                  <NIcon><AddOutline /></NIcon>
                </template>
                添加映射规则
              </NButton>
            </div>
          </NFormItem>
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
          
          <!-- 数值变化动画 -->
          <NDivider v-if="localConfig.animation!.enabled" title-placement="left">数值变化动画</NDivider>
          
          <NFormItem v-if="localConfig.animation!.enabled" label="动画时长(毫秒)">
            <NSlider 
              v-model:value="localConfig.animation!.valueChange!.duration" 
              :min="100"
              :max="2000"
              :step="50"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.animation!.valueChange!.duration" 
              :min="100"
              :max="2000"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.animation!.enabled" label="动画类型">
            <NSelect 
              v-model:value="localConfig.animation!.valueChange!.easing" 
              :options="animationEasingOptions"
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <!-- 闪烁提醒 -->
          <NDivider v-if="localConfig.animation!.enabled" title-placement="left">闪烁提醒</NDivider>
          
          <NFormItem v-if="localConfig.animation!.enabled" label="启用闪烁提醒">
            <NSwitch 
              v-model:value="localConfig.animation!.blink!.enabled" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.animation!.enabled && localConfig.animation!.blink!.enabled" label="闪烁颜色">
            <NColorPicker 
              v-model:value="localConfig.animation!.blink!.color" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.animation!.enabled && localConfig.animation!.blink!.enabled" label="闪烁次数">
            <NSlider 
              v-model:value="localConfig.animation!.blink!.count" 
              :min="1"
              :max="10"
              :step="1"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.animation!.blink!.count" 
              :min="1"
              :max="10"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.animation!.enabled && localConfig.animation!.blink!.enabled" label="闪烁间隔(毫秒)">
            <NSlider 
              v-model:value="localConfig.animation!.blink!.interval" 
              :min="50"
              :max="1000"
              :step="50"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.animation!.blink!.interval" 
              :min="50"
              :max="1000"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 响应式设置 -->
      <NCard title="响应式设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="启用响应式字体">
            <NSwitch 
              v-model:value="localConfig.responsive!.enabled" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.responsive!.enabled" label="最小字体大小">
            <NSlider 
              v-model:value="localConfig.responsive!.minFontSize" 
              :min="8"
              :max="24"
              :step="1"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.responsive!.minFontSize" 
              :min="8"
              :max="24"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.responsive!.enabled" label="最大字体大小">
            <NSlider 
              v-model:value="localConfig.responsive!.maxFontSize" 
              :min="24"
              :max="120"
              :step="1"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.responsive!.maxFontSize" 
              :min="24"
              :max="120"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.responsive!.enabled" label="字体缩放比例">
            <NSlider 
              v-model:value="localConfig.responsive!.fontScale" 
              :min="0.05"
              :max="0.3"
              :step="0.01"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.responsive!.fontScale" 
              :min="0.05"
              :max="0.3"
              :step="0.01"
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
.text-info-config {
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

:deep(.n-divider) {
  margin: 16px 0 12px 0;
}

:deep(.n-divider .n-divider__title) {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.mapping-rules {
  width: 100%;
}

.mapping-rule {
  margin-bottom: 8px;
}

.mapping-rule:last-child {
  margin-bottom: 0;
}

/* 滚动条样式 */
.text-info-config::-webkit-scrollbar {
  width: 6px;
}

.text-info-config::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.text-info-config::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.text-info-config::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>