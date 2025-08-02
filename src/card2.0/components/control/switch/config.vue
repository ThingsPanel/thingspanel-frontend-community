<script setup lang="ts">
/**
 * Card 2.0 开关控制组件配置界面
 * 提供开关组件的各项配置选项
 */

import { ref, computed, watch } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NSwitch,
  NSelect,
  NInputNumber,
  NColorPicker,
  NCard,
  NGrid,
  NGridItem,
  NButton,
  NSpace,
  NDivider,
  NText,
  NCollapse,
  NCollapseItem
} from 'naive-ui'
import type { SwitchConfig } from './index'

// 组件属性
interface Props {
  /** 当前配置 */
  config: SwitchConfig
}

interface Emits {
  /** 配置更新事件 */
  (e: 'update:config', config: SwitchConfig): void
  /** 预览事件 */
  (e: 'preview', config: SwitchConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({} as SwitchConfig)
})

const emit = defineEmits<Emits>()

// 本地配置状态
const localConfig = ref<SwitchConfig>({
  basic: {
    title: '开关控制',
    label: '',
    showLabel: true,
    ...props.config.basic
  },
  switch: {
    size: 'medium',
    disabled: false,
    loading: false,
    round: true,
    ...props.config.switch
  },
  mapping: {
    activeValue: 1,
    inactiveValue: 0,
    dataType: 'number',
    ...props.config.mapping
  },
  style: {
    container: {
      backgroundColor: 'transparent',
      border: {
        show: false,
        width: 1,
        color: '#d9d9d9',
        radius: 4
      },
      padding: {
        top: 16,
        right: 16,
        bottom: 16,
        left: 16
      },
      textAlign: 'center',
      verticalAlign: 'middle',
      ...props.config.style?.container
    },
    switch: {
      activeColor: '#18a058',
      inactiveColor: '#d03050',
      railColor: '#e0e0e6',
      ...props.config.style?.switch
    },
    label: {
      fontSize: 14,
      color: '#333333',
      fontWeight: 'normal',
      position: 'bottom',
      spacing: 20,
      ...props.config.style?.label
    }
  },
  interaction: {
    confirm: {
      enabled: false,
      title: '确认操作',
      content: '确定要切换开关状态吗？',
      ...props.config.interaction?.confirm
    },
    debounce: {
      enabled: true,
      delay: 300,
      ...props.config.interaction?.debounce
    }
  },
  indicator: {
    show: false,
    activeText: '开启',
    inactiveText: '关闭',
    position: 'inside',
    ...props.config.indicator
  },
  animation: {
    enabled: true,
    duration: 300,
    easing: 'ease-in-out',
    ...props.config.animation
  }
})

// 选项数据
const sizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' }
]

