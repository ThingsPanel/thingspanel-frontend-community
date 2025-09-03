<template>
  <div class="integration-test-page">
    <!-- 页面标题 -->
    <n-card class="header-card">
      <template #header>
        <n-space align="center">
          <n-icon size="24" color="#2080f0">
            <LinkIcon />
          </n-icon>
          <span>跨组件属性绑定集成测试</span>
        </n-space>
      </template>

      <n-alert type="info" :bordered="false">
        <template #header>测试说明</template>
        <ul>
          <li>
            <strong>目标</strong>
            ：验证完整的跨组件属性绑定链路
          </li>
          <li>
            <strong>流程</strong>
            ：HttpConfigForm 配置参数绑定 → 组件属性更新 → 实时UI变化
          </li>
          <li>
            <strong>涉及组件</strong>
            ：ComponentPropertySelector、AutoFormGenerator、InteractionManager
          </li>
        </ul>
      </n-alert>
    </n-card>

    <!-- 主测试区域 -->
    <n-grid :cols="2" :x-gap="20">
      <!-- 左侧：目标组件展示 -->
      <n-grid-item>
        <n-card title="目标组件展示区">
          <!-- Simple Display 组件实例 -->
          <div class="component-showcase">
            <h4>Simple Display 组件（新三文件结构）</h4>

            <SimpleDisplayComponent
              ref="simpleDisplayRef"
              :component-id="targetComponentId"
              :custom-config="simpleDisplayConfig"
              :preview-mode="true"
              :show-interaction-indicator="true"
              @update:config="handleSimpleDisplayUpdate"
            />

            <!-- 组件状态显示 -->
            <n-collapse class="component-status">
              <n-collapse-item title="组件当前配置" name="config">
                <pre>{{ JSON.stringify(simpleDisplayConfig, null, 2) }}</pre>
              </n-collapse-item>

              <n-collapse-item title="InteractionManager 状态" name="interaction">
                <pre>{{ JSON.stringify(componentInteractionState, null, 2) }}</pre>
              </n-collapse-item>
            </n-collapse>
          </div>
        </n-card>
      </n-grid-item>

      <!-- 右侧：属性绑定配置 -->
      <n-grid-item>
        <n-card title="属性绑定配置区">
          <!-- HTTP 配置表单 -->
          <div class="binding-config">
            <h4>HTTP 配置与属性绑定</h4>

            <!-- 模拟的 HTTP 配置表单 -->
            <n-form :model="httpConfig" label-placement="top">
              <n-form-item label="请求方法">
                <n-select v-model:value="httpConfig.method" :options="methodOptions" />
              </n-form-item>

              <n-form-item label="请求URL">
                <n-input v-model:value="httpConfig.url" placeholder="https://api.example.com/data" />
              </n-form-item>

              <!-- 动态参数配置 -->
              <n-form-item label="请求参数">
                <div class="dynamic-parameters">
                  <div v-for="(param, index) in httpConfig.parameters" :key="index" class="parameter-item">
                    <n-input-group>
                      <n-input v-model:value="param.name" placeholder="参数名" style="width: 30%" />

                      <n-select v-model:value="param.type" :options="parameterTypeOptions" style="width: 30%" />

                      <!-- 组件属性选择器 -->
                      <ComponentPropertySelector
                        v-if="param.type === 'component-property-binding'"
                        v-model:value="param.bindingExpression"
                        style="width: 35%"
                      />

                      <!-- 静态值输入 -->
                      <n-input v-else v-model:value="param.value" placeholder="参数值" style="width: 35%" />

                      <n-button type="error" ghost size="small" style="width: 5%" @click="removeParameter(index)">
                        <template #icon>
                          <n-icon><DeleteIcon /></n-icon>
                        </template>
                      </n-button>
                    </n-input-group>
                  </div>

                  <n-button dashed block class="add-parameter-btn" @click="addParameter">
                    <template #icon>
                      <n-icon><AddIcon /></n-icon>
                    </template>
                    添加参数
                  </n-button>
                </div>
              </n-form-item>

              <!-- 响应处理配置 -->
              <n-form-item label="响应处理">
                <n-space vertical>
                  <div class="response-mapping">
                    <h5>属性映射配置</h5>
                    <div v-for="(mapping, index) in httpConfig.responseMapping" :key="index" class="mapping-item">
                      <n-input-group>
                        <n-input
                          v-model:value="mapping.responsePath"
                          placeholder="响应字段路径 (如: data.title)"
                          style="width: 40%"
                        />

                        <ComponentPropertySelector
                          v-model:value="mapping.targetProperty"
                          placeholder="目标组件属性"
                          style="width: 50%"
                        />

                        <n-button type="error" ghost size="small" style="width: 10%" @click="removeMapping(index)">
                          <template #icon>
                            <n-icon><DeleteIcon /></n-icon>
                          </template>
                        </n-button>
                      </n-input-group>
                    </div>

                    <n-button dashed block class="add-mapping-btn" @click="addResponseMapping">
                      <template #icon>
                        <n-icon><AddIcon /></n-icon>
                      </template>
                      添加响应映射
                    </n-button>
                  </div>
                </n-space>
              </n-form-item>
            </n-form>
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 测试操作区域 -->
    <n-card class="test-actions">
      <template #header>测试操作</template>

      <n-space>
        <!-- 模拟HTTP请求 -->
        <n-button type="primary" :loading="isExecutingRequest" @click="executeHttpRequest">
          <template #icon>
            <n-icon><PlayIcon /></n-icon>
          </template>
          执行HTTP请求（模拟）
        </n-button>

        <!-- 直接属性更新测试 -->
        <n-button type="info" @click="testDirectPropertyUpdate">
          <template #icon>
            <n-icon><EditIcon /></n-icon>
          </template>
          直接属性更新测试
        </n-button>

        <!-- 重置状态 -->
        <n-button type="warning" @click="resetTestState">
          <template #icon>
            <n-icon><RefreshIcon /></n-icon>
          </template>
          重置状态
        </n-button>

        <!-- 导出配置 -->
        <n-button type="success" @click="exportConfiguration">
          <template #icon>
            <n-icon><DownloadIcon /></n-icon>
          </template>
          导出配置
        </n-button>
      </n-space>
    </n-card>

    <!-- 日志输出区域 -->
    <n-card class="test-logs">
      <template #header>
        <n-space align="center">
          <span>测试日志</span>
          <n-button size="tiny" @click="clearLogs">清除日志</n-button>
        </n-space>
      </template>

      <div class="log-container">
        <div v-for="(log, index) in testLogs" :key="index" :class="['log-entry', `log-${log.level}`]">
          <span class="log-time">{{ log.timestamp }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-message">{{ log.message }}</span>
          <pre v-if="log.data" class="log-data">{{ JSON.stringify(log.data, null, 2) }}</pre>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 跨组件属性绑定集成测试页面
 * 验证完整的属性绑定链路：settingConfig → PropertyExposure → ComponentPropertySelector → InteractionManager
 */

import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import {
  NCard,
  NGrid,
  NGridItem,
  NSpace,
  NIcon,
  NAlert,
  NCollapse,
  NCollapseItem,
  NForm,
  NFormItem,
  NInput,
  NInputGroup,
  NSelect,
  NButton,
  useMessage
} from 'naive-ui'
import {
  LinkOutline as LinkIcon,
  PlayOutline as PlayIcon,
  CreateOutline as EditIcon,
  RefreshOutline as RefreshIcon,
  DownloadOutline as DownloadIcon,
  AddOutline as AddIcon,
  TrashOutline as DeleteIcon
} from '@vicons/ionicons5'

// 导入相关组件和服务
import SimpleDisplayComponent from '@/card2.1/components/simple-display/index.vue'
import ComponentPropertySelector from '@/core/data-architecture/components/common/ComponentPropertySelector.vue'
import { simpleDisplaySettingConfig } from '@/card2.1/components/simple-display/settingConfig'
import { interactionManager } from '@/card2.1/core/interaction-manager'
import { ComponentRegistry } from '@/card2.1/core/component-registry'
import type { SimpleDisplayConfig } from '@/card2.1/components/simple-display/settingConfig'

const message = useMessage()

// 测试状态
const targetComponentId = ref('test-simple-display-001')
const isExecutingRequest = ref(false)

// 测试日志
interface TestLog {
  timestamp: string
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
  data?: any
}

const testLogs = ref<TestLog[]>([])

const addLog = (level: TestLog['level'], message: string, data?: any) => {
  testLogs.value.push({
    timestamp: new Date().toLocaleTimeString(),
    level,
    message,
    data
  })
}

const clearLogs = () => {
  testLogs.value = []
}

// Simple Display 配置
const simpleDisplayConfig = ref<SimpleDisplayConfig>({
  ...simpleDisplaySettingConfig.customConfig,
  customize: {
    title: '测试展示组件',
    content: '这是一个用于测试跨组件属性绑定的组件',
    themeColor: '#2080f0',
    fontSize: 16,
    showIcon: true,
    iconName: '🧪'
  }
})

// HTTP 配置
interface HttpParameter {
  name: string
  type: 'static' | 'component-property-binding'
  value?: string
  bindingExpression?: string
}

interface ResponseMapping {
  responsePath: string
  targetProperty: string
}

const httpConfig = reactive({
  method: 'GET',
  url: 'https://jsonplaceholder.typicode.com/posts/1',
  parameters: [
    {
      name: 'componentTitle',
      type: 'component-property-binding',
      bindingExpression: `${targetComponentId.value}.customize.title`
    }
  ] as HttpParameter[],
  responseMapping: [
    {
      responsePath: 'title',
      targetProperty: `${targetComponentId.value}.customize.title`
    },
    {
      responsePath: 'body',
      targetProperty: `${targetComponentId.value}.customize.content`
    }
  ] as ResponseMapping[]
})

// 选项配置
const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' }
]

