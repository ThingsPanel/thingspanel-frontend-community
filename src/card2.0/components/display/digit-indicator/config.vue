<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import { NForm, NFormItem, NInput, NColorPicker, NSwitch, NInputNumber, NSelect, NCard, NSpace, NDivider } from 'naive-ui'
import type { IConfigCtx } from '../../../core/types/component'
import IconSelector from '@/components/common/icon-selector.vue'
import { $t } from '@/locales'

// 注入配置上下文
const ctx = inject<IConfigCtx>('config-ctx')!

// 字体大小选项
const fontSizeOptions = [
  { label: '小', value: 12 },
  { label: '中', value: 16 },
  { label: '大', value: 20 },
  { label: '特大', value: 24 }
]

// 动画持续时间选项
const animationDurationOptions = [
  { label: '快速 (0.5s)', value: 500 },
  { label: '正常 (1s)', value: 1000 },
  { label: '慢速 (2s)', value: 2000 },
  { label: '很慢 (3s)', value: 3000 }
]

// 确保配置对象存在
if (!ctx.config.fontSize) {
  ctx.config.fontSize = { auto: true, size: 16 }
}
if (!ctx.config.display) {
  ctx.config.display = {
    showIcon: true,
    showUnit: true,
    showMetricName: true
  }
}
if (!ctx.config.animation) {
  ctx.config.animation = {
    enabled: false,
    duration: 1000
  }
}

/**
 * 设置图标
 * @param icon 图标名称
 */
const setIcon = (icon: string) => {
  ctx.config.iconName = icon
}

/**
 * 重置配置为默认值
 */
const resetToDefaults = () => {
  ctx.config.unit = ''
  ctx.config.color = 'blue'
  ctx.config.iconName = 'Water'
  ctx.config.fontSize = { auto: true, size: 16 }
  ctx.config.display = {
    showIcon: true,
    showUnit: true,
    showMetricName: true
  }
  ctx.config.animation = {
    enabled: false,
    duration: 1000
  }
}
</script>

<template>
  <div class="digit-indicator-config">
    <NForm :model="ctx.config" label-placement="left" label-width="120">
      <!-- 基础设置 -->
      <NCard title="基础设置" class="config-section">
        <NSpace vertical>
          <NFormItem :label="$t('device_template.table_header.unit')">
            <NInput 
              v-model:value="ctx.config.unit" 
              :placeholder="$t('device_template.table_header.pleaseEnterTheUnit')"
              clearable
            />
          </NFormItem>
          
          <NFormItem :label="$t('generate.color')">
            <NColorPicker 
              v-model:value="ctx.config.color" 
              :show-alpha="false"
              :swatches="[
                '#1890ff',
                '#52c41a', 
                '#faad14',
                '#f5222d',
                '#722ed1',
                '#13c2c2',
                '#eb2f96',
                '#fa541c'
              ]"
            />
          </NFormItem>
          
          <NFormItem label="图标选择">
            <IconSelector 
              :default-icon="ctx.config.iconName || 'Water'" 
              @icon-selected="setIcon" 
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <NDivider />

      <!-- 显示设置 -->
      <NCard title="显示设置" class="config-section">
        <NSpace vertical>
          <NFormItem label="显示图标">
            <NSwitch v-model:value="ctx.config.display.showIcon" />
          </NFormItem>
          
          <NFormItem label="显示单位">
            <NSwitch v-model:value="ctx.config.display.showUnit" />
          </NFormItem>
          
          <NFormItem label="显示指标名称">
            <NSwitch v-model:value="ctx.config.display.showMetricName" />
          </NFormItem>
        </NSpace>
      </NCard>

      <NDivider />

      <!-- 字体设置 -->
      <NCard title="字体设置" class="config-section">
        <NSpace vertical>
          <NFormItem label="自动调整字体">
            <NSwitch v-model:value="ctx.config.fontSize.auto" />
          </NFormItem>
          
          <NFormItem 
            v-if="!ctx.config.fontSize.auto" 
            label="字体大小"
          >
            <NSelect
              v-model:value="ctx.config.fontSize.size"
              :options="fontSizeOptions"
              placeholder="选择字体大小"
            />
          </NFormItem>
          
          <NFormItem 
            v-if="!ctx.config.fontSize.auto" 
            label="自定义大小"
          >
            <NInputNumber
              v-model:value="ctx.config.fontSize.size"
              :min="8"
              :max="48"
              :step="1"
              placeholder="输入字体大小"
            >
              <template #suffix>px</template>
            </NInputNumber>
          </NFormItem>
        </NSpace>
      </NCard>

      <NDivider />

      <!-- 动画设置 -->
      <NCard title="动画设置" class="config-section">
        <NSpace vertical>
          <NFormItem label="启用动画">
            <NSwitch v-model:value="ctx.config.animation.enabled" />
          </NFormItem>
          
          <NFormItem 
            v-if="ctx.config.animation.enabled" 
            label="动画持续时间"
          >
            <NSelect
              v-model:value="ctx.config.animation.duration"
              :options="animationDurationOptions"
              placeholder="选择动画持续时间"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <NDivider />

      <!-- 操作按钮 -->
      <NCard title="操作" class="config-section">
        <NSpace>
          <NButton 
            type="warning" 
            ghost 
            @click="resetToDefaults"
          >
            重置为默认值
          </NButton>
        </NSpace>
      </NCard>
    </NForm>
  </div>
</template>

<style scoped>
.digit-indicator-config {
  padding: 16px;
  max-height: 600px;
  overflow-y: auto;
}

.config-section {
  margin-bottom: 16px;
}

.config-section:last-child {
  margin-bottom: 0;
}

/* 自定义滚动条样式 */
.digit-indicator-config::-webkit-scrollbar {
  width: 6px;
}

.digit-indicator-config::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.digit-indicator-config::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.digit-indicator-config::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 表单项间距调整 */
:deep(.n-form-item) {
  margin-bottom: 16px;
}

:deep(.n-form-item:last-child) {
  margin-bottom: 0;
}

/* 卡片标题样式 */
:deep(.n-card-header) {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
}

:deep(.n-card-content) {
  padding: 16px;
}
</style>