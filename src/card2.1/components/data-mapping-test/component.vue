<template>
  <div class="data-mapping-test" :style="interactionStyles" :class="{ interacting: interactionState.isAnimating }">
    <!-- 组件标题 -->
    <div v-if="showTitle" class="component-title">
      <n-icon size="16" class="title-icon">
        <CodeWorkingOutline />
      </n-icon>
      <span class="title-text">{{ title || '数据映射测试' }}</span>
    </div>

    <!-- 数据展示区域 -->
    <div class="mapping-content">
      <!-- 数组数据源展示 -->
      <div class="data-source-section">
        <h4 class="section-title">
          <n-icon size="14"><ListOutline /></n-icon>
          数组数据源
        </h4>
        <div v-if="!hasArrayData" class="no-data">
          <n-empty size="small" description="未配置数组数据源">
            <template #icon>
              <n-icon><AlertCircleOutline /></n-icon>
            </template>
          </n-empty>
        </div>
        <div v-else class="mapped-fields">
          <div class="field-item">
            <span class="field-label">字段1:</span>
            <span class="field-value">{{ arrayField1 || '未映射' }}</span>
          </div>
          <div class="field-item">
            <span class="field-label">字段2:</span>
            <span class="field-value">{{ arrayField2 || '未映射' }}</span>
          </div>
          <div class="field-item">
            <span class="field-label">字段3:</span>
            <span class="field-value">{{ arrayField3 || '未映射' }}</span>
          </div>
        </div>
      </div>

      <!-- 对象数据源展示 -->
      <div class="data-source-section">
        <h4 class="section-title">
          <n-icon size="14"><DocumentOutline /></n-icon>
          对象数据源
        </h4>
        <div v-if="!hasObjectData" class="no-data">
          <n-empty size="small" description="未配置对象数据源">
            <template #icon>
              <n-icon><AlertCircleOutline /></n-icon>
            </template>
          </n-empty>
        </div>
        <div v-else class="mapped-fields">
          <div class="field-item">
            <span class="field-label">字段A:</span>
            <span class="field-value">{{ objectFieldA || '未映射' }}</span>
          </div>
          <div class="field-item">
            <span class="field-label">字段B:</span>
            <span class="field-value">{{ objectFieldB || '未映射' }}</span>
          </div>
          <div class="field-item">
            <span class="field-label">字段C:</span>
            <span class="field-value">{{ objectFieldC || '未映射' }}</span>
          </div>
        </div>
      </div>

      <!-- 调试信息 -->
      <div v-if="showDebugInfo" class="debug-section">
        <n-collapse>
          <n-collapse-item title="调试信息" name="debug">
            <div class="debug-content">
              <div class="debug-item">
                <strong>组件ID:</strong>
                {{ componentId }}
              </div>
              <div class="debug-item">
                <strong>交互状态:</strong>
                {{ interactionState.isAnimating ? '动画中' : '静止' }}
              </div>
              <pre>{{ debugInfo }}</pre>
            </div>
          </n-collapse-item>
        </n-collapse>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据映射测试组件
 * 用于测试和展示两个数据源（数组+对象）各自3个字段的映射结果
 */

import { computed, ref, onMounted } from 'vue'
import { NIcon, NEmpty, NCollapse, NCollapseItem } from 'naive-ui'
import { CodeWorkingOutline, ListOutline, DocumentOutline, AlertCircleOutline } from '@vicons/ionicons5'
import { useInteraction } from '../../hooks/use-interaction'

// 组件属性定义
interface Props {
  /** 是否显示标题 */
  showTitle?: boolean
  /** 组件标题 */
  title?: string
  /** 数组数据源 */
  arrayDataSource?: any[]
  /** 对象数据源 */
  objectDataSource?: Record<string, any>
  /** 数组字段映射路径 */
  arrayMappings?: {
    field1Path?: string
    field2Path?: string
    field3Path?: string
  }
  /** 对象字段映射路径 */
  objectMappings?: {
    fieldAPath?: string
    fieldBPath?: string
    fieldCPath?: string
  }
  /** 是否显示调试信息 */
  showDebugInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showTitle: true,
  title: '',
  arrayDataSource: () => [],
  objectDataSource: () => ({}),
  arrayMappings: () => ({}),
  objectMappings: () => ({}),
  showDebugInfo: false
})

