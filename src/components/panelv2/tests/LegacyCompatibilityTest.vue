<!--
  Legacy Compatibility Test Component
  现有数据格式兼容性测试组件
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NCard, NButton, NSpace, NAlert, NTag, NTable, NTabPane, NTabs } from 'naive-ui'
import { LegacyPanelAdapter } from '../adapters/LegacyAdapter'
import type { LegacyCardView } from '../types/adapters'
import type { BaseCanvasItem } from '../types/core'

// 测试数据
const testLegacyData = {
  id: 'test-panel-001',
  name: 'Test Panel',
  config: JSON.stringify([
    {
      x: 0, y: 0, w: 4, h: 3, i: 1,
      minW: 2, minH: 2,
      data: {
        cardId: 'chart-card-001',
        type: 'chart',
        title: '销售趋势图',
        config: { chartType: 'line', dataSource: 'sales' },
        layout: { w: 4, h: 3, minW: 2, minH: 2 },
        basicSettings: { showTitle: true, backgroundColor: '#ffffff' },
        dataSource: {
          origin: 'device',
          isSupportTimeRange: true,
          dataTimeRange: '7d',
          deviceSource: [
            { device_id: 'device_001', metricsType: 'temperature', aggregateWindow: '1h' }
          ],
          systemSource: []
        }
      }
    },
    {
      x: 4, y: 0, w: 4, h: 2, i: 2,
      minW: 2, minH: 1,
      data: {
        cardId: 'data-card-001',
        type: 'builtin',
        title: '实时数据',
        config: { displayType: 'number', unit: '°C' },
        layout: { w: 4, h: 2, minW: 2, minH: 1 },
        basicSettings: { showTitle: true },
        dataSource: {
          origin: 'system',
          systemSource: [{ metric: 'current_temperature' }],
          deviceSource: []
        }
      }
    },
    {
      x: 8, y: 0, w: 4, h: 4, i: 3,
      minW: 3, minH: 3,
      static: true,
      data: {
        cardId: 'table-card-001',
        type: 'custom',
        title: '设备列表',
        config: { 
          columns: ['name', 'status', 'temperature'],
          pagination: true,
          pageSize: 10
        },
        layout: { w: 4, h: 4, minW: 3, minH: 3 },
        basicSettings: { showTitle: true, bordered: true },
        dataSource: {
          origin: 'device',
          deviceSource: [
            { device_id: 'all', metricsType: 'status' }
          ],
          systemSource: []
        }
      }
    }
  ]),
  tenant_id: 'tenant_001',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T12:30:00Z',
  home_flag: '1'
}

// 响应式状态
const adapter = new LegacyPanelAdapter()
const testResults = ref<{
  validation: any
  conversion: any
  migration: any
  statistics: any
}>({
  validation: null,
  conversion: null,
  migration: null,
  statistics: null
})

const activeTab = ref('validation')

// 计算属性
const validationStatus = computed(() => {
  if (!testResults.value.validation) return 'unknown'
  return testResults.value.validation.valid ? 'success' : 'error'
})

const conversionStatus = computed(() => {
  if (!testResults.value.conversion) return 'unknown'
  return testResults.value.conversion.success ? 'success' : 'error'
})

// 表格列定义
const originalDataColumns = [
  { title: 'ID', key: 'i', width: 60 },
  { title: '位置', key: 'position', render: (row: LegacyCardView) => `${row.x}, ${row.y}` },
  { title: '尺寸', key: 'size', render: (row: LegacyCardView) => `${row.w} × ${row.h}` },
  { title: '最小尺寸', key: 'minSize', render: (row: LegacyCardView) => row.minW || row.minH ? `${row.minW || '-'} × ${row.minH || '-'}` : '-' },
  { title: '卡片类型', key: 'cardType', render: (row: LegacyCardView) => row.data?.type || 'unknown' },
  { title: '标题', key: 'title', render: (row: LegacyCardView) => row.data?.title || '-' },
  { title: '静态', key: 'static', render: (row: LegacyCardView) => row.static ? '是' : '否' }
]

