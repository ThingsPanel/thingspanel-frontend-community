<script setup lang="ts">
/**
 * Card 2.0 枚举控制组件配置界面
 * 提供枚举控制组件的各项配置选项
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
  NIcon,
  NList,
  NListItem,
  NThing,
  useMessage
} from 'naive-ui'
import { DeleteOutlined, PlusOutlined } from '@vicons/antd'
import * as ionicons5 from '@vicons/ionicons5'
import type { EnumControlConfig, ButtonOption } from './index'
import IconSelector from '@/components/common/icon-selector.vue'

const message = useMessage()

// 组件属性
interface Props {
  /** 当前配置 */
  config: EnumControlConfig
}

interface Emits {
  /** 配置更新事件 */
  (e: 'update:config', config: EnumControlConfig): void
  /** 预览事件 */
  (e: 'preview', config: EnumControlConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({} as EnumControlConfig)
})

const emit = defineEmits<Emits>()

// 本地配置状态
const localConfig = ref<EnumControlConfig>({
  basic: {
    title: '枚举控制',
    showDeviceName: true,
    customDeviceName: '',
    showCurrentValue: true,
    currentValueLabel: '当前状态',
    ...props.config.basic
  },
  buttons: {
    options: [
      { label: '加热', value: 'heat', disabled: false },
      { label: '制冷', value: 'cool', disabled: false },
      { label: '通风', value: 'fan', disabled: false },
      { label: '自动', value: 'auto', disabled: false }
    ],
    size: 'medium',
    shape: 'default',
    direction: 'horizontal',
    gap: 8,
    itemsPerRow: 4,
    disabled: false,
    ...props.config.buttons
  },
  data: {
    type: 'telemetry',
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
      align: 'center',
      verticalAlign: 'center',
      ...props.config.style?.container
    },
    button: {
      backgroundColor: '#f5f5f5',
      activeBackgroundColor: '#1890ff',
      hoverBackgroundColor: '#e6f7ff',
      color: '#333333',
      activeColor: '#ffffff',
      border: {
        show: true,
        width: 1,
        color: '#d9d9d9',
        activeColor: '#1890ff',
        radius: 4
      },
      shadow: {
        show: false,
        blur: 4,
        color: 'rgba(0, 0, 0, 0.1)',
        offsetX: 0,
        offsetY: 2
      },
      font: {
        size: 14,
        weight: 'normal'
      },
      ...props.config.style?.button
    },
    deviceName: {
      fontSize: 14,
      color: '#666666',
      fontWeight: 'normal',
      position: 'top',
      margin: 8,
      ...props.config.style?.deviceName
    },
    currentValue: {
      fontSize: 12,
      color: '#999999',
      fontWeight: 'normal',
      position: 'bottom',
      margin: 8,
      prefix: '当前: ',
      suffix: '',
      ...props.config.style?.currentValue
    }
  },
  interaction: {
    confirm: {
      enabled: false,
      title: '确认操作',
      content: '确定要执行此操作吗？',
      ...props.config.interaction?.confirm
    },
    debounce: {
      enabled: true,
      delay: 300,
      ...props.config.interaction?.debounce
    },
    feedback: {
      successMessage: '操作成功',
      errorMessage: '操作失败',
      duration: 3000,
      ...props.config.interaction?.feedback
    },
    animation: {
      enabled: true,
      duration: 200,
      easing: 'ease-in-out',
      ...props.config.interaction?.animation
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
      breakpoints: {
        mobile: 480,
        tablet: 768,
        desktop: 1024
      },
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

const directionOptions = [
  { label: '水平', value: 'horizontal' },
  { label: '垂直', value: 'vertical' }
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
  { label: '下方', value: 'bottom' }
]

const easingOptions = [
  { label: '线性', value: 'linear' },
  { label: '缓入缓出', value: 'ease-in-out' },
  { label: '缓入', value: 'ease-in' },
  { label: '缓出', value: 'ease-out' },
  { label: '贝塞尔', value: 'cubic-bezier(0.4, 0, 0.2, 1)' }
]

// 计算属性
const previewStyle = computed(() => {
  const container = localConfig.value.style?.container
  return {
    backgroundColor: container?.backgroundColor || 'transparent',
    border: container?.border?.show ? `${container.border.width}px solid ${container.border.color}` : 'none',
    borderRadius: `${container?.border?.radius || 4}px`,
    padding: `${container?.padding?.top || 16}px ${container?.padding?.right || 16}px ${container?.padding?.bottom || 16}px ${container?.padding?.left || 16}px`,
    alignItems: container?.align === 'start' ? 'flex-start' : container?.align === 'end' ? 'flex-end' : 'center',
    justifyContent: container?.verticalAlign === 'start' ? 'flex-start' : container?.verticalAlign === 'end' ? 'flex-end' : 'center',
    minHeight: '150px',
    display: 'flex',
    flexDirection: 'column',
    gap: `${localConfig.value.buttons?.gap || 8}px`
  }
})

const previewButtonStyle = computed(() => {
  const style = localConfig.value.style?.button
  return {
    backgroundColor: style?.backgroundColor || '#f5f5f5',
    color: style?.color || '#333333',
    border: style?.border?.show ? `${style.border.width || 1}px solid ${style.border.color || '#d9d9d9'}` : 'none',
    borderRadius: `${style?.border?.radius || 4}px`,
    fontSize: `${style?.font?.size || 14}px`,
    fontWeight: style?.font?.weight || 'normal'
  }
})

const previewActiveButtonStyle = computed(() => {
  const style = localConfig.value.style?.button
  return {
    backgroundColor: style?.activeBackgroundColor || '#1890ff',
    color: style?.activeColor || '#ffffff',
    border: style?.border?.show ? `${style.border.width || 1}px solid ${style.border.activeColor || '#1890ff'}` : 'none',
    borderRadius: `${style?.border?.radius || 4}px`,
    fontSize: `${style?.font?.size || 14}px`,
    fontWeight: style?.font?.weight || 'normal'
  }
})

// 方法
/**
 * 添加按钮选项
 */
const addButtonOption = () => {
  const newOption: ButtonOption = {
    label: `选项${localConfig.value.buttons!.options.length + 1}`,
    value: `option${localConfig.value.buttons!.options.length + 1}`,
    disabled: false
  }
  localConfig.value.buttons!.options.push(newOption)
}

/**
 * 删除按钮选项
 */
const removeButtonOption = (index: number) => {
  if (localConfig.value.buttons!.options.length <= 2) {
    message.warning('至少需要保留2个按钮选项')
    return
  }
  localConfig.value.buttons!.options.splice(index, 1)
}

/**
 * 设置按钮图标
 */
const setButtonIcon = (index: number, icon: string) => {
  localConfig.value.buttons!.options[index].icon = icon
}

/**
 * 获取图标组件
 */
const getIconComponent = (iconName?: string) => {
  if (!iconName) return null
  return (ionicons5 as any)[iconName] || null
}

/**
 * 重置为默认配置
 */
const resetToDefault = () => {
  localConfig.value = {
    basic: {
      title: '枚举控制',
      showDeviceName: true,
      customDeviceName: '',
      showCurrentValue: true,
      currentValueLabel: '当前状态'
    },
    buttons: {
      options: [
        { label: '加热', value: 'heat', disabled: false },
        { label: '制冷', value: 'cool', disabled: false },
        { label: '通风', value: 'fan', disabled: false },
        { label: '自动', value: 'auto', disabled: false }
      ],
      size: 'medium',
      shape: 'default',
      direction: 'horizontal',
      gap: 8,
      itemsPerRow: 4,
      disabled: false
    },
    data: {
      type: 'telemetry',
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
        align: 'center',
        verticalAlign: 'center'
      },
      button: {
        backgroundColor: '#f5f5f5',
        activeBackgroundColor: '#1890ff',
        hoverBackgroundColor: '#e6f7ff',
        color: '#333333',
        activeColor: '#ffffff',
        border: {
          show: true,
          width: 1,
          color: '#d9d9d9',
          activeColor: '#1890ff',
          radius: 4
        },
        shadow: {
          show: false,
          blur: 4,
          color: 'rgba(0, 0, 0, 0.1)',
          offsetX: 0,
          offsetY: 2
        },
        font: {
          size: 14,
          weight: 'normal'
        }
      },
      deviceName: {
        fontSize: 14,
        color: '#666666',
        fontWeight: 'normal',
        position: 'top',
        margin: 8
      },
      currentValue: {
        fontSize: 12,
        color: '#999999',
        fontWeight: 'normal',
        position: 'bottom',
        margin: 8,
        prefix: '当前: ',
        suffix: ''
      }
    },
    interaction: {
      confirm: {
        enabled: false,
        title: '确认操作',
        content: '确定要执行此操作吗？'
      },
      debounce: {
        enabled: true,
        delay: 300
      },
      feedback: {
        successMessage: '操作成功',
        errorMessage: '操作失败',
        duration: 3000
      },
      animation: {
        enabled: true,
        duration: 200,
        easing: 'ease-in-out'
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
        breakpoints: {
          mobile: 480,
          tablet: 768,
          desktop: 1024
        }
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
  <div class="enum-control-config">
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
            <NGridItem>
              <NFormItem label="显示当前值">
                <NSwitch v-model:value="localConfig.basic!.showCurrentValue" />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.basic!.showCurrentValue">
              <NFormItem label="当前值标签">
                <NInput 
                  v-model:value="localConfig.basic!.currentValueLabel" 
                  placeholder="当前状态"
                />
              </NFormItem>
            </NGridItem>
          </NGrid>
        </NCollapseItem>

        <!-- 按钮设置 -->
        <NCollapseItem title="按钮设置" name="buttons">
          <!-- 按钮选项列表 -->
          <NText strong>按钮选项</NText>
          <NDivider />
          <NList>
            <NListItem v-for="(option, index) in localConfig.buttons!.options" :key="index">
              <NThing>
                <template #header>
                  <NSpace align="center">
                    <NText>选项 {{ index + 1 }}</NText>
                    <NButton 
                      v-if="localConfig.buttons!.options.length > 2" 
                      size="small" 
                      type="error" 
                      text 
                      @click="removeButtonOption(index)"
                    >
                      <NIcon size="16">
                        <DeleteOutlined />
                      </NIcon>
                    </NButton>
                  </NSpace>
                </template>
                <NGrid :cols="3" :x-gap="12">
                  <NGridItem>
                    <NFormItem label="显示文本">
                      <NInput 
                        v-model:value="option.label" 
                        placeholder="按钮文本"
                      />
                    </NFormItem>
                  </NGridItem>
                  <NGridItem>
                    <NFormItem label="按钮值">
                      <NInput 
                        v-model:value="option.value" 
                        placeholder="按钮值"
                      />
                    </NFormItem>
                  </NGridItem>
                  <NGridItem>
                    <NFormItem label="按钮图标">
                      <div class="icon-selector-wrapper">
                        <IconSelector 
                          :default-icon="option.icon || ''" 
                          @icon-selected="(icon) => setButtonIcon(index, icon)" 
                        />
                        <NIcon v-if="option.icon" :size="16" class="current-icon">
                          <component :is="getIconComponent(option.icon)" />
                        </NIcon>
                      </div>
                    </NFormItem>
                  </NGridItem>
                  <NGridItem>
                    <NFormItem label="按钮颜色">
                      <NColorPicker v-model:value="option.color" :show-alpha="true" />
                    </NFormItem>
                  </NGridItem>
                  <NGridItem>
                    <NFormItem label="禁用状态">
                      <NSwitch v-model:value="option.disabled" />
                    </NFormItem>
                  </NGridItem>
                </NGrid>
              </NThing>
            </NListItem>
          </NList>
          
          <NButton type="primary" dashed block @click="addButtonOption">
            <NIcon size="16">
              <PlusOutlined />
            </NIcon>
            添加按钮选项
          </NButton>
          
          <NDivider />
          
          <!-- 按钮布局设置 -->
          <NText strong>布局设置</NText>
          <NDivider />
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="按钮大小">
                <NSelect 
                  v-model:value="localConfig.buttons!.size" 
                  :options="sizeOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="按钮形状">
                <NSelect 
                  v-model:value="localConfig.buttons!.shape" 
                  :options="shapeOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="布局方向">
                <NSelect 
                  v-model:value="localConfig.buttons!.direction" 
                  :options="directionOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="按钮间距">
                <NInputNumber 
                  v-model:value="localConfig.buttons!.gap" 
                  :min="0" 
                  :max="50"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.buttons!.direction === 'horizontal'">
              <NFormItem label="每行按钮数量">
                <NInputNumber 
                  v-model:value="localConfig.buttons!.itemsPerRow" 
                  :min="1" 
                  :max="10"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="禁用所有按钮">
                <NSwitch v-model:value="localConfig.buttons!.disabled" />
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
                  v-model:value="localConfig.style!.container!.align" 
                  :options="alignOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="垂直对齐">
                <NSelect 
                  v-model:value="localConfig.style!.container!.verticalAlign" 
                  :options="alignOptions"
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
              <NFormItem label="默认背景色">
                <NColorPicker v-model:value="localConfig.style!.button!.backgroundColor" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="激活背景色">
                <NColorPicker v-model:value="localConfig.style!.button!.activeBackgroundColor" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="悬停背景色">
                <NColorPicker v-model:value="localConfig.style!.button!.hoverBackgroundColor" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="默认文字颜色">
                <NColorPicker v-model:value="localConfig.style!.button!.color" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="激活文字颜色">
                <NColorPicker v-model:value="localConfig.style!.button!.activeColor" />
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
              <NFormItem label="激活边框颜色">
                <NColorPicker v-model:value="localConfig.style!.button!.border!.activeColor" />
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
              <NFormItem label="字体大小">
                <NInputNumber 
                  v-model:value="localConfig.style!.button!.font!.size" 
                  :min="10" 
                  :max="32"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="字体粗细">
                <NSelect 
                  v-model:value="localConfig.style!.button!.font!.weight" 
                  :options="fontWeightOptions"
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
                  :options="positionOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="边距">
                <NInputNumber 
                  v-model:value="localConfig.style!.deviceName!.margin" 
                  :min="0" 
                  :max="50"
                />
              </NFormItem>
            </NGridItem>
          </NGrid>

          <!-- 当前值样式 -->
          <NText strong>当前值样式</NText>
          <NDivider />
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="字体大小">
                <NInputNumber 
                  v-model:value="localConfig.style!.currentValue!.fontSize" 
                  :min="10" 
                  :max="32"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="字体颜色">
                <NColorPicker v-model:value="localConfig.style!.currentValue!.color" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="字体粗细">
                <NSelect 
                  v-model:value="localConfig.style!.currentValue!.fontWeight" 
                  :options="fontWeightOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="显示位置">
                <NSelect 
                  v-model:value="localConfig.style!.currentValue!.position" 
                  :options="positionOptions"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="前缀">
                <NInput 
                  v-model:value="localConfig.style!.currentValue!.prefix" 
                  placeholder="当前: "
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="后缀">
                <NInput 
                  v-model:value="localConfig.style!.currentValue!.suffix" 
                  placeholder=""
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="边距">
                <NInputNumber 
                  v-model:value="localConfig.style!.currentValue!.margin" 
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
                  placeholder="确定要执行此操作吗？"
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
                  placeholder="操作成功"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="错误消息">
                <NInput 
                  v-model:value="localConfig.interaction!.feedback!.errorMessage" 
                  placeholder="操作失败"
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

          <!-- 动画设置 -->
          <NText strong>动画设置</NText>
          <NDivider />
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="启用动画">
                <NSwitch v-model:value="localConfig.interaction!.animation!.enabled" />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.interaction!.animation!.enabled">
              <NFormItem label="动画时长(ms)">
                <NInputNumber 
                  v-model:value="localConfig.interaction!.animation!.duration" 
                  :min="100" 
                  :max="1000"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.interaction!.animation!.enabled">
              <NFormItem label="缓动函数">
                <NSelect 
                  v-model:value="localConfig.interaction!.animation!.easing" 
                  :options="easingOptions"
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
              <NFormItem label="移动端断点">
                <NInputNumber 
                  v-model:value="localConfig.advanced!.responsive!.breakpoints!.mobile" 
                  :min="320" 
                  :max="768"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.advanced!.responsive!.enabled">
              <NFormItem label="平板断点">
                <NInputNumber 
                  v-model:value="localConfig.advanced!.responsive!.breakpoints!.tablet" 
                  :min="768" 
                  :max="1024"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="localConfig.advanced!.responsive!.enabled">
              <NFormItem label="桌面断点">
                <NInputNumber 
                  v-model:value="localConfig.advanced!.responsive!.breakpoints!.desktop" 
                  :min="1024" 
                  :max="1920"
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
          
          <!-- 当前值（上方） -->
          <NText 
            v-if="localConfig.basic?.showCurrentValue && localConfig.style?.currentValue?.position === 'top'"
            :style="{
              fontSize: `${localConfig.style?.currentValue?.fontSize || 12}px`,
              color: localConfig.style?.currentValue?.color || '#999999',
              fontWeight: localConfig.style?.currentValue?.fontWeight || 'normal'
            }"
          >
            {{ (localConfig.style?.currentValue?.prefix || '') + '加热' + (localConfig.style?.currentValue?.suffix || '') }}
          </NText>
          
          <!-- 按钮组预览 -->
          <div class="preview-buttons" :class="{ vertical: localConfig.buttons?.direction === 'vertical' }">
            <NButton
              v-for="(option, index) in localConfig.buttons?.options.slice(0, 4)"
              :key="index"
              :size="localConfig.buttons?.size || 'medium'"
              :disabled="localConfig.buttons?.disabled || option.disabled"
              :style="index === 0 ? previewActiveButtonStyle : previewButtonStyle"
            >
              <template v-if="option.icon" #icon>
                <NIcon :size="16">
                  <component :is="getIconComponent(option.icon)" />
                </NIcon>
              </template>
              {{ option.label }}
            </NButton>
          </div>
          
          <!-- 当前值（下方） -->
          <NText 
            v-if="localConfig.basic?.showCurrentValue && (localConfig.style?.currentValue?.position === 'bottom' || !localConfig.style?.currentValue?.position)"
            :style="{
              fontSize: `${localConfig.style?.currentValue?.fontSize || 12}px`,
              color: localConfig.style?.currentValue?.color || '#999999',
              fontWeight: localConfig.style?.currentValue?.fontWeight || 'normal'
            }"
          >
            {{ (localConfig.style?.currentValue?.prefix || '') + '加热' + (localConfig.style?.currentValue?.suffix || '') }}
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
.enum-control-config {
  padding: 16px;
  max-height: 80vh;
  overflow-y: auto;
}

.preview-container {
  min-height: 150px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.preview-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.preview-buttons.vertical {
  flex-direction: column;
  align-items: center;
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

:deep(.n-list-item) {
  padding: 12px 0;
}
</style>