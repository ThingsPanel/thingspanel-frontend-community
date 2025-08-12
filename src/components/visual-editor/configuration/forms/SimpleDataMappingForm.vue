<template>
  <div class="simple-data-mapping-form">
    <!-- 组件数据需求信息 -->
    <div v-if="componentRequirements" class="requirements-info">
      <n-card size="small" :bordered="false" class="requirements-card">
        <template #header>
          <div class="requirements-header">
            <n-icon size="16"><ListOutline /></n-icon>
            <span>{{ componentRequirements.componentName }} - 数据需求</span>
          </div>
        </template>

        <div class="requirements-summary">
          <n-text depth="2">
            需要 {{ componentRequirements.dataSources.length }} 个数据源：
            {{ componentRequirements.dataSources.map(ds => ds.name).join('、') }}
          </n-text>
        </div>
      </n-card>
    </div>

    <!-- JSON数据输入区域 -->
    <div class="json-input-section">
      <n-card size="small" title="JSON数据输入" class="json-card">
        <n-tabs type="line" size="small">
          <!-- 数组数据源 -->
          <n-tab-pane name="array" tab="数组数据源">
            <div class="json-input-panel">
              <n-input
                v-model:value="arrayJsonData"
                type="textarea"
                :rows="6"
                placeholder='请输入JSON数组数据，例如：
