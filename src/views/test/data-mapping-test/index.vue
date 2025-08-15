<template>
  <div class="data-mapping-test">
    <!-- 页面头部 -->
    <div class="test-header">
      <n-page-header @back="$router.back()">
        <template #title>数据映射器测试</template>
        <template #subtitle>字段映射组件功能验证</template>
      </n-page-header>
    </div>

    <!-- 主要内容区域 -->
    <div class="test-content">
      <n-grid :cols="12" :x-gap="16" :y-gap="16">
        <!-- 左侧：数据映射器配置 -->
        <n-gi :span="6">
          <n-card title="数据映射器配置" size="small">
            <n-space vertical :size="16">
              <!-- 原始数据输入 -->
              <n-form-item label="原始数据" size="small">
                <n-select
                  v-model:value="selectedSampleData"
                  :options="sampleDataOptions"
                  @update:value="handleSampleDataChange"
                />
              </n-form-item>

              <n-form-item label="JSON数据" size="small">
                <n-input
                  v-model:value="rawJsonData"
                  type="textarea"
                  placeholder="输入JSON格式的原始数据"
                  :rows="8"
                  @update:value="handleRawDataChange"
                />
              </n-form-item>

              <n-space size="small">
                <n-button size="small" @click="formatJsonData">格式化</n-button>
                <n-button size="small" @click="loadComplexSample">复杂示例</n-button>
                <n-button size="small" @click="loadArraySample">数组示例</n-button>
              </n-space>

              <!-- 数据映射器组件 -->
              <n-divider />
              <DataFieldMappingInput
                v-model="fieldMappings"
                :preview-data="parsedRawData"
                :show-preview="true"
                @mapping-change="handleMappingChange"
              />
            </n-space>
          </n-card>
        </n-gi>

        <!-- 右侧：映射结果展示 -->
        <n-gi :span="6">
          <n-card title="映射结果展示" size="small">
            <n-space vertical :size="16">
              <!-- 映射状态 -->
              <n-alert :type="mappingStatus.type" size="small" :show-icon="false">
                <template #header>映射状态</template>
                <div>{{ mappingStatus.message }}</div>
                <div v-if="mappedData" style="margin-top: 4px">
                  <n-text depth="3" style="font-size: 12px">
                    映射字段数: {{ getMappedFieldCount() }} | 数据类型:
                    {{ Array.isArray(mappedData) ? '数组' : '对象' }} | 更新时间: {{ lastUpdateTime }}
                  </n-text>
                </div>
              </n-alert>

              <!-- 使用字段映射测试组件展示结果 -->
              <div class="mapped-result">
                <FieldMappingDemo :mapped-data="mappedData" :show-debug-info="showDebugInfo" />
              </div>

              <!-- 控制选项 -->
              <n-space align="center">
                <n-switch v-model:value="showDebugInfo" size="small" />
                <n-text depth="3" style="font-size: 12px">显示调试信息</n-text>
              </n-space>
            </n-space>
          </n-card>
        </n-gi>
      </n-grid>
    </div>

    <!-- 底部：测试说明和常见用例 -->
    <div class="test-footer">
      <n-card title="测试说明和常见用例" size="small">
        <n-tabs type="line" size="small">
          <n-tab-pane name="instructions" tab="使用说明">
            <n-space vertical :size="12">
              <div class="instruction-item">
                <n-text strong>1. 基本使用</n-text>
                <ul style="margin: 8px 0; padding-left: 20px">
                  <li>选择或输入原始JSON数据</li>
                  <li>点击"添加字段映射"配置映射规则</li>
                  <li>设置目标字段名和源字段路径</li>
                  <li>查看右侧实时映射结果</li>
                </ul>
              </div>

              <div class="instruction-item">
                <n-text strong>2. 字段映射规则</n-text>
                <ul style="margin: 8px 0; padding-left: 20px">
                  <li>
                    <n-code>name</n-code>
                    - 简单字段映射
                  </li>
                  <li>
                    <n-code>user.name</n-code>
                    - 嵌套对象字段
                  </li>
                  <li>
                    <n-code>user.profile.name</n-code>
                    - 深层嵌套字段
                  </li>
                  <li>支持数组和对象两种数据结构</li>
                </ul>
              </div>

              <div class="instruction-item">
                <n-text strong>3. 常见场景</n-text>
                <ul style="margin: 8px 0; padding-left: 20px">
                  <li>API数据字段名适配</li>
                  <li>数据库字段映射</li>
                  <li>多语言字段转换</li>
                  <li>复杂数据结构扁平化</li>
                </ul>
              </div>
            </n-space>
          </n-tab-pane>

          <n-tab-pane name="examples" tab="示例用例">
            <n-space vertical :size="12">
              <div class="example-item">
                <n-text strong>示例1: 用户信息映射</n-text>
                <n-code-group style="margin-top: 8px">
                  <n-code language="json" title="原始数据">{{ userMappingExample.source }}</n-code>
                  <n-code language="json" title="映射规则">{{ userMappingExample.rules }}</n-code>
                  <n-code language="json" title="映射结果">{{ userMappingExample.result }}</n-code>
                </n-code-group>
              </div>

              <div class="example-item">
                <n-text strong>示例2: 产品列表映射</n-text>
                <n-code-group style="margin-top: 8px">
                  <n-code language="json" title="原始数据">{{ productMappingExample.source }}</n-code>
                  <n-code language="json" title="映射规则">{{ productMappingExample.rules }}</n-code>
                  <n-code language="json" title="映射结果">{{ productMappingExample.result }}</n-code>
                </n-code-group>
              </div>
            </n-space>
          </n-tab-pane>
        </n-tabs>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据映射器测试页面
 * 专门用于测试 DataFieldMappingInput 组件功能
 */

