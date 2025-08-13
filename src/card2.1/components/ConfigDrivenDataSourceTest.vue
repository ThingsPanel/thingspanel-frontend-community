<!--
  ConfigDrivenDataSourceTest.vue
  配置驱动的动态数据源重构方案集成测试组件
-->

<template>
  <div class="config-driven-test">
    <n-card title="配置驱动的动态数据源重构测试" :bordered="false">
      <n-space vertical :size="24">
        <!-- 测试说明 -->
        <n-alert type="info">
          <template #header>测试说明</template>
          <p>此测试验证配置驱动的动态数据源重构方案的完整流程：</p>
          <ul>
            <li>✅ 1. 组件声明式数据需求定义</li>
            <li>✅ 2. 数据源中心注册和管理</li>
            <li>✅ 3. useWidgetProps Hook 数据绑定</li>
            <li>✅ 4. 组件渲染器集成</li>
            <li>⏳ 5. 配置面板动态生成（待实现）</li>
          </ul>
        </n-alert>

        <!-- 数据源管理 -->
        <n-card title="数据源管理" size="small">
          <n-space vertical>
            <n-button type="primary" @click="createTestDataSource">创建测试数据源</n-button>

            <n-descriptions :column="3" label-placement="left" bordered>
              <n-descriptions-item label="数据源数量">
                {{ dataSourceList.length }}
              </n-descriptions-item>
              <n-descriptions-item label="支持类型">
                {{ supportedTypes.join(', ') }}
              </n-descriptions-item>
              <n-descriptions-item label="状态">
                <n-tag type="success">活跃</n-tag>
              </n-descriptions-item>
            </n-descriptions>

            <n-data-table :columns="dataSourceColumns" :data="dataSourceList" size="small" />
          </n-space>
        </n-card>

        <!-- 组件定义展示 -->
        <n-card title="测试组件定义" size="small">
          <n-code :code="JSON.stringify(testComponentDefinition, null, 2)" language="json" />
        </n-card>

        <!-- Widget 包装器测试 -->
        <n-card title="Widget 渲染测试" size="small">
          <n-space vertical>
            <n-button @click="updateTestData">更新测试数据</n-button>

            <!-- 使用 WidgetWrapper 渲染测试组件 -->
            <div class="widget-test-container">
              <WidgetWrapper :definition="testComponentDefinition" :configuration="testConfiguration" />
            </div>
          </n-space>
        </n-card>

        <!-- 配置展示 -->
        <n-card title="当前配置" size="small">
          <n-code :code="JSON.stringify(testConfiguration, null, 2)" language="json" />
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 配置驱动的动态数据源重构方案集成测试
 */

import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { dataSourceCenter } from '../core/data-sources'
import type {
  ComponentDefinition,
  WidgetConfiguration,
  StaticParamRequirement,
  DataSourceRequirement
} from '../core/types'
import WidgetWrapper from './WidgetWrapper.vue'

// 简单的测试组件
const TestWidget = {
  name: 'TestWidget',
  props: {
    title: String,
    count: Number,
    color: String,
    data: Object
  },
  template: `
    <div style="padding: 16px; border: 1px solid var(--border-color); border-radius: 6px;">
      <h3 style="color: var(--primary-color); margin: 0 0 12px 0;">{{ title || '测试组件' }}</h3>
      <p>计数: <strong>{{ count || 0 }}</strong></p>
      <p>颜色: <span :style="{color: color || '#333'}">{{ color || '默认' }}</span></p>
      <p>数据: {{ data ? JSON.stringify(data) : '无数据' }}</p>
    </div>
  `
}

const { t } = useI18n()

// 数据源列表
const dataSourceList = ref([])
const supportedTypes = ref([])

// 测试组件定义
const testComponentDefinition = reactive<ComponentDefinition>({
  type: 'test-widget',
  name: '测试组件',
  description: '用于测试配置驱动数据源的示例组件',
  category: '测试',
  icon: 'test',
  component: TestWidget,

  // 静态参数声明
  staticParams: [
    {
      key: 'title',
      name: '标题',
      type: 'string',
      description: '组件显示的标题',
      defaultValue: '默认标题',
      required: false,
      ui: {
        component: 'input',
        placeholder: '请输入标题',
        label: '组件标题'
      }
    },
    {
      key: 'color',
      name: '颜色',
      type: 'string',
      description: '文本颜色',
      defaultValue: '#1890ff',
      required: false,
      ui: {
        component: 'color',
        label: '文本颜色'
      }
    }
  ] as StaticParamRequirement[],

  // 数据源声明
  dataSources: [
    {
      key: 'mainData',
      name: '主数据源',
      description: '组件的主要数据来源',
      supportedTypes: ['static', 'api', 'websocket'],
      fieldMappings: {
        value: {
          targetField: 'count',
          type: 'value',
          required: false,
          defaultValue: 42
        },
        info: {
          targetField: 'data',
          type: 'object',
          required: false,
          defaultValue: { message: '默认数据' }
        }
      },
      required: false
    }
  ] as DataSourceRequirement[]
})

// 测试配置
const testConfiguration = reactive<WidgetConfiguration>({
  staticParams: {
    title: '动态数据源测试',
    color: '#52c41a'
  },
  dataSourceBindings: {
    mainData: {
      dataSourceId: 'test-data-source',
      fieldMappings: {
        value: 'count',
        info: 'data'
      }
    }
  },
  metadata: {
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date()
  }
})

// 数据源表格列
const dataSourceColumns = [
  {
    title: 'ID',
    key: 'id'
  },
  {
    title: '名称',
    key: 'name'
  },
  {
    title: '类型',
    key: 'type'
  },
  {
    title: '状态',
    key: 'status',
    render: (row: any) => {
      return row.status === 'active' ? '🟢 活跃' : '🔴 异常'
    }
  }
]

/**
 * 创建测试数据源
 */
const createTestDataSource = () => {
  const testData = {
    value: Math.floor(Math.random() * 100),
    info: {
      message: `测试数据 - ${new Date().toLocaleTimeString()}`,
      timestamp: Date.now()
    }
  }

  const dataSource = dataSourceCenter.createDataSource('test-data-source', 'static', {
    name: '测试静态数据源',
    description: '用于测试的静态数据源',
    data: testData
  })

  if (dataSource) {
    console.log('✅ 测试数据源创建成功')
    refreshDataSourceList()
  } else {
    console.error('❌ 测试数据源创建失败')
  }
}

/**
 * 更新测试数据
 */
const updateTestData = () => {
  const dataSource = dataSourceCenter.getDataSource('test-data-source')
  if (dataSource) {
    const newData = {
      value: Math.floor(Math.random() * 100),
      info: {
        message: `更新数据 - ${new Date().toLocaleTimeString()}`,
        timestamp: Date.now()
      }
    }

    // 类型断言以访问 updateData 方法
    ;(dataSource as any).updateData(newData)
    console.log('🔄 测试数据已更新')
  }
}

/**
 * 刷新数据源列表
 */
const refreshDataSourceList = () => {
  dataSourceList.value = dataSourceCenter.getAllDataSources()
  supportedTypes.value = dataSourceCenter.getSupportedTypes()
}

// 组件挂载时初始化
onMounted(() => {
  refreshDataSourceList()
})
</script>

<style scoped>
.config-driven-test {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.widget-test-container {
  min-height: 200px;
  padding: 16px;
  background-color: var(--body-color);
  border-radius: 6px;
  border: 1px dashed var(--border-color);
}

:deep(.n-card) {
  margin-bottom: 16px;
}
</style>