[
  {"name": "设备1", "value": 25.6, "status": "online"},
  {"name": "设备2", "value": 30.2, "status": "offline"}
]'
                @input="handleArrayDataChange"
              />
              <div class="input-actions">
                <n-space>
                  <n-button size="small" @click="formatArrayJson">格式化</n-button>
                  <n-button size="small" @click="loadArraySample">加载示例</n-button>
                  <n-tag v-if="arrayDataValid" type="success" size="small">✓ JSON有效</n-tag>
                  <n-tag v-else-if="arrayJsonData.trim()" type="error" size="small">✗ JSON无效</n-tag>
                </n-space>
              </div>
            </div>
          </n-tab-pane>

          <!-- 对象数据源 -->
          <n-tab-pane name="object" tab="对象数据源">
            <div class="json-input-panel">
              <n-input
                v-model:value="objectJsonData"
                type="textarea"
                :rows="6"
                placeholder='请输入JSON对象数据，例如：
{
  "user": {"name": "张三", "age": 25},
  "device": {"id": "dev001", "temp": 23.5},
  "location": {"city": "北京", "area": "朝阳区"}
}'
                @input="handleObjectDataChange"
              />
              <div class="input-actions">
                <n-space>
                  <n-button size="small" @click="formatObjectJson">格式化</n-button>
                  <n-button size="small" @click="loadObjectSample">加载示例</n-button>
                  <n-tag v-if="objectDataValid" type="success" size="small">✓ JSON有效</n-tag>
                  <n-tag v-else-if="objectJsonData.trim()" type="error" size="small">✗ JSON无效</n-tag>
                </n-space>
              </div>
            </div>
          </n-tab-pane>
        </n-tabs>
      </n-card>
    </div>

    <!-- 路径映射配置区域 -->
    <div class="path-mapping-section">
      <n-card size="small" title="路径映射配置" class="mapping-card">
        <div class="mapping-groups">
          <!-- 数组数据源映射 -->
          <div class="mapping-group">
            <h4 class="group-title">
              <n-icon size="14"><CodeWorkingOutline /></n-icon>
              数组数据源字段映射
            </h4>
            <div class="mapping-fields">
              <div class="mapping-item">
                <label class="field-label">字段1:</label>
                <n-input
                  v-model:value="pathMappings.arrayMappings.field1Path"
                  size="small"
                  placeholder="如: [0].name 或 0.name"
                  @input="handleMappingChange"
                />
                <div class="preview-value">
                  <n-tag size="small" :type="getPreviewType('array', 'field1')">
                    {{ getPreviewValue('array', 'field1') }}
                  </n-tag>
                </div>
              </div>

              <div class="mapping-item">
                <label class="field-label">字段2:</label>
                <n-input
                  v-model:value="pathMappings.arrayMappings.field2Path"
                  size="small"
                  placeholder="如: [0].value"
                  @input="handleMappingChange"
                />
                <div class="preview-value">
                  <n-tag size="small" :type="getPreviewType('array', 'field2')">
                    {{ getPreviewValue('array', 'field2') }}
                  </n-tag>
                </div>
              </div>

              <div class="mapping-item">
                <label class="field-label">字段3:</label>
                <n-input
                  v-model:value="pathMappings.arrayMappings.field3Path"
                  size="small"
                  placeholder="如: [1].status"
                  @input="handleMappingChange"
                />
                <div class="preview-value">
                  <n-tag size="small" :type="getPreviewType('array', 'field3')">
                    {{ getPreviewValue('array', 'field3') }}
                  </n-tag>
                </div>
              </div>
            </div>
          </div>

          <!-- 对象数据源映射 -->
          <div class="mapping-group">
            <h4 class="group-title">
              <n-icon size="14"><DocumentTextOutline /></n-icon>
              对象数据源字段映射
            </h4>
            <div class="mapping-fields">
              <div class="mapping-item">
                <label class="field-label">字段A:</label>
                <n-input
                  v-model:value="pathMappings.objectMappings.fieldAPath"
                  size="small"
                  placeholder="如: user.name"
                  @input="handleMappingChange"
                />
                <div class="preview-value">
                  <n-tag size="small" :type="getPreviewType('object', 'fieldA')">
                    {{ getPreviewValue('object', 'fieldA') }}
                  </n-tag>
                </div>
              </div>

              <div class="mapping-item">
                <label class="field-label">字段B:</label>
                <n-input
                  v-model:value="pathMappings.objectMappings.fieldBPath"
                  size="small"
                  placeholder="如: device.temp"
                  @input="handleMappingChange"
                />
                <div class="preview-value">
                  <n-tag size="small" :type="getPreviewType('object', 'fieldB')">
                    {{ getPreviewValue('object', 'fieldB') }}
                  </n-tag>
                </div>
              </div>

              <div class="mapping-item">
                <label class="field-label">字段C:</label>
                <n-input
                  v-model:value="pathMappings.objectMappings.fieldCPath"
                  size="small"
                  placeholder="如: location.city"
                  @input="handleMappingChange"
                />
                <div class="preview-value">
                  <n-tag size="small" :type="getPreviewType('object', 'fieldC')">
                    {{ getPreviewValue('object', 'fieldC') }}
                  </n-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </n-card>
    </div>

    <!-- 应用配置按钮 -->
    <div class="actions-section">
      <n-space>
        <n-button type="primary" :disabled="!canApplyConfig" :loading="applying" @click="applyConfiguration">
          <template #icon>
            <n-icon><CheckmarkOutline /></n-icon>
          </template>
          应用配置到组件
        </n-button>

        <n-button @click="resetConfiguration">
          <template #icon>
            <n-icon><RefreshOutline /></n-icon>
          </template>
          重置配置
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 简洁的数据映射配置表单
 * 专门为数据映射测试组件设计的简洁配置界面
 */

import { ref, computed, reactive, watch } from 'vue'
import { NCard, NInput, NButton, NSpace, NIcon, NText, NTag, NTabs, NTabPane, useMessage } from 'naive-ui'
import {
  ListOutline,
  CodeWorkingOutline,
  DocumentTextOutline,
  CheckmarkOutline,
  RefreshOutline
} from '@vicons/ionicons5'

