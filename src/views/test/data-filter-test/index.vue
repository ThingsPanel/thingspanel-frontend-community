<template>
  <div class="data-filter-test-page">
    <n-card title="🔧 数据过滤器测试" size="small">
      <div class="test-content">
        <!-- 复杂数据源输入 -->
        <div class="test-section">
          <h3>复杂数据源</h3>
          <n-input
            v-model:value="complexDataJson"
            type="textarea"
            :rows="10"
            placeholder="输入复杂的JSON数据进行过滤测试"
          />
          <n-space style="margin-top: 8px">
            <n-button size="small" @click="loadSampleComplexData">加载示例数据</n-button>
            <n-button size="small" @click="formatComplexData">格式化</n-button>
          </n-space>
        </div>

        <!-- 数据过滤器组件 -->
        <div class="test-section">
          <h3>数据过滤器</h3>
          <DataFilterInput v-model="filterPath" :source-data="parsedComplexData" @filter-change="handleFilterResult" />
        </div>

        <!-- 过滤结果显示 -->
        <div class="test-section">
          <h3>过滤结果</h3>
          <div v-if="filterResult !== null" class="result-display">
            <n-alert type="success" size="small">
              <template #header>✅ 过滤成功</template>
              <div>数据类型: {{ typeof filterResult }} {{ Array.isArray(filterResult) ? '(数组)' : '' }}</div>
            </n-alert>
            <n-code
              :code="filterResultJson"
              language="json"
              :hljs="true"
              style="margin-top: 8px; max-height: 300px; overflow-y: auto"
            />
          </div>
          <div v-else class="no-result">
            <n-empty description="暂无过滤结果" size="small" />
          </div>
        </div>

        <!-- 过滤路径示例 -->
        <div class="test-section">
          <h3>常用过滤路径示例</h3>
          <n-space vertical>
            <n-card v-for="example in pathExamples" :key="example.path" size="small">
              <div class="example-item">
                <div class="example-path">
                  <n-tag type="info">{{ example.path }}</n-tag>
                  <n-button size="tiny" quaternary @click="applyExamplePath(example.path)">应用</n-button>
                </div>
                <div class="example-desc">{{ example.description }}</div>
              </div>
            </n-card>
          </n-space>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NCard, NInput, NButton, NSpace, NCode, NAlert, NEmpty, NTag, useMessage } from 'naive-ui'
import DataFilterInput from '@/components/visual-editor/configuration/components/DataFilterInput.vue'

// 响应式数据
const complexDataJson = ref('')
const filterPath = ref('')
const filterResult = ref<any>(null)
const message = useMessage()

// 解析后的复杂数据
const parsedComplexData = computed(() => {
  try {
    return JSON.parse(complexDataJson.value || '{}')
  } catch (error) {
    return null
  }
})

// 过滤结果的JSON字符串
const filterResultJson = computed(() => {
  try {
    return JSON.stringify(filterResult.value, null, 2)
  } catch (error) {
    return String(filterResult.value)
  }
})

// 处理过滤结果
const handleFilterResult = (result: any, isValid: boolean) => {
  filterResult.value = result
  if (isValid) {
    console.log('✅ 过滤成功:', result)
  } else {
    console.log('❌ 过滤失败或路径错误')
  }
}

// 加载示例复杂数据
const loadSampleComplexData = () => {
  const sampleData = {
    status: 'success',
    message: '数据获取成功',
    timestamp: Date.now(),
    data: {
      users: [
        {
          id: 1,
          name: '张三',
          email: 'zhangsan@example.com',
          profile: {
            age: 25,
            city: '北京',
            skills: ['JavaScript', 'Vue', 'React']
          }
        },
        {
          id: 2,
          name: '李四',
          email: 'lisi@example.com',
          profile: {
            age: 30,
            city: '上海',
            skills: ['Python', 'Django', 'FastAPI']
          }
        }
      ],
      statistics: {
        totalUsers: 2,
        activeUsers: 1,
        metrics: {
          loginCount: 156,
          pageViews: 2340,
          conversions: [
            { date: '2025-01-01', count: 23 },
            { date: '2025-01-02', count: 31 },
            { date: '2025-01-03', count: 28 }
          ]
        }
      },
      config: {
        pagination: {
          page: 1,
          limit: 10,
          total: 2
        },
        filters: {
          status: ['active', 'inactive'],
          dateRange: {
            start: '2025-01-01',
            end: '2025-01-31'
          }
        }
      }
    }
  }

  complexDataJson.value = JSON.stringify(sampleData, null, 2)
  message.success('示例数据已加载')
}

// 格式化复杂数据
const formatComplexData = () => {
  try {
    const parsed = JSON.parse(complexDataJson.value)
    complexDataJson.value = JSON.stringify(parsed, null, 2)
    message.success('数据格式化成功')
  } catch (error) {
    message.error('JSON格式错误，无法格式化')
  }
}

// 应用示例路径
const applyExamplePath = (path: string) => {
  filterPath.value = path
  message.success(`已应用过滤路径: ${path}`)
}

// 过滤路径示例
const pathExamples = [
  {
    path: '$',
    description: '获取完整数据（不过滤）'
  },
  {
    path: '$.data',
    description: '获取 data 字段的所有内容'
  },
  {
    path: '$.data.users',
    description: '获取用户列表数组'
  },
  {
    path: '$.data.users[0]',
    description: '获取第一个用户信息'
  },
  {
    path: '$.data.users[0].name',
    description: '获取第一个用户的姓名'
  },
  {
    path: '$.data.statistics',
    description: '获取统计信息对象'
  },
  {
    path: '$.data.statistics.metrics',
    description: '获取详细指标数据'
  },
  {
    path: '$.data.statistics.metrics.conversions',
    description: '获取转化数据数组'
  },
  {
    path: '$.data.config.pagination',
    description: '获取分页配置信息'
  },
  {
    path: '$.status',
    description: '获取状态字段'
  }
]

// 初始化
loadSampleComplexData()
</script>

<style scoped>
.data-filter-test-page {
  padding: 16px;
}

.test-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.test-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.test-section h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.result-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.no-result {
  padding: 20px;
  text-align: center;
}

.example-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.example-path {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.example-desc {
  font-size: 12px;
  color: var(--text-color-2);
}

/* 响应式设计 */
@media (min-width: 768px) {
  .test-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    grid-template-areas:
      'source filter'
      'result examples';
  }

  .test-section:nth-child(1) {
    grid-area: source;
  }
  .test-section:nth-child(2) {
    grid-area: filter;
  }
  .test-section:nth-child(3) {
    grid-area: result;
  }
  .test-section:nth-child(4) {
    grid-area: examples;
  }
}
</style>