import { ref, computed, watch } from 'vue'
import {
  NPageHeader,
  NGrid,
  NGi,
  NCard,
  NSpace,
  NFormItem,
  NSelect,
  NInput,
  NButton,
  NDivider,
  NAlert,
  NText,
  NSwitch,
  NTabs,
  NTabPane,
  NCode,
  NCodeGroup,
  useMessage
} from 'naive-ui'

// 导入组件
import DataFieldMappingInput from '@/components/visual-editor/configuration/components/DataFieldMappingInput.vue'
import FieldMappingDemo from '@/card2.1/components/field-mapping-demo/FieldMappingDemo.vue'

// 响应式状态
const message = useMessage()
const selectedSampleData = ref('user')
const rawJsonData = ref('')
const fieldMappings = ref<Array<{ targetField: string; sourcePath: string }>>([])
const mappedData = ref<any>(null)
const lastUpdateTime = ref('')
const showDebugInfo = ref(false)

// 示例数据选项
const sampleDataOptions = [
  { label: '用户信息', value: 'user' },
  { label: '产品信息', value: 'product' },
  { label: '订单信息', value: 'order' },
  { label: '员工信息', value: 'employee' },
  { label: '自定义', value: 'custom' }
]

// 示例数据
const sampleDataMap = {
  user: {
    xingming: '张三',
    nianling: 28,
    youxiang: 'zhangsan@example.com',
    gongsi: {
      mingcheng: '科技有限公司',
      bumen: '技术部',
      zhiwei: '前端工程师'
    },
    dizhi: {
      sheng: '北京市',
      shi: '北京市',
      qu: '朝阳区',
      xiangxi: '某某街道123号'
    }
  },
  product: {
    chanpinming: 'iPhone 15',
    jiage: 7999,
    kucun: 100,
    fenglei: {
      zhulei: '电子产品',
      zilei: '智能手机'
    },
    guige: {
      yanse: '深空灰色',
      rongliuang: '128GB',
      chicun: '6.1英寸'
    }
  },
  order: {
    dingdanhao: 'ORD-20240814-001',
    goumairen: '李四',
    zongjine: 15998,
    shangpinliebiao: [
      { mingcheng: 'iPhone 15', jiage: 7999, shuliang: 2 },
      { mingcheng: 'AirPods Pro', jiage: 1999, shuliang: 1 }
    ],
    shouhuo: {
      xingming: '李四',
      dianhua: '13800138000',
      dizhi: '上海市浦东新区某某路456号'
    }
  },
  employee: {
    yuangonghao: 'EMP001',
    xingming: '王五',
    bumen: '人力资源部',
    ruzhi: '2023-01-15',
    xinzi: 8000,
    lianxifangshi: {
      shouji: '13900139000',
      youxiang: 'wangwu@company.com',
      weixinhao: 'wangwu_hr'
    }
  }
}

// 复杂示例数据
const complexSampleData = {
  api_response: {
    status: 'success',
    data: {
      user_list: [
        {
          personal_info: {
            first_name: 'John',
            last_name: 'Doe',
            contact: {
              phone_number: '+1-555-0123',
              email_address: 'john.doe@example.com'
            }
          },
          work_info: {
            company_name: 'Tech Corp',
            department_name: 'Engineering',
            job_title: 'Senior Developer'
          }
        }
      ]
    }
  }
}

