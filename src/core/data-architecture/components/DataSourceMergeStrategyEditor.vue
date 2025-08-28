<script setup lang="ts">
/**
 * 数据源合并策略编辑器
 * 用于配置数据源内多个数据项的合并方式
 */

import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// 合并策略类型定义
interface MergeStrategy {
  type: 'object' | 'array' | 'script' | 'condition'
  script?: string
  description?: string
}

// Props 接口定义
interface Props {
  /** 数据源ID */
  dataSourceId: string
  /** 当前合并策略 */
  modelValue?: MergeStrategy
  /** 数据项数量（用于显示预期效果） */
  dataItemCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({ type: 'object' }),
  dataItemCount: 1
})

const emit = defineEmits<{
  'update:modelValue': [value: MergeStrategy]
}>()

// 国际化
const { t } = useI18n()

// 响应式数据
const currentStrategy = ref<MergeStrategy>({ ...props.modelValue })
const showCustomScript = ref(false)

// 预制合并策略选项
const mergeStrategyOptions = [
  {
    value: 'object',
    label: '对象浅合并',
    description: 'Object.assign({}, item1, item2, ...) - 将所有数据项的属性合并到一个对象中',
    example: '{ ...item1, ...item2, ...item3 }',
    icon: '🔗'
  },
  {
    value: 'array',
    label: '组成数组',
    description: '[item1, item2, item3] - 将所有数据项组成一个数组',
    example: '[data1, data2, data3]',
    icon: '📝'
  },
  {
    value: 'condition',
    label: '条件选择',
    description: '根据预设条件选择合适的数据项',
    example: '选择第一个可用 / 选择最大数据集',
    icon: '⚖️'
  },
  {
    value: 'script',
    label: '自定义脚本',
    description: '使用自定义JavaScript脚本处理合并逻辑',
    example: 'return items.filter(...).map(...)',
    icon: '⚙️'
  }
]

// 条件选择策略选项
const conditionStrategyOptions = [
  {
    value: 'first-available',
    label: '选择第一个可用',
    script: 'return items.find(item => item !== null && item !== undefined) || {}'
  },
  {
    value: 'largest-dataset',
    label: '选择最大数据集',
    script: `return items.reduce((largest, current) => {
  const currentSize = Array.isArray(current) ? current.length : Object.keys(current || {}).length
  const largestSize = Array.isArray(largest) ? largest.length : Object.keys(largest || {}).length
  return currentSize > largestSize ? current : largest
}, {})`
  },
  {
    value: 'merge-arrays',
    label: '数组展开合并',
    script: `return items.reduce((result, item) => {
  if (Array.isArray(item)) {
    return [...result, ...item]
  } else if (item) {
    return [...result, item]
  }
  return result
}, [])`
  }
]

// 计算属性
const isScriptStrategy = computed(() => currentStrategy.value.type === 'script' || showCustomScript.value)

const previewText = computed(() => {
  const count = props.dataItemCount
  if (count <= 1) {
    return '单个数据项，无需合并'
  }

  switch (currentStrategy.value.type) {
    case 'object':
      return `合并 ${count} 个数据项的属性到一个对象`
    case 'array':
      return `将 ${count} 个数据项组成数组`
    case 'condition':
      return `根据条件从 ${count} 个数据项中选择`
    case 'script':
      return `使用自定义脚本处理 ${count} 个数据项`
    default:
      return ''
  }
})

// 监听变化并通知父组件
watch(
  currentStrategy,
  newValue => {
    emit('update:modelValue', { ...newValue })
  },
  { deep: true }
)

// 选择预制合并策略
const selectMergeStrategy = (strategyType: string) => {
  currentStrategy.value.type = strategyType as any

  if (strategyType === 'script') {
    showCustomScript.value = true
    currentStrategy.value.script = currentStrategy.value.script || '// 自定义合并逻辑\nreturn items[0] || {}'
  } else {
    showCustomScript.value = false
    currentStrategy.value.script = undefined
  }
}

// 选择条件策略
const selectConditionStrategy = (option: any) => {
  currentStrategy.value.type = 'script'
  currentStrategy.value.script = option.script
  currentStrategy.value.description = option.label
}

// 预览合并效果
const previewMergeResult = () => {
  // 模拟数据项
  const mockItems = [
    { name: 'data1', value: 100 },
    { name: 'data2', value: 200 },
    { name: 'data3', value: 300 }
  ]

  try {
    switch (currentStrategy.value.type) {
      case 'object':
        return Object.assign({}, ...mockItems)
      case 'array':
        return mockItems
      case 'script':
        if (currentStrategy.value.script) {
          const func = new Function('items', currentStrategy.value.script)
          return func(mockItems)
        }
        break
    }
  } catch (error) {
    return `脚本执行错误: ${error.message}`
  }

  return mockItems[0]
}
</script>

