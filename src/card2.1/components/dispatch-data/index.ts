import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import { DispatchDataIcon } from './icon'

// 异步加载组件
const DispatchDataCard = defineAsyncComponent(() => import('./DispatchDataCard.vue'))
const DispatchDataConfig = defineAsyncComponent(() => import('./DispatchDataConfig.vue'))

// 组件定义
const dispatchDataDefinition: ComponentDefinition = {
  type: 'dispatch-data',
  name: '数据发送',
  description: '向设备发送数据指令',
  category: 'chart',
  mainCategory: '曲线',
  subCategory: '图表组件',
  icon: DispatchDataIcon,
  component: DispatchDataCard,
  configComponent: DispatchDataConfig,
  properties: {
    deviceId: {
      type: 'string',
      default: '',
      description: '设备ID'
    },
    deviceName: {
      type: 'string',
      default: '',
      description: '设备名称'
    },
    metricsId: {
      type: 'string',
      default: '',
      description: '指标ID'
    },
    metricsName: {
      type: 'string',
      default: '',
      description: '指标名称'
    },
    iconName: {
      type: 'string',
      default: 'Play',
      description: '按钮图标'
    },
    buttonIconColor: {
      type: 'string',
      default: '#FFFFFF',
      description: '按钮图标颜色'
    },
    buttonColor: {
      type: 'string',
      default: '#ff4d4f',
      description: '按钮背景颜色'
    },
    buttonText: {
      type: 'string',
      default: '发送数据',
      description: '按钮文本'
    },
    valueToSend: {
      type: 'string',
      default: '1',
      description: '发送的数据值'
    },
    dataType: {
      type: 'string',
      default: 'telemetry',
      description: '数据类型'
    }
  }
}

export default dispatchDataDefinition