interface Props {
  componentRequirements?: any
  selectedWidget?: any
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'config-update', config: any): void
  (e: 'preview-update', preview: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const message = useMessage()

// 响应式数据
const arrayJsonData = ref('')
const objectJsonData = ref('')
const applying = ref(false)

const pathMappings = reactive({
  arrayMappings: {
    field1Path: '',
    field2Path: '',
    field3Path: ''
  },
  objectMappings: {
    fieldAPath: '',
    fieldBPath: '',
    fieldCPath: ''
  }
})

// 解析后的JSON数据
const parsedArrayData = ref<any>(null)
const parsedObjectData = ref<any>(null)

// 计算属性
const arrayDataValid = computed(() => {
  if (!arrayJsonData.value.trim()) return false
  try {
    const parsed = JSON.parse(arrayJsonData.value)
    return Array.isArray(parsed)
  } catch {
    return false
  }
})

const objectDataValid = computed(() => {
  if (!objectJsonData.value.trim()) return false
  try {
    const parsed = JSON.parse(objectJsonData.value)
    return typeof parsed === 'object' && !Array.isArray(parsed)
  } catch {
    return false
  }
})

const canApplyConfig = computed(() => {
  return arrayDataValid.value && objectDataValid.value
})

// JSON路径解析函数
const getValueByPath = (obj: any, path: string): any => {
  if (!path || !obj) return null

  try {
    // 处理数组路径 [0].name -> 0.name
    let cleanPath = path.replace(/\[(\d+)\]/g, '$1')
    if (cleanPath.startsWith('.')) cleanPath = cleanPath.slice(1)

    const keys = cleanPath.split('.')
    let current = obj

    for (const key of keys) {
      if (key === '') continue
      if (current === null || current === undefined) return null

      // 如果是数字，尝试作为数组索引
      if (/^\d+$/.test(key)) {
        const index = parseInt(key)
        current = Array.isArray(current) ? current[index] : current[key]
      } else {
        current = current[key]
      }

      if (current === undefined) return null
    }

    return current
  } catch (error) {
    console.warn('路径解析失败:', path, error)
    return null
  }
}

// 预览值获取
const getPreviewValue = (dataType: 'array' | 'object', fieldKey: string): string => {
  let data, path

  if (dataType === 'array') {
    data = parsedArrayData.value
    path = pathMappings.arrayMappings[`${fieldKey}Path` as keyof typeof pathMappings.arrayMappings]
  } else {
    data = parsedObjectData.value
    path = pathMappings.objectMappings[`${fieldKey}Path` as keyof typeof pathMappings.objectMappings]
  }

  if (!data || !path) return '未配置'

  const value = getValueByPath(data, path)
  if (value === null || value === undefined) return '路径无效'

  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

const getPreviewType = (dataType: 'array' | 'object', fieldKey: string) => {
  const previewValue = getPreviewValue(dataType, fieldKey)
  if (previewValue === '未配置') return 'default'
  if (previewValue === '路径无效') return 'error'
  return 'success'
}

// 事件处理
const handleArrayDataChange = () => {
  if (arrayDataValid.value) {
    try {
      parsedArrayData.value = JSON.parse(arrayJsonData.value)
    } catch {
      parsedArrayData.value = null
    }
  } else {
    parsedArrayData.value = null
  }
}

const handleObjectDataChange = () => {
  if (objectDataValid.value) {
    try {
      parsedObjectData.value = JSON.parse(objectJsonData.value)
    } catch {
      parsedObjectData.value = null
    }
  } else {
    parsedObjectData.value = null
  }
}

const handleMappingChange = () => {
  // 实时更新预览
  emitPreviewUpdate()
}

const formatArrayJson = () => {
  if (arrayDataValid.value) {
    try {
      const parsed = JSON.parse(arrayJsonData.value)
      arrayJsonData.value = JSON.stringify(parsed, null, 2)
    } catch {
      message.error('JSON格式错误，无法格式化')
    }
  }
}

const formatObjectJson = () => {
  if (objectDataValid.value) {
    try {
      const parsed = JSON.parse(objectJsonData.value)
      objectJsonData.value = JSON.stringify(parsed, null, 2)
    } catch {
      message.error('JSON格式错误，无法格式化')
    }
  }
}

const loadArraySample = () => {
  arrayJsonData.value = JSON.stringify(
    [
      { name: '设备1', value: 25.6, status: 'online', id: 'dev001' },
      { name: '设备2', value: 30.2, status: 'offline', id: 'dev002' },
      { name: '设备3', value: 28.1, status: 'online', id: 'dev003' }
    ],
    null,
    2
  )
  handleArrayDataChange()
}

const loadObjectSample = () => {
  objectJsonData.value = JSON.stringify(
    {
      user: { name: '张三', age: 25, role: 'admin' },
      device: { id: 'dev001', temp: 23.5, humidity: 65 },
      location: { city: '北京', area: '朝阳区', building: 'A座' }
    },
    null,
    2
  )
  handleObjectDataChange()
}

const applyConfiguration = async () => {
  if (!canApplyConfig.value) return

  applying.value = true
  try {
    const config = {
      arrayDataSource: parsedArrayData.value,
      objectDataSource: parsedObjectData.value,
      arrayMappings: { ...pathMappings.arrayMappings },
      objectMappings: { ...pathMappings.objectMappings }
    }

    emit('config-update', config)
    message.success('配置已应用到组件')
  } catch (error) {
    message.error('应用配置失败')
  } finally {
    applying.value = false
  }
}

const resetConfiguration = () => {
  arrayJsonData.value = ''
  objectJsonData.value = ''
  Object.assign(pathMappings.arrayMappings, {
    field1Path: '',
    field2Path: '',
    field3Path: ''
  })
  Object.assign(pathMappings.objectMappings, {
    fieldAPath: '',
    fieldBPath: '',
    fieldCPath: ''
  })
  parsedArrayData.value = null
  parsedObjectData.value = null

  message.info('配置已重置')
}

const emitPreviewUpdate = () => {
  const preview = {
    arrayMappedValues: {
      field1: getPreviewValue('array', 'field1'),
      field2: getPreviewValue('array', 'field2'),
      field3: getPreviewValue('array', 'field3')
    },
    objectMappedValues: {
      fieldA: getPreviewValue('object', 'fieldA'),
      fieldB: getPreviewValue('object', 'fieldB'),
      fieldC: getPreviewValue('object', 'fieldC')
    }
  }

  emit('preview-update', preview)
}

// 监听外部数据变化，初始化表单
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && typeof newValue === 'object') {
      console.log('🔄 [SimpleDataMappingForm] 接收到外部数据:', newValue)

      // 恢复JSON数据
      if (newValue.arrayDataSource) {
        arrayJsonData.value = JSON.stringify(newValue.arrayDataSource, null, 2)
        parsedArrayData.value = newValue.arrayDataSource
      }

      if (newValue.objectDataSource) {
        objectJsonData.value = JSON.stringify(newValue.objectDataSource, null, 2)
        parsedObjectData.value = newValue.objectDataSource
      }

      // 恢复路径映射
      if (newValue.arrayMappings) {
        Object.assign(pathMappings.arrayMappings, newValue.arrayMappings)
      }

      if (newValue.objectMappings) {
        Object.assign(pathMappings.objectMappings, newValue.objectMappings)
      }

      console.log('✅ [SimpleDataMappingForm] 表单数据已恢复')
    }
  },
  { immediate: true, deep: true }
)

// 监听数据变化
watch([parsedArrayData, parsedObjectData, pathMappings], emitPreviewUpdate, { deep: true })
</script>

<style scoped>
.simple-data-mapping-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.requirements-card {
  border: 1px solid var(--border-color);
}

.requirements-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
}

.requirements-summary {
  font-size: 12px;
  color: var(--text-color-2);
}

.json-card,
.mapping-card {
  border: 1px solid var(--border-color);
}

.json-input-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mapping-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.mapping-group {
  padding: 12px;
  background: var(--hover-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
  margin: 0 0 12px 0;
}

.mapping-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mapping-item {
  display: grid;
  grid-template-columns: 60px 1fr 120px;
  gap: 8px;
  align-items: center;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color-2);
  text-align: right;
}

.preview-value {
  font-size: 11px;
}

.preview-value .n-tag {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions-section {
  padding-top: 8px;
  border-top: 1px solid var(--divider-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mapping-item {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .field-label {
    text-align: left;
  }

  .preview-value {
    justify-self: start;
  }
}
</style>
