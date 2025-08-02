<script setup lang="ts">
/**
 * Card 2.0 数据发送组件配置界面
 * 提供数据发送组件的各项配置选项
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
  NCollapseItem,
  NIcon
} from 'naive-ui'
import * as ionicons5 from '@vicons/ionicons5'
import type { DispatchDataConfig } from './index'
import IconSelector from '@/components/common/icon-selector.vue'

// 组件属性
interface Props {
  /** 当前配置 */
  config: DispatchDataConfig
}

interface Emits {
  /** 配置更新事件 */
  (e: 'update:config', config: DispatchDataConfig): void
  /** 预览事件 */
  (e: 'preview', config: DispatchDataConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({} as DispatchDataConfig)
})

const emit = defineEmits<Emits>()

// 本地配置状态
const localConfig = ref<DispatchDataConfig>({
  basic: {
    title: '数据发送',
    showDeviceName: true,
    customDeviceName: '',
    ...props.config.basic
  },
  button: {
    text: '发送数据',
    icon: 'Play',
    size: 'medium',
    shape: 'default',
    disabled: false,
    loading: false,
    ...props.config.button
  },
  data: {
    type: 'telemetry',
    value: '1',
    key: 'control',
    format: 'string',
    ...props.config.data
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
      direction: 'column',
      align: 'center',
      gap: 12,
      ...props.config.style?.container
    },
    button: {
      backgroundColor: '#ff4d4f',
      hoverBackgroundColor: '#ff7875',
      color: '#ffffff',
      iconColor: '#ffffff',
      border: {
        show: false,
        width: 1,
        color: '#d9d9d9',
        radius: 8
      },
      shadow: {
        show: true,
        blur: 4,
        color: 'rgba(0, 0, 0, 0.1)',
        offsetX: 0,
        offsetY: 2
      },
      ...props.config.style?.button
    },
    deviceName: {
      fontSize: 14,
      color: '#666666',
      fontWeight: 'normal',
      position: 'top',
      ...props.config.style?.deviceName
    },
    buttonText: {
      fontSize: 12,
      color: '#666666',
      fontWeight: 'normal',
      position: 'bottom',
      ...props.config.style?.buttonText
    }
  },
  interaction: {
    confirm: {
      enabled: false,
      title: '确认操作',
      content: '确定要发送数据吗？',
      ...props.config.interaction?.confirm
    },
    debounce: {
      enabled: true,
      delay: 300,
      ...props.config.interaction?.debounce
    },
    feedback: {
      successMessage: '数据发送成功',
      errorMessage: '数据发送失败',
      duration: 3000,
      ...props.config.interaction?.feedback
    }
  },
  advanced: {
    retry: {
      enabled: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...props.config.advanced?.retry
    },
    responsive: {
      enabled: true,
      minSize: 24,
      maxSize: 64,
      ...props.config.advanced?.responsive
    }
  }
})

// 选项数据
const sizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' }
]

const shapeOptions = [
  { label: '默认', value: 'default' },
  { label: '圆角', value: 'round' },
  { label: '圆形', value: 'circle' }
]

const dataTypeOptions = [
  { label: '属性数据 (Attributes)', value: 'attributes' },
  { label: '遥测数据 (Telemetry)', value: 'telemetry' },
  { label: '命令数据 (Command)', value: 'command' }
]

const formatOptions = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔值', value: 'boolean' },
  { label: 'JSON', value: 'json' }
]

const directionOptions = [
  { label: '垂直', value: 'column' },
  { label: '水平', value: 'row' }
]