const parameterTypeOptions = [
  { label: '静态值', value: 'static' },
  { label: '组件属性绑定', value: 'component-property-binding' }
]

// 组件交互状态
const componentInteractionState = computed(() => {
  return interactionManager.getComponentState(targetComponentId.value) || {}
})

// 参数管理
const addParameter = () => {
  httpConfig.parameters.push({
    name: '',
    type: 'static',
    value: ''
  })
}

const removeParameter = (index: number) => {
  httpConfig.parameters.splice(index, 1)
}

const addResponseMapping = () => {
  httpConfig.responseMapping.push({
    responsePath: '',
    targetProperty: ''
  })
}

const removeMapping = (index: number) => {
  httpConfig.responseMapping.splice(index, 1)
}

// 模拟HTTP请求执行
const executeHttpRequest = async () => {
  isExecutingRequest.value = true
  addLog('info', '开始执行HTTP请求', { config: httpConfig })

  try {
    // 1. 解析请求参数中的属性绑定
    const resolvedParameters: Record<string, any> = {}

    for (const param of httpConfig.parameters) {
      if (param.type === 'component-property-binding' && param.bindingExpression) {
        const resolvedValue = interactionManager.resolvePropertyBinding(param.bindingExpression)
        resolvedParameters[param.name] = resolvedValue
        addLog('success', `参数绑定解析: ${param.name} = ${resolvedValue}`, {
          expression: param.bindingExpression,
          value: resolvedValue
        })
      } else if (param.type === 'static') {
        resolvedParameters[param.name] = param.value
      }
    }

    // 2. 模拟发送HTTP请求（使用真实的API进行测试）
    const queryParams = new URLSearchParams(resolvedParameters).toString()
    const requestUrl = queryParams ? `${httpConfig.url}?${queryParams}` : httpConfig.url

    addLog('info', `发送${httpConfig.method}请求到: ${requestUrl}`)

    const response = await fetch(requestUrl, {
      method: httpConfig.method
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const responseData = await response.json()
    addLog('success', 'HTTP请求成功', responseData)

    // 3. 处理响应映射 - 更新目标组件属性
    for (const mapping of httpConfig.responseMapping) {
      if (mapping.responsePath && mapping.targetProperty) {
        // 解析响应字段路径
        const responseValue = getNestedValue(responseData, mapping.responsePath)

        // 解析目标属性路径
        const [targetComponentId, ...propertyPathParts] = mapping.targetProperty.split('.')
        const propertyPath = propertyPathParts.join('.')

        // 通过 InteractionManager 更新组件属性
        const updateSuccess = interactionManager.setComponentProperty(targetComponentId, propertyPath, responseValue)

        if (updateSuccess) {
          addLog('success', `属性更新成功: ${mapping.targetProperty} = ${responseValue}`, {
            responsePath: mapping.responsePath,
            targetProperty: mapping.targetProperty,
            value: responseValue
          })
        } else {
          addLog('error', `属性更新失败: ${mapping.targetProperty}`)
        }
      }
    }

    message.success('HTTP请求执行完成，属性更新成功')
  } catch (error) {
    console.error('HTTP请求执行失败:', error)
    addLog('error', `HTTP请求失败: ${error.message}`, error)
    message.error(`HTTP请求失败: ${error.message}`)
  } finally {
    isExecutingRequest.value = false
  }
}

// 直接属性更新测试
const testDirectPropertyUpdate = () => {
  const updates = [
    {
      propertyPath: 'customize.title',
      newValue: `直接更新测试 - ${Date.now()}`
    },
    {
      propertyPath: 'customize.themeColor',
      newValue: `#${Math.floor(Math.random() * 16777215).toString(16)}`
    },
    {
      propertyPath: 'customize.fontSize',
      newValue: Math.floor(Math.random() * 10) + 14
    }
  ]

  updates.forEach(update => {
    interactionManager.setComponentProperty(targetComponentId.value, update.propertyPath, update.newValue)
    addLog('info', `直接更新属性: ${update.propertyPath} = ${update.newValue}`)
  })

  message.success('直接属性更新测试完成')
}

// 重置测试状态
const resetTestState = () => {
  // 重置组件配置
  simpleDisplayConfig.value = {
    ...simpleDisplaySettingConfig.customConfig,
    customize: {
      title: '测试展示组件',
      content: '这是一个用于测试跨组件属性绑定的组件',
      themeColor: '#2080f0',
      fontSize: 16,
      showIcon: true,
      iconName: '🧪'
    }
  }

  // 重置交互管理器状态
  interactionManager.resetComponentState(targetComponentId.value)

  addLog('warning', '测试状态已重置')
  message.warning('测试状态已重置')
}

// 导出配置
const exportConfiguration = () => {
  const configuration = {
    targetComponentId: targetComponentId.value,
    simpleDisplayConfig: simpleDisplayConfig.value,
    httpConfig: httpConfig,
    componentState: componentInteractionState.value,
    timestamp: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(configuration, null, 2)], {
    type: 'application/json'
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cross-component-binding-config-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  addLog('success', '配置已导出')
  message.success('配置已导出')
}

// 工具函数：获取嵌套对象值
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? current[key] : undefined
  }, obj)
}