// 生成唯一的组件ID
const componentId = `data-mapping-test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// 使用交互系统
const { interactionState, interactionStyles, createPresetConfig, updateConfigs } = useInteraction({
  componentId,
  configs: [
    // 预设一些交互配置
    {
      event: 'click',
      responses: [{ action: 'changeBackgroundColor', value: '#ff6b6b' }],
      priority: 1
    },
    {
      event: 'hover',
      responses: [{ action: 'changeOpacity', value: 0.8 }],
      priority: 1
    },
    {
      event: 'click',
      responses: [{ action: 'triggerAnimation', value: true, duration: 1000 }],
      priority: 1
    }
  ]
})

// 添加一些测试用的交互配置
const addTestInteractions = () => {
  const testConfigs = [
    {
      event: 'click' as const,
      responses: [{ action: 'changeTextColor' as const, value: '#ffffff' }],
      priority: 2
    },
    {
      event: 'click' as const,
      responses: [{ action: 'changeBorderColor' as const, value: '#4ecdc4' }],
      priority: 2
    }
  ]

  updateConfigs([
    ...testConfigs,
    createPresetConfig.clickChangeSize(400, 300, 3),
    createPresetConfig.hoverChangeOpacity(0.6, 2)
  ])

  console.log('🧪 已添加测试交互配置')
}

// 在组件挂载后添加测试配置
onMounted(() => {
  // 延迟添加，确保交互系统已初始化
  setTimeout(addTestInteractions, 1000)
})

// 计算属性
const hasArrayData = computed(() => {
  return Array.isArray(props.arrayDataSource) && props.arrayDataSource.length > 0
})

const hasObjectData = computed(() => {
  return props.objectDataSource && Object.keys(props.objectDataSource).length > 0
})

// JSON路径映射函数（与配置表单保持一致）
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
    console.warn('路径映射失败:', path, error)
    return null
  }
}

// 数组数据源字段映射
const arrayField1 = computed(() => {
  const path = props.arrayMappings?.field1Path
  return path ? getValueByPath(props.arrayDataSource, path) : null
})

const arrayField2 = computed(() => {
  const path = props.arrayMappings?.field2Path
  return path ? getValueByPath(props.arrayDataSource, path) : null
})

const arrayField3 = computed(() => {
  const path = props.arrayMappings?.field3Path
  return path ? getValueByPath(props.arrayDataSource, path) : null
})

// 对象数据源字段映射
const objectFieldA = computed(() => {
  const path = props.objectMappings?.fieldAPath
  return path ? getValueByPath(props.objectDataSource, path) : null
})

const objectFieldB = computed(() => {
  const path = props.objectMappings?.fieldBPath
  return path ? getValueByPath(props.objectDataSource, path) : null
})

const objectFieldC = computed(() => {
  const path = props.objectMappings?.fieldCPath
  return path ? getValueByPath(props.objectDataSource, path) : null
})

// 调试信息
const debugInfo = computed(() => {
  return JSON.stringify(
    {
      arrayDataSource: props.arrayDataSource,
      objectDataSource: props.objectDataSource,
      arrayMappings: props.arrayMappings,
      objectMappings: props.objectMappings,
      mappedValues: {
        array: {
          field1: arrayField1.value,
          field2: arrayField2.value,
          field3: arrayField3.value
        },
        object: {
          fieldA: objectFieldA.value,
          fieldB: objectFieldB.value,
          fieldC: objectFieldC.value
        }
      }
    },
    null,
    2
  )
})
</script>

<style scoped>
.data-mapping-test {
  padding: 16px;
  background: var(--card-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.component-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--divider-color);
}

.title-icon {
  color: var(--primary-color);
}

.title-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.mapping-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.data-source-section {
  padding: 12px;
  background: var(--hover-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
  margin: 0 0 12px 0;
}

.no-data {
  padding: 20px;
}

.mapped-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: var(--body-color);
  border-radius: 3px;
  font-size: 12px;
}

.field-label {
  font-weight: 500;
  color: var(--text-color-2);
}

.field-value {
  color: var(--text-color);
  font-family: monospace;
  background: var(--tag-color);
  padding: 2px 6px;
  border-radius: 2px;
}

.debug-section {
  margin-top: 16px;
}

.debug-content {
  background: var(--code-color);
  padding: 12px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.debug-item {
  margin-bottom: 8px;
  padding: 4px 8px;
  background: var(--body-color);
  border-radius: 3px;
  font-size: 12px;
}

.debug-content pre {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: var(--text-color);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .data-mapping-test {
    padding: 12px;
  }

  .field-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
