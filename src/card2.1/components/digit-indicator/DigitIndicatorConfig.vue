<script lang="ts" setup>
import { computed } from 'vue'
import { NForm, NFormItem, NInput, NColorPicker, NDivider, NSwitch, NSelect } from 'naive-ui'
import { $t } from '@/locales'
import IconSelector from '@/components/common/icon-selector.vue'
import DeviceDataSourceConfig from '@/components/visual-editor/settings/data-sources/DeviceDataSourceConfig.vue'
import type { DataSource } from '@/components/visual-editor/types/data-source'

interface Props {
  modelValue?: {
    unit?: string
    color?: string
    iconName?: string
    title?: string
    value?: string | number
    // 数据源配置
    enableDataSource?: boolean
    dataSource?: DataSource
  }
}

interface Emits {
  'update:modelValue': [value: any]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({})
})

const emit = defineEmits<Emits>()

const config = computed({
  get: () => props.modelValue || {},
  set: value => emit('update:modelValue', value)
})

const updateConfig = (key: string, value: any) => {
  emit('update:modelValue', {
    ...config.value,
    [key]: value
  })
}

const setIcon = (icon: string) => {
  updateConfig('iconName', icon)
}

// 数据源相关
const enableDataSource = computed({
  get: () => config.value.enableDataSource ?? true, // 默认启用数据源
  set: value => updateConfig('enableDataSource', value)
})

const dataSource = computed({
  get: () =>
    config.value.dataSource || {
      type: 'device',
      enabled: true,
      name: '设备数据源',
      description: '实时设备数据',
      dataPaths: [],
      pollingType: 'websocket', // 默认使用 WebSocket
      websocketUrl: 'ws://localhost:8080/ws',
      websocketTopic: '/device/{deviceId}/telemetry',
      dataMapping: {
        mappings: [],
        defaultArrayMode: 'auto',
        defaultArrayIndex: 0,
        enableAutoDetection: true
      }
    },
  set: value => updateConfig('dataSource', value)
})

// 初始化默认数据源配置
const initDefaultDataSource = () => {
  if (!config.value.dataSource) {
    const defaultDataSource: DataSource = {
      type: 'device',
      enabled: true,
      name: '设备数据源',
      description: '实时设备数据',
      dataPaths: [],
      pollingType: 'websocket',
      websocketUrl: 'ws://localhost:8080/ws',
      websocketTopic: '/device/{deviceId}/telemetry',
      dataMapping: {
        mappings: [],
        defaultArrayMode: 'auto',
        defaultArrayIndex: 0,
        enableAutoDetection: true
      }
    }
    updateConfig('dataSource', defaultDataSource)
  }
}

// 在组件挂载时初始化默认数据源
initDefaultDataSource()
</script>

<template>
  <NForm :model="config">
    <!-- 基本配置 -->
    <NFormItem :label="$t('common.title')">
      <NInput
        :value="config.title"
        :placeholder="$t('card.humidity')"
        @update:value="val => updateConfig('title', val)"
      />
    </NFormItem>

    <!-- 数据源配置 -->
    <NDivider title-placement="left">数据源配置</NDivider>
    <NFormItem label="启用数据源">
      <NSwitch v-model:value="enableDataSource" />
    </NFormItem>

    <div v-if="enableDataSource">
      <NFormItem label="数据源类型">
        <NSelect
          :value="dataSource.type"
          :options="[
            { label: '设备数据', value: 'device' },
            { label: '静态数据', value: 'static' },
            { label: 'HTTP API', value: 'http' }
          ]"
          @update:value="val => (dataSource = { ...dataSource, type: val })"
        />
      </NFormItem>

      <!-- 设备数据源配置 -->
      <template v-if="dataSource.type === 'device'">
        <DeviceDataSourceConfig v-model="dataSource" @update:modelValue="val => (dataSource = val)" />
      </template>
    </div>

    <!-- 显示配置 -->
    <NDivider title-placement="left">显示配置</NDivider>
    <NFormItem :label="$t('device_template.table_header.unit')">
      <NInput
        :value="config.unit"
        :placeholder="$t('device_template.table_header.pleaseEnterTheUnit')"
        @update:value="val => updateConfig('unit', val)"
      />
    </NFormItem>
    <NFormItem :label="$t('generate.color')">
      <NColorPicker :value="config.color" :show-alpha="false" @update:value="val => updateConfig('color', val)" />
    </NFormItem>
    <NFormItem label="默认值">
      <NInput :value="String(config.value || '')" placeholder="45" @update:value="val => updateConfig('value', val)" />
    </NFormItem>
    <IconSelector default-icon="Water" @icon-selected="setIcon" />
  </NForm>
</template>
