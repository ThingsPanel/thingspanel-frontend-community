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
  NDivider
} from 'naive-ui'
import type { DigitSetterConfig } from './index'
import { $t } from '@/locales'

interface Props {
  config: DigitSetterConfig
}

interface Emits {
  (e: 'update:config', config: DigitSetterConfig): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 本地配置状态
const localConfig = ref<DigitSetterConfig>({ ...props.config })

// 计算属性
const fontWeightOptions = [
  { label: '正常', value: 'normal' },
  { label: '粗体', value: 'bold' },
  { label: '更粗', value: 'bolder' }
]

const textAlignOptions = [
  { label: '左对齐', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右对齐', value: 'right' }
]

const sliderSizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' }
]

// 更新配置
const updateConfig = () => {
  emit('update:config', { ...localConfig.value })
}

// 重置为默认值
const resetToDefault = () => {
  localConfig.value = {
    title: '数字设置器',
    value: {
      min: 0,
      max: 100,
      step: 0.1,
      decimals: 1,
      defaultValue: 0
    },
    display: {
      showTitle: true,
      showUnit: true,
      unit: '',
      fontSize: 14,
      fontWeight: 'normal',
      textAlign: 'center'
    },
    slider: {
      color: '#18a058',
      trackColor: '#e0e0e6',
      fillColor: '#18a058',
      size: 'medium',
      showMarks: false,
      showTooltip: true
    },
    style: {
      backgroundColor: 'transparent',
      textColor: '#333333',
      border: {
        show: false,
        width: 1,
        color: '#e0e0e0',
        radius: 4
      }
    },
    data: {
      fieldName: 'value',
      realTimeUpdate: true,
      updateDelay: 300
    },
    interaction: {
      keyboard: true,
      mouseWheel: true,
      doubleClickReset: false
    }
  }
  updateConfig()
}

// 确保配置结构完整
const ensureConfigStructure = () => {
  if (!localConfig.value.value) localConfig.value.value = {}
  if (!localConfig.value.display) localConfig.value.display = {}
  if (!localConfig.value.slider) localConfig.value.slider = {}
  if (!localConfig.value.style) localConfig.value.style = {}
  if (!localConfig.value.style.border) localConfig.value.style.border = {}
  if (!localConfig.value.data) localConfig.value.data = {}
  if (!localConfig.value.interaction) localConfig.value.interaction = {}
}

ensureConfigStructure()
</script>

<template>
  <div class="digit-setter-config">
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
          
          <NFormItem label="步长">
            <NInputNumber 
              v-model:value="localConfig.value!.step" 
              placeholder="步长"
              :step="0.001"
              :min="0.001"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="小数位数">
            <NInputNumber 
              v-model:value="localConfig.value!.decimals" 
              placeholder="小数位数"
              :min="0"
              :max="10"
              :precision="0"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="默认值">
            <NInputNumber 
              v-model:value="localConfig.value!.defaultValue" 
              placeholder="默认值"
              @blur="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 显示设置 -->
      <NCard title="显示设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="显示标题">
            <NSwitch 
              v-model:value="localConfig.display!.showTitle" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="显示单位">
            <NSwitch 
              v-model:value="localConfig.display!.showUnit" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="数值单位">
            <NInput 
              v-model:value="localConfig.display!.unit" 
              placeholder="请输入单位"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="字体大小">
            <NInputNumber 
              v-model:value="localConfig.display!.fontSize" 
              placeholder="字体大小"
              :min="10"
              :max="72"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="字体粗细">
            <NSelect 
              v-model:value="localConfig.display!.fontWeight" 
              :options="fontWeightOptions"
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="文字对齐">
            <NSelect 
              v-model:value="localConfig.display!.textAlign" 
              :options="textAlignOptions"
              @update:value="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 滑块设置 -->
      <NCard title="滑块设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="滑块颜色">
            <NColorPicker 
              v-model:value="localConfig.slider!.color" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="轨道颜色">
            <NColorPicker 
              v-model:value="localConfig.slider!.trackColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="填充颜色">
            <NColorPicker 
              v-model:value="localConfig.slider!.fillColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="滑块大小">
            <NSelect 
              v-model:value="localConfig.slider!.size" 
              :options="sliderSizeOptions"
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="显示刻度">
            <NSwitch 
              v-model:value="localConfig.slider!.showMarks" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="显示工具提示">
            <NSwitch 
              v-model:value="localConfig.slider!.showTooltip" 
              @update:value="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 样式设置 -->
      <NCard title="样式设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="背景色">
            <NColorPicker 
              v-model:value="localConfig.style!.backgroundColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="文字颜色">
            <NColorPicker 
              v-model:value="localConfig.style!.textColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NDivider title-placement="left">边框设置</NDivider>
          
          <NFormItem label="显示边框">
            <NSwitch 
              v-model:value="localConfig.style!.border!.show" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.style!.border!.show" label="边框宽度">
            <NInputNumber 
              v-model:value="localConfig.style!.border!.width" 
              placeholder="边框宽度"
              :min="1"
              :max="10"
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
            <NInputNumber 
              v-model:value="localConfig.style!.border!.radius" 
              placeholder="边框圆角"
              :min="0"
              :max="20"
              @blur="updateConfig"
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
          
          <NFormItem label="实时更新">
            <NSwitch 
              v-model:value="localConfig.data!.realTimeUpdate" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.data!.realTimeUpdate" label="更新延迟(ms)">
            <NInputNumber 
              v-model:value="localConfig.data!.updateDelay" 
              placeholder="更新延迟"
              :min="0"
              :max="5000"
              @blur="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 交互设置 -->
      <NCard title="交互设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="启用键盘控制">
            <NSwitch 
              v-model:value="localConfig.interaction!.keyboard" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="启用鼠标滚轮">
            <NSwitch 
              v-model:value="localConfig.interaction!.mouseWheel" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="双击重置">
            <NSwitch 
              v-model:value="localConfig.interaction!.doubleClickReset" 
              @update:value="updateConfig"
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
.digit-setter-config {
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

/* 滚动条样式 */
.digit-setter-config::-webkit-scrollbar {
  width: 6px;
}

.digit-setter-config::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.digit-setter-config::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.digit-setter-config::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>