const alignOptions = [
  { label: '开始', value: 'start' },
  { label: '居中', value: 'center' },
  { label: '结束', value: 'end' }
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

const positionOptions = [
  { label: '上方', value: 'top' },
  { label: '下方', value: 'bottom' },
  { label: '左侧', value: 'left' },
  { label: '右侧', value: 'right' },
  { label: '不显示', value: 'none' }
]

const deviceNamePositionOptions = [
  { label: '上方', value: 'top' },
  { label: '下方', value: 'bottom' }
]

// 计算属性
const previewStyle = computed(() => {
  const container = localConfig.value.style?.container
  return {
    backgroundColor: container?.backgroundColor || 'transparent',
    border: container?.border?.show ? `${container.border.width}px solid ${container.border.color}` : 'none',
    borderRadius: `${container?.border?.radius || 4}px`,
    padding: `${container?.padding?.top || 16}px ${container?.padding?.right || 16}px ${container?.padding?.bottom || 16}px ${container?.padding?.left || 16}px`,
    flexDirection: container?.direction || 'column',
    alignItems: container?.align === 'start' ? 'flex-start' : container?.align === 'end' ? 'flex-end' : 'center',
    justifyContent: 'center',
    gap: `${container?.gap || 12}px`,
    minHeight: '120px',
    display: 'flex'
  }
})

const previewButtonStyle = computed(() => {
  const style = localConfig.value.style?.button
  const boxShadow = style?.shadow?.show 
    ? `${style.shadow.offsetX || 0}px ${style.shadow.offsetY || 2}px ${style.shadow.blur || 4}px ${style.shadow.color || 'rgba(0, 0, 0, 0.1)'}`
    : 'none'
  
  return {
    backgroundColor: style?.backgroundColor || '#ff4d4f',
    color: style?.color || '#ffffff',
    border: style?.border?.show ? `${style.border.width || 1}px solid ${style.border.color || '#d9d9d9'}` : 'none',
    borderRadius: `${style?.border?.radius || 8}px`,
    boxShadow
  }
})

const selectedIcon = computed(() => {
  const iconName = localConfig.value.button?.icon || 'Play'
  return (ionicons5 as any)[iconName] || ionicons5.Play
})

// 方法
/**
 * 设置图标
 * @param icon 图标名称
 */
const setIcon = (icon: string) => {
  localConfig.value.button!.icon = icon
}

/**
 * 重置为默认配置
 */
const resetToDefault = () => {
  localConfig.value = {
    basic: {
      title: '数据发送',
      showDeviceName: true,
      customDeviceName: ''
    },
    button: {
      text: '发送数据',
      icon: 'Play',
      size: 'medium',
      shape: 'default',
      disabled: false,
      loading: false
    },
    data: {
      type: 'telemetry',
      value: '1',
      key: 'control',
      format: 'string'
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
        direction: 'column',
        align: 'center',
        gap: 12
      },
      button: {
        backgroundColor: '#ff4d4f',
        hoverBackgroundColor: '#ff7875',
        color: '#ffffff',
        iconColor: '#ffffff',
        border: {
          show: false,
          width: 1,
          color: '#d9d9d9',
          radius: 8
        },
        shadow: {
          show: true,
          blur: 4,
          color: 'rgba(0, 0, 0, 0.1)',
          offsetX: 0,
          offsetY: 2
        }
      },
      deviceName: {
        fontSize: 14,
        color: '#666666',
        fontWeight: 'normal',
        position: 'top'
      },
      buttonText: {
        fontSize: 12,
        color: '#666666',
        fontWeight: 'normal',
        position: 'bottom'
      }
    },
    interaction: {
      confirm: {
        enabled: false,
        title: '确认操作',
        content: '确定要发送数据吗？'
      },
      debounce: {
        enabled: true,
        delay: 300
      },
      feedback: {
        successMessage: '数据发送成功',
        errorMessage: '数据发送失败',
        duration: 3000
      }
    },
    advanced: {
      retry: {
        enabled: true,
        maxRetries: 3,
        retryDelay: 1000
      },
      responsive: {
        enabled: true,
        minSize: 24,
        maxSize: 64
      }
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
  <div class="dispatch-data-config">
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
              <NFormItem label="显示设备名称">
                <NSwitch v-model:value="localConfig.basic!.showDeviceName" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="自定义设备名称">
                <NInput 
                  v-model:value="localConfig.basic!.customDeviceName" 
                  placeholder="留空使用数据源设备名称"
                />
              </NFormItem>
            </NGridItem>
          </NGrid>
        </NCollapseItem>

        <!-- 按钮设置 -->
        <NCollapseItem title="按钮设置" name="button">
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="按钮文本">
                <NInput 
                  v-model:value="localConfig.button!.text" 
                  placeholder="请输入按钮文本"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="按钮图标">
                <div class="icon-selector-wrapper">
                  <IconSelector 
                    :default-icon="localConfig.button!.icon || 'Play'" 
                    @icon-selected="setIcon" 
                  />
                  <NIcon :size="20" class="current-icon">
                    <component :is="selectedIcon" />
                  </NIcon>
                </div>
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="按钮大小">
                <NSelect 
                  v-model:value="localConfig.button!.size" 
                  :options="sizeOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="按钮形状">
                <NSelect 
                  v-model:value="localConfig.button!.shape" 
                  :options="shapeOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="禁用状态">
                <NSwitch v-model:value="localConfig.button!.disabled" />
              </NFormItem>
            </NGridItem>
          </NGrid>
        </NCollapseItem>

        <!-- 数据设置 -->
        <NCollapseItem title="数据设置" name="data">
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="数据类型">
                <NSelect 
                  v-model:value="localConfig.data!.type" 
                  :options="dataTypeOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="数据格式">
                <NSelect 
                  v-model:value="localConfig.data!.format" 
                  :options="formatOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="数据键名">
                <NInput 
                  v-model:value="localConfig.data!.key" 
                  placeholder="数据键名"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem></NGridItem>
            <NGridItem :span="2">
              <NFormItem label="发送的数据值">
                <NInput 
                  v-model:value="localConfig.data!.value" 
                  type="textarea" 
                  :autosize="{ minRows: 3, maxRows: 5 }"
                  placeholder="请输入要发送的数据值"
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
              <NFormItem label="布局方向">
                <NSelect 
                  v-model:value="localConfig.style!.container!.direction" 
                  :options="directionOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="对齐方式">
                <NSelect 
                  v-model:value="localConfig.style!.container!.align" 
                  :options="alignOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="元素间距">
                <NInputNumber 
                  v-model:value="localConfig.style!.container!.gap" 
                  :min="0" 
                  :max="50"
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

          <!-- 按钮样式 -->
          <NText strong>按钮样式</NText>
          <NDivider />
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="背景色">
                <NColorPicker v-model:value="localConfig.style!.button!.backgroundColor" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="悬停背景色">
                <NColorPicker v-model:value="localConfig.style!.button!.hoverBackgroundColor" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="文字颜色">
                <NColorPicker v-model:value="localConfig.style!.button!.color" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="图标颜色">
                <NColorPicker v-model:value="localConfig.style!.button!.iconColor" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="显示边框">
                <NSwitch v-model:value="localConfig.style!.button!.border!.show" />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.style!.button!.border!.show">
              <NFormItem label="边框宽度">
                <NInputNumber 
                  v-model:value="localConfig.style!.button!.border!.width" 
                  :min="1" 
                  :max="10"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.style!.button!.border!.show">
              <NFormItem label="边框颜色">
                <NColorPicker v-model:value="localConfig.style!.button!.border!.color" />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.style!.button!.border!.show">
              <NFormItem label="圆角半径">
                <NInputNumber 
                  v-model:value="localConfig.style!.button!.border!.radius" 
                  :min="0" 
                  :max="50"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="显示阴影">
                <NSwitch v-model:value="localConfig.style!.button!.shadow!.show" />
              </NFormItem>
            </NGridItem>
          </NGrid>

          <!-- 设备名称样式 -->
          <NText strong>设备名称样式</NText>
          <NDivider />
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="字体大小">
                <NInputNumber 
                  v-model:value="localConfig.style!.deviceName!.fontSize" 
                  :min="10" 
                  :max="32"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="字体颜色">
                <NColorPicker v-model:value="localConfig.style!.deviceName!.color" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="字体粗细">
                <NSelect 
                  v-model:value="localConfig.style!.deviceName!.fontWeight" 
                  :options="fontWeightOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="显示位置">
                <NSelect 
                  v-model:value="localConfig.style!.deviceName!.position" 
                  :options="deviceNamePositionOptions"
                />
              </NFormItem>
            </NGridItem>
          </NGrid>

          <!-- 按钮文本样式 -->
          <NText strong>按钮文本样式</NText>
          <NDivider />
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="字体大小">
                <NInputNumber 
                  v-model:value="localConfig.style!.buttonText!.fontSize" 
                  :min="10" 
                  :max="32"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="字体颜色">
                <NColorPicker v-model:value="localConfig.style!.buttonText!.color" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="字体粗细">
                <NSelect 
                  v-model:value="localConfig.style!.buttonText!.fontWeight" 
                  :options="fontWeightOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="显示位置">
                <NSelect 
                  v-model:value="localConfig.style!.buttonText!.position" 
                  :options="positionOptions"
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
                  placeholder="确定要发送数据吗？"
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

          <!-- 反馈设置 -->
          <NText strong>反馈设置</NText>
          <NDivider />
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="成功消息">
                <NInput 
                  v-model:value="localConfig.interaction!.feedback!.successMessage" 
                  placeholder="数据发送成功"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="错误消息">
                <NInput 
                  v-model:value="localConfig.interaction!.feedback!.errorMessage" 
                  placeholder="数据发送失败"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="显示时长(ms)">
                <NInputNumber 
                  v-model:value="localConfig.interaction!.feedback!.duration" 
                  :min="1000" 
                  :max="10000"
                />
              </NFormItem>
            </NGridItem>
          </NGrid>
        </NCollapseItem>

        <!-- 高级设置 -->
        <NCollapseItem title="高级设置" name="advanced">
          <!-- 重试设置 -->
          <NText strong>重试设置</NText>
          <NDivider />
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="启用重试">
                <NSwitch v-model:value="localConfig.advanced!.retry!.enabled" />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.advanced!.retry!.enabled">
              <NFormItem label="最大重试次数">
                <NInputNumber 
                  v-model:value="localConfig.advanced!.retry!.maxRetries" 
                  :min="1" 
                  :max="10"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.advanced!.retry!.enabled">
              <NFormItem label="重试间隔(ms)">
                <NInputNumber 
                  v-model:value="localConfig.advanced!.retry!.retryDelay" 
                  :min="500" 
                  :max="5000"
                />
              </NFormItem>
            </NGridItem>
          </NGrid>

          <!-- 响应式设置 -->
          <NText strong>响应式设置</NText>
          <NDivider />
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="启用响应式">
                <NSwitch v-model:value="localConfig.advanced!.responsive!.enabled" />
              </NFormItem>
            </NGridItem>
            <NGridItem></NGridItem>
            <NGridItem v-if="localConfig.advanced!.responsive!.enabled">
              <NFormItem label="最小尺寸">
                <NInputNumber 
                  v-model:value="localConfig.advanced!.responsive!.minSize" 
                  :min="16" 
                  :max="64"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.advanced!.responsive!.enabled">
              <NFormItem label="最大尺寸">
                <NInputNumber 
                  v-model:value="localConfig.advanced!.responsive!.maxSize" 
                  :min="32" 
                  :max="128"
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
          <!-- 设备名称（上方） -->
          <NText 
            v-if="localConfig.basic?.showDeviceName && localConfig.style?.deviceName?.position === 'top'"
            :style="{
              fontSize: `${localConfig.style?.deviceName?.fontSize || 14}px`,
              color: localConfig.style?.deviceName?.color || '#666666',
              fontWeight: localConfig.style?.deviceName?.fontWeight || 'normal'
            }"
          >
            {{ localConfig.basic?.customDeviceName || '示例设备' }}
          </NText>
          
          <!-- 按钮文本（上方） -->
          <NText 
            v-if="localConfig.style?.buttonText?.position === 'top'"
            :style="{
              fontSize: `${localConfig.style?.buttonText?.fontSize || 12}px`,
              color: localConfig.style?.buttonText?.color || '#666666',
              fontWeight: localConfig.style?.buttonText?.fontWeight || 'normal'
            }"
          >
            {{ localConfig.button?.text || '发送数据' }}
          </NText>
          
          <!-- 按钮 -->
          <NButton
            :size="localConfig.button?.size || 'medium'"
            :disabled="localConfig.button?.disabled"
            :style="previewButtonStyle"
          >
            <template #icon>
              <NIcon :size="20" :color="localConfig.style?.button?.iconColor || '#ffffff'">
                <component :is="selectedIcon" />
              </NIcon>
            </template>
            <span v-if="localConfig.button?.shape !== 'circle'">
              {{ localConfig.button?.text || '发送数据' }}
            </span>
          </NButton>
          
          <!-- 按钮文本（下方） -->
          <NText 
            v-if="localConfig.style?.buttonText?.position === 'bottom' || !localConfig.style?.buttonText?.position"
            :style="{
              fontSize: `${localConfig.style?.buttonText?.fontSize || 12}px`,
              color: localConfig.style?.buttonText?.color || '#666666',
              fontWeight: localConfig.style?.buttonText?.fontWeight || 'normal'
            }"
          >
            {{ localConfig.button?.text || '发送数据' }}
          </NText>
          
          <!-- 设备名称（下方） -->
          <NText 
            v-if="localConfig.basic?.showDeviceName && (localConfig.style?.deviceName?.position === 'bottom' || !localConfig.style?.deviceName?.position)"
            :style="{
              fontSize: `${localConfig.style?.deviceName?.fontSize || 14}px`,
              color: localConfig.style?.deviceName?.color || '#666666',
              fontWeight: localConfig.style?.deviceName?.fontWeight || 'normal'
            }"
          >
            {{ localConfig.basic?.customDeviceName || '示例设备' }}
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
.dispatch-data-config {
  padding: 16px;
  max-height: 80vh;
  overflow-y: auto;
}

.preview-container {
  min-height: 120px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.icon-selector-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-icon {
  color: #666666;
}

:deep(.n-form-item-label) {
  font-size: 13px;
}

:deep(.n-collapse-item__header) {
  font-weight: 600;
}
</style>