const convertedDataColumns = [
  { title: 'ID', key: 'id', width: 120 },
  { title: '类型', key: 'type' },
  { title: '位置 (像素)', key: 'position', render: (row: BaseCanvasItem) => `${row.position.x}, ${row.position.y}` },
  { title: '尺寸 (像素)', key: 'size', render: (row: BaseCanvasItem) => `${row.size.width} × ${row.size.height}` },
  { title: '层级', key: 'zIndex' },
  { title: '可见', key: 'visible', render: (row: BaseCanvasItem) => row.visible ? '是' : '否' },
  { title: '锁定', key: 'locked', render: (row: BaseCanvasItem) => row.locked ? '是' : '否' },
  { title: '卡片ID', key: 'cardId', render: (row: BaseCanvasItem) => row.cardData.cardId || '-' }
]

// 测试方法
const runValidationTest = () => {
  console.log('Running validation test...')
  testResults.value.validation = adapter.validate(adapter.parsePanelData(testLegacyData))
  console.log('Validation result:', testResults.value.validation)
}

const runConversionTest = () => {
  console.log('Running conversion test...')
  const legacyItems = adapter.parsePanelData(testLegacyData)
  testResults.value.conversion = adapter.convertBatch(legacyItems)
  console.log('Conversion result:', testResults.value.conversion)
}

const runMigrationTest = () => {
  console.log('Running migration test...')
  try {
    // 测试版本迁移
    const mockOldData = [
      { x: 0, y: 0, w: 2, h: 2, i: 1, data: { cardId: 'test', config: {} } }
    ]
    
    // 模拟从1.0.0到1.1.0的迁移
    const migrated = adapter.migrate(mockOldData, '1.0.0', '1.1.0')
    
    testResults.value.migration = {
      success: true,
      original: mockOldData,
      migrated: migrated,
      errors: []
    }
  } catch (error) {
    testResults.value.migration = {
      success: false,
      errors: [error.message]
    }
  }
  console.log('Migration result:', testResults.value.migration)
}

const runStatisticsTest = () => {
  console.log('Running statistics test...')
  testResults.value.statistics = adapter.getDataStatistics(testLegacyData)
  console.log('Statistics result:', testResults.value.statistics)
}

const runAllTests = () => {
  runValidationTest()
  runConversionTest()
  runMigrationTest()
  runStatisticsTest()
}

// 生命周期
onMounted(() => {
  runAllTests()
})
</script>