<template>
  <div class="data-source-merge-strategy-editor">
    <!-- 标题和说明 -->
    <div class="strategy-header">
      <n-space align="center" justify="space-between">
        <div>
          <n-text strong>{{ dataSourceId }} 合并策略</n-text>
          <n-text depth="3" style="margin-left: 8px">
            {{ previewText }}
          </n-text>
        </div>
        <n-tag v-if="dataItemCount > 1" type="info" size="small">{{ dataItemCount }} 个数据项</n-tag>
      </n-space>
    </div>

    <!-- 合并策略选择 -->
    <n-card size="small" style="margin-top: 16px">
      <template #header>
        <n-space align="center">
          <span>⚙️</span>
          <span>合并策略选择</span>
        </n-space>
      </template>

      <n-space vertical size="large">
        <!-- 策略选项 -->
        <n-radio-group :value="currentStrategy.type" size="large" @update:value="selectMergeStrategy">
          <n-space vertical size="medium">
            <div
              v-for="option in mergeStrategyOptions"
              :key="option.value"
              class="strategy-option"
              :class="{ active: currentStrategy.type === option.value }"
            >
              <n-radio :value="option.value" size="large">
                <n-space align="center">
                  <span class="strategy-icon">{{ option.icon }}</span>
                  <div class="strategy-content">
                    <div class="strategy-title">{{ option.label }}</div>
                    <div class="strategy-description">{{ option.description }}</div>
                    <n-code class="strategy-example">{{ option.example }}</n-code>
                  </div>
                </n-space>
              </n-radio>
            </div>
          </n-space>
        </n-radio-group>

        <!-- 条件选择策略详细配置 -->
        <div v-if="currentStrategy.type === 'condition'" class="condition-strategies">
          <n-divider>条件选择详细配置</n-divider>
          <n-space vertical>
            <div v-for="option in conditionStrategyOptions" :key="option.value" class="condition-option">
              <n-button
                secondary
                type="primary"
                style="width: 100%; text-align: left"
                @click="selectConditionStrategy(option)"
              >
                <n-space justify="space-between" style="width: 100%">
                  <span>{{ option.label }}</span>
                  <span>→</span>
                </n-space>
              </n-button>
            </div>
          </n-space>
        </div>

        <!-- 自定义脚本编辑 -->
        <div v-if="isScriptStrategy" class="custom-script-section">
          <n-divider>自定义脚本编辑</n-divider>

          <n-space vertical>
            <n-alert type="info" :show-icon="false">
              <template #icon><span>💡</span></template>
              <div>
                <strong>脚本说明</strong>
                <ul style="margin: 8px 0; padding-left: 20px">
                  <li>
                    <code>items</code>
                    : 数据项数组，包含所有处理后的数据项
                  </li>
                  <li>
                    <code>return</code>
                    : 返回合并后的最终数据
                  </li>
                  <li>支持所有JavaScript语法和常用方法</li>
                </ul>
              </div>
            </n-alert>

            <n-input
              v-model:value="currentStrategy.script"
              type="textarea"
              placeholder="// 自定义合并逻辑&#10;// items 参数包含所有数据项&#10;return items[0] || {}"
              :rows="8"
              style="font-family: 'Consolas', 'Monaco', monospace"
            />

            <!-- 脚本预览 -->
            <n-card size="small" title="🔍 预览效果">
              <n-code
                :code="JSON.stringify(previewMergeResult(), null, 2)"
                language="json"
                style="max-height: 200px; overflow-y: auto"
              />
            </n-card>
          </n-space>
        </div>
      </n-space>
    </n-card>

    <!-- 操作按钮 -->
    <n-space justify="end" style="margin-top: 16px">
      <n-button @click="previewMergeResult">🔍 预览效果</n-button>
      <n-button type="primary" @click="$emit('update:modelValue', currentStrategy)">✅ 确认策略</n-button>
    </n-space>
  </div>
</template>

<style scoped>
.data-source-merge-strategy-editor {
  padding: 16px;
}

.strategy-header {
  padding: 12px 16px;
  background: var(--card-color);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.strategy-option {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  transition: all 0.3s ease;
  cursor: pointer;
}

.strategy-option:hover {
  border-color: var(--primary-color);
  background: var(--primary-color-hover);
}

.strategy-option.active {
  border-color: var(--primary-color);
  background: var(--primary-color-pressed);
}

.strategy-icon {
  font-size: 24px;
  margin-right: 12px;
}

.strategy-content {
  flex: 1;
}

.strategy-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-color);
}

.strategy-description {
  font-size: 13px;
  color: var(--text-color-2);
  margin-bottom: 8px;
  line-height: 1.4;
}

.strategy-example {
  font-size: 12px;
  background: var(--code-color);
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.condition-strategies {
  background: var(--body-color);
  padding: 16px;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.condition-option {
  margin-bottom: 8px;
}

.custom-script-section {
  background: var(--body-color);
  padding: 16px;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}
</style>