const dataTypeOptions = [
  { label: '数字', value: 'number' },
  { label: '字符串', value: 'string' },
  { label: '布尔值', value: 'boolean' }
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

const fontWeightOptions = [
  { label: '正常', value: 'normal' },
  { label: '粗体', value: 'bold' },
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

const labelPositionOptions = [
  { label: '上方', value: 'top' },
  { label: '下方', value: 'bottom' },
  { label: '左侧', value: 'left' },
  { label: '右侧', value: 'right' }
]

const indicatorPositionOptions = [
  { label: '内部', value: 'inside' },
  { label: '外部', value: 'outside' }
]

const easingOptions = [
  { label: 'ease', value: 'ease' },
  { label: 'ease-in', value: 'ease-in' },
  { label: 'ease-out', value: 'ease-out' },
  { label: 'ease-in-out', value: 'ease-in-out' },
  { label: 'linear', value: 'linear' }
]

// 计算属性
const previewStyle = computed(() => {
  const container = localConfig.value.style?.container
  return {
    backgroundColor: container?.backgroundColor || 'transparent',
    border: container?.border?.show ? `${container.border.width}px solid ${container.border.color}` : 'none',
    borderRadius: `${container?.border?.radius || 4}px`,
    padding: `${container?.padding?.top || 16}px ${container?.padding?.right || 16}px ${container?.padding?.bottom || 16}px ${container?.padding?.left || 16}px`,
    textAlign: container?.textAlign || 'center',
    minHeight: '80px',
    display: 'flex',
    alignItems: container?.verticalAlign === 'top' ? 'flex-start' : container?.verticalAlign === 'bottom' ? 'flex-end' : 'center',
    justifyContent: container?.textAlign === 'left' ? 'flex-start' : container?.textAlign === 'right' ? 'flex-end' : 'center'
  }
})

// 方法
/**
 * 重置为默认配置
 */
const resetToDefault = () => {
  localConfig.value = {
    basic: {
      title: '开关控制',
      label: '',
      showLabel: true
    },
    switch: {
      size: 'medium',
      disabled: false,
      loading: false,
      round: true
    },
    mapping: {
      activeValue: 1,
      inactiveValue: 0,
      dataType: 'number'
    },
    style: {
      container: {
        backgroundColor: 'transparent',
        border: {
          show: false,
          width: 1,
          color: '#d9d9d9',
          radius: 4
        },
        padding: {
          top: 16,
          right: 16,
          bottom: 16,
          left: 16
        },
        textAlign: 'center',
        verticalAlign: 'middle'
      },
      switch: {
        activeColor: '#18a058',
        inactiveColor: '#d03050',
        railColor: '#e0e0e6'
      },
      label: {
        fontSize: 14,
        color: '#333333',
        fontWeight: 'normal',
        position: 'bottom',
        spacing: 20
      }
    },
    interaction: {
      confirm: {
        enabled: false,
        title: '确认操作',
        content: '确定要切换开关状态吗？'
      },
      debounce: {
        enabled: true,
        delay: 300
      }
    },
    indicator: {
      show: false,
      activeText: '开启',
      inactiveText: '关闭',
      position: 'inside'
    },
    animation: {
      enabled: true,
      duration: 300,
      easing: 'ease-in-out'
    }
  }
}

/**
 * 预览配置
 */
const previewConfig = () => {
  emit('preview', localConfig.value)
}

// 监听配置变化
watch(
  localConfig,
  (newConfig) => {
    emit('update:config', newConfig)
  },
  { deep: true }
)

// 监听外部配置变化
watch(
  () => props.config,
  (newConfig) => {
    localConfig.value = {
      ...localConfig.value,
      ...newConfig
    }
  },
  { deep: true }
)
</script>

<template>
  <div class="switch-config">
    <NForm :model="localConfig" label-placement="left" label-width="120">
      <NCollapse default-expanded-names="basic">
        <!-- 基础设置 -->
        <NCollapseItem title="基础设置" name="basic">
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="组件标题">
                <NInput 
                  v-model:value="localConfig.basic!.title" 
                  placeholder="请输入组件标题"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="开关标签">
                <NInput 
                  v-model:value="localConfig.basic!.label" 
                  placeholder="请输入开关标签"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="显示标签">
                <NSwitch v-model:value="localConfig.basic!.showLabel" />
              </NFormItem>
            </NGridItem>
          </NGrid>
        </NCollapseItem>

        <!-- 开关设置 -->
        <NCollapseItem title="开关设置" name="switch">
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="开关大小">
                <NSelect 
                  v-model:value="localConfig.switch!.size" 
                  :options="sizeOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="禁用状态">
                <NSwitch v-model:value="localConfig.switch!.disabled" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="圆形开关">
                <NSwitch v-model:value="localConfig.switch!.round" />
              </NFormItem>
            </NGridItem>
          </NGrid>
        </NCollapseItem>

        <!-- 数值映射 -->
        <NCollapseItem title="数值映射" name="mapping">
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="数据类型">
                <NSelect 
                  v-model:value="localConfig.mapping!.dataType" 
                  :options="dataTypeOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem></NGridItem>
            <NGridItem>
              <NFormItem label="开启时的值">
                <NInput 
                  v-model:value="localConfig.mapping!.activeValue" 
                  placeholder="开启时的值"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="关闭时的值">
                <NInput 
                  v-model:value="localConfig.mapping!.inactiveValue" 
                  placeholder="关闭时的值"
                />
              </NFormItem>
            </NGridItem>
          </NGrid>
        </NCollapseItem>

        <!-- 样式设置 -->
        <NCollapseItem title="样式设置" name="style">
          <!-- 容器样式 -->
          <NText strong>容器样式</NText>
          <NDivider />
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="背景色">
                <NColorPicker 
                  v-model:value="localConfig.style!.container!.backgroundColor" 
                  :show-alpha="true"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="显示边框">
                <NSwitch v-model:value="localConfig.style!.container!.border!.show" />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.style!.container!.border!.show">
              <NFormItem label="边框宽度">
                <NInputNumber 
                  v-model:value="localConfig.style!.container!.border!.width" 
                  :min="1" 
                  :max="10"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.style!.container!.border!.show">
              <NFormItem label="边框颜色">
                <NColorPicker v-model:value="localConfig.style!.container!.border!.color" />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.style!.container!.border!.show">
              <NFormItem label="圆角半径">
                <NInputNumber 
                  v-model:value="localConfig.style!.container!.border!.radius" 
                  :min="0" 
                  :max="50"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem></NGridItem>
            <NGridItem>
              <NFormItem label="水平对齐">
                <NSelect 
                  v-model:value="localConfig.style!.container!.textAlign" 
                  :options="textAlignOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="垂直对齐">
                <NSelect 
                  v-model:value="localConfig.style!.container!.verticalAlign" 
                  :options="verticalAlignOptions"
                />
              </NFormItem>
            </NGridItem>
          </NGrid>

          <!-- 内边距 -->
          <NText strong>内边距</NText>
          <NDivider />
          <NGrid :cols="4" :x-gap="16">
            <NGridItem>
              <NFormItem label="上">
                <NInputNumber 
                  v-model:value="localConfig.style!.container!.padding!.top" 
                  :min="0" 
                  :max="100"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="右">
                <NInputNumber 
                  v-model:value="localConfig.style!.container!.padding!.right" 
                  :min="0" 
                  :max="100"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="下">
                <NInputNumber 
                  v-model:value="localConfig.style!.container!.padding!.bottom" 
                  :min="0" 
                  :max="100"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="左">
                <NInputNumber 
                  v-model:value="localConfig.style!.container!.padding!.left" 
                  :min="0" 
                  :max="100"
                />
              </NFormItem>
            </NGridItem>
          </NGrid>

          <!-- 开关样式 -->
          <NText strong>开关样式</NText>
          <NDivider />
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="激活颜色">
                <NColorPicker v-model:value="localConfig.style!.switch!.activeColor" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="非激活颜色">
                <NColorPicker v-model:value="localConfig.style!.switch!.inactiveColor" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="轨道颜色">
                <NColorPicker v-model:value="localConfig.style!.switch!.railColor" />
              </NFormItem>
            </NGridItem>
          </NGrid>

          <!-- 标签样式 -->
          <NText strong>标签样式</NText>
          <NDivider />
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="字体大小">
                <NInputNumber 
                  v-model:value="localConfig.style!.label!.fontSize" 
                  :min="10" 
                  :max="32"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="字体颜色">
                <NColorPicker v-model:value="localConfig.style!.label!.color" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="字体粗细">
                <NSelect 
                  v-model:value="localConfig.style!.label!.fontWeight" 
                  :options="fontWeightOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="标签位置">
                <NSelect 
                  v-model:value="localConfig.style!.label!.position" 
                  :options="labelPositionOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="间距">
                <NInputNumber 
                  v-model:value="localConfig.style!.label!.spacing" 
                  :min="0" 
                  :max="50"
                />
              </NFormItem>
            </NGridItem>
          </NGrid>
        </NCollapseItem>

        <!-- 交互设置 -->
        <NCollapseItem title="交互设置" name="interaction">
          <!-- 确认对话框 -->
          <NText strong>确认对话框</NText>
          <NDivider />
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="启用确认">
                <NSwitch v-model:value="localConfig.interaction!.confirm!.enabled" />
              </NFormItem>
            </NGridItem>
            <NGridItem></NGridItem>
            <NGridItem v-if="localConfig.interaction!.confirm!.enabled">
              <NFormItem label="对话框标题">
                <NInput 
                  v-model:value="localConfig.interaction!.confirm!.title" 
                  placeholder="确认操作"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.interaction!.confirm!.enabled">
              <NFormItem label="对话框内容">
                <NInput 
                  v-model:value="localConfig.interaction!.confirm!.content" 
                  placeholder="确定要切换开关状态吗？"
                />
              </NFormItem>
            </NGridItem>
          </NGrid>

          <!-- 防抖设置 -->
          <NText strong>防抖设置</NText>
          <NDivider />
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="启用防抖">
                <NSwitch v-model:value="localConfig.interaction!.debounce!.enabled" />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.interaction!.debounce!.enabled">
              <NFormItem label="延迟时间(ms)">
                <NInputNumber 
                  v-model:value="localConfig.interaction!.debounce!.delay" 
                  :min="0" 
                  :max="2000"
                />
              </NFormItem>
            </NGridItem>
          </NGrid>
        </NCollapseItem>

        <!-- 状态指示 -->
        <NCollapseItem title="状态指示" name="indicator">
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="显示指示器">
                <NSwitch v-model:value="localConfig.indicator!.show" />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.indicator!.show">
              <NFormItem label="指示器位置">
                <NSelect 
                  v-model:value="localConfig.indicator!.position" 
                  :options="indicatorPositionOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.indicator!.show">
              <NFormItem label="开启文本">
                <NInput 
                  v-model:value="localConfig.indicator!.activeText" 
                  placeholder="开启"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.indicator!.show">
              <NFormItem label="关闭文本">
                <NInput 
                  v-model:value="localConfig.indicator!.inactiveText" 
                  placeholder="关闭"
                />
              </NFormItem>
            </NGridItem>
          </NGrid>
        </NCollapseItem>

        <!-- 动画设置 -->
        <NCollapseItem title="动画设置" name="animation">
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="启用动画">
                <NSwitch v-model:value="localConfig.animation!.enabled" />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.animation!.enabled">
              <NFormItem label="动画时长(ms)">
                <NInputNumber 
                  v-model:value="localConfig.animation!.duration" 
                  :min="100" 
                  :max="2000"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.animation!.enabled">
              <NFormItem label="缓动函数">
                <NSelect 
                  v-model:value="localConfig.animation!.easing" 
                  :options="easingOptions"
                />
              </NFormItem>
            </NGridItem>
          </NGrid>
        </NCollapseItem>
      </NCollapse>

      <!-- 预览区域 -->
      <NDivider>预览</NDivider>
      <NCard title="组件预览" size="small">
        <div class="preview-container" :style="previewStyle">
          <NSwitch 
            :size="localConfig.switch?.size || 'medium'"
            :disabled="localConfig.switch?.disabled"
            :round="localConfig.switch?.round"
            model-value
          />
          <NText 
            v-if="localConfig.basic?.showLabel"
            :style="{
              fontSize: `${localConfig.style?.label?.fontSize || 14}px`,
              color: localConfig.style?.label?.color || '#333333',
              fontWeight: localConfig.style?.label?.fontWeight || 'normal'
            }"
          >
            {{ localConfig.basic?.label || localConfig.basic?.title || '开关控制' }}
          </NText>
        </div>
      </NCard>

      <!-- 操作按钮 -->
      <NDivider />
      <NSpace justify="end">
        <NButton @click="resetToDefault">重置为默认</NButton>
        <NButton type="primary" @click="previewConfig">预览配置</NButton>
      </NSpace>
    </NForm>
  </div>
</template>

<style scoped>
.switch-config {
  padding: 16px;
  max-height: 80vh;
  overflow-y: auto;
}

.preview-container {
  min-height: 80px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-direction: column;
}

:deep(.n-form-item-label) {
  font-size: 13px;
}

:deep(.n-collapse-item__header) {
  font-weight: 600;
}
</style>