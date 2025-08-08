/**
 * 数据源注册
 */

import { dataSourceRegistry } from '@/components/visual-editor/core/data-source-registry'
import { DataSourceType } from '@/components/visual-editor/types/data-source'
import StaticDataSourceConfig from './StaticDataSourceConfig.vue'
import DeviceDataSourceConfigNew from './DeviceDataSourceConfigNew.vue'
import HttpDataSourceConfig from './HttpDataSourceConfig.vue'

// 导出原有的数据源配置组件
export { default as DeviceDataSourceConfig } from './DeviceDataSourceConfig.vue'
export { default as DeviceDataSourceExample } from './DeviceDataSourceExample.vue'

// 导出新的设备数据源配置组件
export { default as DeviceDataSourceConfigNew } from './DeviceDataSourceConfigNew.vue'
export { default as DeviceDataSourceExampleNew } from './DeviceDataSourceExampleNew.vue'

// 导出设备API配置系统的所有组件
export * from './device-apis/index'

// 导出数据映射配置组件
export { default as DataMappingConfig } from './DataMappingConfig.vue'

// 注册数据源配置组件
dataSourceRegistry.register(DataSourceType.STATIC, {
  type: DataSourceType.STATIC,
  name: '静态数据',
  description: '使用JSON格式的静态数据',
  icon: '📄',
  component: StaticDataSourceConfig,
  defaultConfig: {
    type: DataSourceType.STATIC,
    enabled: true,
    name: '静态数据源',
    description: 'JSON格式的静态数据',
    data: {},
    dataPaths: [],
    refreshInterval: 0
  }
})

dataSourceRegistry.register(DataSourceType.DEVICE, {
  type: DataSourceType.DEVICE,
  name: '设备数据',
  description: '从设备获取实时数据',
  icon: '📱',
  component: DeviceDataSourceConfigNew,
  defaultConfig: {
    type: DataSourceType.DEVICE,
    enabled: true,
    name: '设备数据源',
    description: '从设备获取实时数据',
    deviceId: '',
    deviceName: '',
    dataType: 'telemetry',
    metricsId: '',
    metricsName: '',
    metricsDataType: '',
    timeMode: 'current',
    timeRange: 'last_1h',
    aggregateFunction: 'avg',
    polling: {
      enabled: false,
      interval: 5000,
      status: 'stopped'
    },
    dataPaths: []
  }
})

dataSourceRegistry.register(DataSourceType.HTTP, {
  type: DataSourceType.HTTP,
  name: 'HTTP请求',
  description: '通过HTTP请求获取数据',
  icon: '🌐',
  component: HttpDataSourceConfig,
  defaultConfig: {
    type: DataSourceType.HTTP,
    enabled: true,
    name: 'HTTP数据源',
    description: '通过HTTP请求获取数据',
    method: 'GET',
    url: '',
    headers: [],
    dataPaths: [],
    refreshInterval: 5000
  }
})

console.log('🔧 [DataSourceRegistry] 数据源注册完成')