<template>
  <div class="legacy-compatibility-test p-6 max-w-7xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">现有数据格式兼容性测试</h1>
      <p class="text-gray-600">测试LegacyPanelAdapter对现有面板数据格式的支持情况</p>
    </div>

    <!-- 控制面板 -->
    <NCard class="mb-6">
      <template #header>
        <span class="text-lg font-semibold">测试控制</span>
      </template>
      <NSpace>
        <NButton type="primary" @click="runAllTests">运行所有测试</NButton>
        <NButton @click="runValidationTest">数据验证</NButton>
        <NButton @click="runConversionTest">格式转换</NButton>
        <NButton @click="runMigrationTest">版本迁移</NButton>
        <NButton @click="runStatisticsTest">统计分析</NButton>
      </NSpace>
    </NCard>

    <!-- 测试结果 -->
    <NTabs v-model:value="activeTab" type="card">
      <!-- 数据验证 -->
      <NTabPane name="validation" tab="数据验证">
        <NCard>
          <template #header>
            <div class="flex items-center gap-2">
              <span>数据验证结果</span>
              <NTag 
                v-if="testResults.validation"
                :type="validationStatus === 'success' ? 'success' : 'error'"
              >
                {{ validationStatus === 'success' ? '通过' : '失败' }}
              </NTag>
            </div>
          </template>
          
          <div v-if="testResults.validation" class="space-y-4">
            <div>
              <strong>验证状态:</strong> 
              {{ testResults.validation.valid ? '✅ 数据格式有效' : '❌ 数据格式无效' }}
            </div>
            
            <div v-if="testResults.validation.errors.length > 0">
              <strong>错误信息:</strong>
              <NAlert 
                v-for="(error, index) in testResults.validation.errors" 
                :key="index"
                type="error" 
                class="mt-2"
              >
                {{ error.path }}: {{ error.message }} ({{ error.code }})
              </NAlert>
            </div>
            
            <div v-if="testResults.validation.warnings.length > 0">
              <strong>警告信息:</strong>
              <NAlert 
                v-for="(warning, index) in testResults.validation.warnings" 
                :key="index"
                type="warning" 
                class="mt-2"
              >
                {{ warning.path }}: {{ warning.message }} ({{ warning.code }})
              </NAlert>
            </div>
          </div>
        </NCard>
      </NTabPane>

      <!-- 格式转换 -->
      <NTabPane name="conversion" tab="格式转换">
        <NCard>
          <template #header>
            <div class="flex items-center gap-2">
              <span>格式转换结果</span>
              <NTag 
                v-if="testResults.conversion"
                :type="conversionStatus === 'success' ? 'success' : 'error'"
              >
                {{ conversionStatus === 'success' ? '成功' : '失败' }}
              </NTag>
            </div>
          </template>
          
          <div v-if="testResults.conversion" class="space-y-6">
            <!-- 转换统计 -->
            <div class="grid grid-cols-4 gap-4">
              <div class="text-center p-4 bg-blue-50 rounded">
                <div class="text-2xl font-bold text-blue-600">{{ testResults.conversion.statistics.total }}</div>
                <div class="text-sm text-gray-600">总项目数</div>
              </div>
              <div class="text-center p-4 bg-green-50 rounded">
                <div class="text-2xl font-bold text-green-600">{{ testResults.conversion.statistics.converted }}</div>
                <div class="text-sm text-gray-600">转换成功</div>
              </div>
              <div class="text-center p-4 bg-red-50 rounded">
                <div class="text-2xl font-bold text-red-600">{{ testResults.conversion.statistics.failed }}</div>
                <div class="text-sm text-gray-600">转换失败</div>
              </div>
              <div class="text-center p-4 bg-yellow-50 rounded">
                <div class="text-2xl font-bold text-yellow-600">{{ testResults.conversion.statistics.skipped }}</div>
                <div class="text-sm text-gray-600">跳过</div>
              </div>
            </div>

            <!-- 原始数据 -->
            <div>
              <h3 class="text-lg font-semibold mb-3">原始数据 (Legacy Format)</h3>
              <NTable 
                :columns="originalDataColumns" 
                :data="adapter.parsePanelData(testLegacyData)"
                size="small"
                :scroll-x="800"
              />
            </div>

            <!-- 转换后数据 -->
            <div>
              <h3 class="text-lg font-semibold mb-3">转换后数据 (BaseCanvasItem Format)</h3>
              <NTable 
                :columns="convertedDataColumns" 
                :data="testResults.conversion.data"
                size="small"
                :scroll-x="1000"
              />
            </div>

            <!-- 错误信息 -->
            <div v-if="testResults.conversion.errors.length > 0">
              <h3 class="text-lg font-semibold mb-3">转换错误</h3>
              <NAlert 
                v-for="(error, index) in testResults.conversion.errors" 
                :key="index"
                type="error" 
                class="mb-2"
              >
                {{ error }}
              </NAlert>
            </div>

            <!-- 警告信息 -->
            <div v-if="testResults.conversion.warnings.length > 0">
              <h3 class="text-lg font-semibold mb-3">转换警告</h3>
              <NAlert 
                v-for="(warning, index) in testResults.conversion.warnings" 
                :key="index"
                type="warning" 
                class="mb-2"
              >
                {{ warning }}
              </NAlert>
            </div>
          </div>
        </NCard>
      </NTabPane>

      <!-- 版本迁移 -->
      <NTabPane name="migration" tab="版本迁移">
        <NCard>
          <template #header>
            <div class="flex items-center gap-2">
              <span>版本迁移测试</span>
              <NTag 
                v-if="testResults.migration"
                :type="testResults.migration.success ? 'success' : 'error'"
              >
                {{ testResults.migration.success ? '成功' : '失败' }}
              </NTag>
            </div>
          </template>
          
          <div v-if="testResults.migration" class="space-y-4">
            <div>
              <strong>迁移路径:</strong> 1.0.0 → 1.1.0
            </div>
            
            <div>
              <h4 class="font-semibold mb-2">原始数据:</h4>
              <pre class="bg-gray-100 p-3 rounded text-sm overflow-x-auto">{{ JSON.stringify(testResults.migration.original, null, 2) }}</pre>
            </div>
            
            <div>
              <h4 class="font-semibold mb-2">迁移后数据:</h4>
              <pre class="bg-gray-100 p-3 rounded text-sm overflow-x-auto">{{ JSON.stringify(testResults.migration.migrated, null, 2) }}</pre>
            </div>
            
            <div v-if="testResults.migration.errors.length > 0">
              <h4 class="font-semibold mb-2">迁移错误:</h4>
              <NAlert 
                v-for="(error, index) in testResults.migration.errors" 
                :key="index"
                type="error" 
                class="mb-2"
              >
                {{ error }}
              </NAlert>
            </div>
          </div>
        </NCard>
      </NTabPane>

      <!-- 统计分析 -->
      <NTabPane name="statistics" tab="统计分析">
        <NCard>
          <template #header>
            <span>数据统计分析</span>
          </template>
          
          <div v-if="testResults.statistics" class="space-y-6">
            <!-- 基础统计 -->
            <div class="grid grid-cols-3 gap-4">
              <div class="text-center p-4 bg-blue-50 rounded">
                <div class="text-2xl font-bold text-blue-600">{{ testResults.statistics.totalItems }}</div>
                <div class="text-sm text-gray-600">总项目数</div>
              </div>
              <div class="text-center p-4 bg-green-50 rounded">
                <div class="text-2xl font-bold text-green-600">{{ testResults.statistics.dynamicItems }}</div>
                <div class="text-sm text-gray-600">动态项目</div>
              </div>
              <div class="text-center p-4 bg-orange-50 rounded">
                <div class="text-2xl font-bold text-orange-600">{{ testResults.statistics.staticItems }}</div>
                <div class="text-sm text-gray-600">静态项目</div>
              </div>
            </div>

            <!-- 卡片类型分布 -->
            <div>
              <h4 class="font-semibold mb-3">卡片类型分布</h4>
              <div class="space-y-2">
                <div 
                  v-for="(count, type) in testResults.statistics.cardTypes" 
                  :key="type"
                  class="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <span class="font-medium">{{ type }}</span>
                  <NTag>{{ count }}</NTag>
                </div>
              </div>
            </div>

            <!-- 数据源类型分布 -->
            <div>
              <h4 class="font-semibold mb-3">数据源类型分布</h4>
              <div class="space-y-2">
                <div 
                  v-for="(count, type) in testResults.statistics.dataSourceTypes" 
                  :key="type"
                  class="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <span class="font-medium">{{ type }}</span>
                  <NTag>{{ count }}</NTag>
                </div>
              </div>
            </div>

            <!-- 网格边界信息 -->
            <div>
              <h4 class="font-semibold mb-3">网格边界信息</h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span>最大X坐标:</span>
                    <span class="font-mono">{{ testResults.statistics.gridBounds.maxX }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>最大Y坐标:</span>
                    <span class="font-mono">{{ testResults.statistics.gridBounds.maxY }}</span>
                  </div>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span>最大宽度:</span>
                    <span class="font-mono">{{ testResults.statistics.gridBounds.maxW }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>最大高度:</span>
                    <span class="font-mono">{{ testResults.statistics.gridBounds.maxH }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </NCard>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.legacy-compatibility-test {
  background-color: #fafafa;
  min-height: 100vh;
}

pre {
  max-height: 300px;
  overflow-y: auto;
}

:deep(.n-table) {
  font-size: 13px;
}

:deep(.n-table th) {
  font-weight: 600;
}
</style>