// 处理 Simple Display 更新
const handleSimpleDisplayUpdate = (newConfig: SimpleDisplayConfig) => {
  addLog('info', 'Simple Display 配置更新', newConfig)
}

// 组件生命周期
onMounted(() => {
  // 注册 settingConfig 到系统
  ComponentRegistry.registerSettingConfig(simpleDisplaySettingConfig)

  // 注册组件到交互管理器
  interactionManager.registerComponent(targetComponentId.value, [])

  addLog('success', '集成测试页面初始化完成', {
    componentId: targetComponentId.value,
    settingConfig: simpleDisplaySettingConfig.componentType
  })
})

onUnmounted(() => {
  // 清理注册的组件
  interactionManager.unregisterComponent(targetComponentId.value, [])
})
</script>

<style scoped>
.integration-test-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.component-showcase {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.component-status {
  margin-top: 16px;
}

.binding-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dynamic-parameters {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.parameter-item {
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--body-color);
}

.add-parameter-btn,
.add-mapping-btn {
  margin-top: 8px;
}

.response-mapping {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mapping-item {
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--body-color);
}

.test-actions {
  margin: 20px 0;
}

.test-logs {
  margin-top: 20px;
}

.log-container {
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-entry {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid var(--border-color);
}

.log-time {
  color: var(--text-color-3);
  min-width: 80px;
}

.log-level {
  font-weight: bold;
  min-width: 60px;
}

.log-info .log-level {
  color: var(--info-color);
}

.log-success .log-level {
  color: var(--success-color);
}

.log-warning .log-level {
  color: var(--warning-color);
}

.log-error .log-level {
  color: var(--error-color);
}

.log-message {
  flex: 1;
  color: var(--text-color);
}

.log-data {
  margin: 4px 0 0 150px;
  font-size: 11px;
  color: var(--text-color-2);
  background: var(--code-color);
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  :deep(.n-grid) {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 600px) {
  .integration-test-page {
    padding: 16px;
  }

  .log-entry {
    flex-direction: column;
    gap: 4px;
  }

  .log-data {
    margin-left: 0;
  }
}
</style>