// 数组示例数据
const arrayArrayData = [
  { chanpinming: '笔记本电脑', jiage: 5999, kucun: 50 },
  { chanpinming: '台式机', jiage: 3999, kucun: 30 },
  { chanpinming: '显示器', jiage: 1299, kucun: 100 }
]

// 计算属性
const parsedRawData = computed(() => {
  try {
    return rawJsonData.value ? JSON.parse(rawJsonData.value) : null
  } catch (error) {
    return null
  }
})

const mappingStatus = computed(() => {
  if (!fieldMappings.value || fieldMappings.value.length === 0) {
    return { type: 'info', message: '请添加字段映射规则' }
  }

  if (!parsedRawData.value) {
    return { type: 'warning', message: '请输入有效的JSON数据' }
  }

  if (mappedData.value) {
    return { type: 'success', message: '映射成功，数据已更新' }
  }

  return { type: 'warning', message: '等待映射结果' }
})

// 示例用例数据
const userMappingExample = {
  source: JSON.stringify(
    {
      xingming: '张三',
      nianling: 28,
      gongsi: { mingcheng: '科技公司', bumen: '技术部' }
    },
    null,
    2
  ),
  rules: JSON.stringify(
    [
      { targetField: 'name', sourcePath: 'xingming' },
      { targetField: 'age', sourcePath: 'nianling' },
      { targetField: 'company', sourcePath: 'gongsi.mingcheng' },
      { targetField: 'department', sourcePath: 'gongsi.bumen' }
    ],
    null,
    2
  ),
  result: JSON.stringify(
    {
      name: '张三',
      age: 28,
      company: '科技公司',
      department: '技术部'
    },
    null,
    2
  )
}

const productMappingExample = {
  source: JSON.stringify(
    [
      { chanpinming: '手机', jiage: 2999 },
      { chanpinming: '电脑', jiage: 5999 }
    ],
    null,
    2
  ),
  rules: JSON.stringify(
    [
      { targetField: 'title', sourcePath: 'chanpinming' },
      { targetField: 'price', sourcePath: 'jiage' }
    ],
    null,
    2
  ),
  result: JSON.stringify(
    [
      { title: '手机', price: 2999 },
      { title: '电脑', price: 5999 }
    ],
    null,
    2
  )
}

// 方法
const handleSampleDataChange = (value: string) => {
  if (value === 'custom') {
    rawJsonData.value = ''
    return
  }

  const sampleData = sampleDataMap[value as keyof typeof sampleDataMap]
  if (sampleData) {
    rawJsonData.value = JSON.stringify(sampleData, null, 2)
  }
}

const handleRawDataChange = () => {
  selectedSampleData.value = 'custom'
}

const formatJsonData = () => {
  try {
    const parsed = JSON.parse(rawJsonData.value)
    rawJsonData.value = JSON.stringify(parsed, null, 2)
    message.success('JSON格式化成功')
  } catch (error) {
    message.error('JSON格式错误，无法格式化')
  }
}

const loadComplexSample = () => {
  rawJsonData.value = JSON.stringify(complexSampleData, null, 2)
  selectedSampleData.value = 'custom'
  message.success('已加载复杂示例数据')
}

const loadArraySample = () => {
  rawJsonData.value = JSON.stringify(arrayArrayData, null, 2)
  selectedSampleData.value = 'custom'
  message.success('已加载数组示例数据')
}

const handleMappingChange = (mappedResult: any) => {
  mappedData.value = mappedResult
  lastUpdateTime.value = new Date().toLocaleTimeString()
}

const getMappedFieldCount = () => {
  if (!mappedData.value) return 0

  if (Array.isArray(mappedData.value)) {
    return mappedData.value.length > 0 ? Object.keys(mappedData.value[0] || {}).length : 0
  } else if (typeof mappedData.value === 'object') {
    return Object.keys(mappedData.value).length
  }

  return 1
}

// 初始化
handleSampleDataChange(selectedSampleData.value)
</script>

<style scoped>
.data-mapping-test {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--body-color);
}

.test-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.test-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.test-footer {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  background: var(--card-color);
}

.mapped-result {
  width: 100%;
  min-height: 300px;
}

.instruction-item,
.example-item {
  margin-bottom: 16px;
}

.instruction-item ul,
.example-item ul {
  color: var(--text-color-2);
  font-size: 14px;
}

.instruction-item li,
.example-item li {
  margin-bottom: 4px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .test-content :deep(.n-grid) {
    display: block;
  }

  .test-content :deep(.n-gi) {
    margin-bottom: 16px;
  }
}

@media (max-width: 768px) {
  .test-header,
  .test-content,
  .test-footer {
    padding: 8px;
  }
}
</style>
