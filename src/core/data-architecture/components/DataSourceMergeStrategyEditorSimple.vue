<script setup lang="ts">
/**
 * 数据源合并策略编辑器 - 简化版
 * 用于配置数据源内多个数据项的合并方式
 */

import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

// 合并策略类型定义
interface MergeStrategy {
  type: 'select' | 'array' | 'object' | 'script'
  script?: string
  selectedIndex?: number // 当type为'select'时，用户选择的数据项索引
}

// Props 接口定义
interface Props {
  /** 数据源ID */
  dataSourceId: string
  /** 当前合并策略 */
  modelValue?: MergeStrategy
  /** 数据项数量 */
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
// 🔥 全新方案：基于内容哈希的去重机制
const lastEmittedHash = ref('')
const isUpdatingFromProps = ref(false)

// 预制合并策略选项
const mergeStrategyOptions = [
  {
    value: 'select',
    label: '选择其中一个',
    description: '用户选择特定的数据项',
    icon: '🎯'
  },
  {
    value: 'object',
    label: '对象合并',
    description: 'Object.assign({}, item1, item2, ...)',
    icon: '🔗'
  },
  {
    value: 'array',
    label: '数组组成',
    description: '[item1, item2, item3]',
    icon: '📋'
  },
  {
    value: 'script',
    label: '自定义脚本',
    description: '完全自定义的合并逻辑',
    icon: '⚙️'
  }
]

// 计算属性
const previewText = computed(() => {
  const count = props.dataItemCount

  switch (currentStrategy.value.type) {
    case 'select':
      if (count <= 1) {
        return '返回唯一数据项'
      } else {
        const selectedIndex = currentStrategy.value.selectedIndex ?? 0
        return `选择第${selectedIndex + 1}项(共${count}项)`
      }
    case 'object':
      return count <= 1 ? '单项对象输出' : `对象合并(${count}项)`
    case 'array':
      return count <= 1 ? '单项数组输出' : `数组组成(${count}项)`
    case 'script':
      return count <= 1 ? '脚本处理单项' : `脚本处理(${count}项)`
    default:
      return ''
  }
})

// 🔥 全新方案：基于内容哈希的智能去重
watch(
  currentStrategy,
  newValue => {
    if (!isUpdatingFromProps.value) {
      // 计算内容哈希，避免相同内容的重复emit
      const contentHash = JSON.stringify(newValue)
      if (contentHash !== lastEmittedHash.value) {
        lastEmittedHash.value = contentHash
        emit('update:modelValue', { ...newValue })
      } else {
      }
    }
  },
  { deep: true }
)

// 🔥 全新方案：智能props同步，基于内容哈希判断
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      const newContentHash = JSON.stringify(newValue)
      const currentContentHash = JSON.stringify(currentStrategy.value)

      if (newContentHash !== currentContentHash) {
        isUpdatingFromProps.value = true
        currentStrategy.value = { ...newValue }
        lastEmittedHash.value = newContentHash // 更新哈希，防止回环

        // 在下一个tick清除标志
        nextTick(() => {
          isUpdatingFromProps.value = false
        })
      } else {
        console.log('⏭️ [DataSourceMergeStrategyEditor] props内容未变化，跳过同步')
      }
    }
  },
  { deep: true }
)

// 选择合并策略
const selectMergeStrategy = (strategyType: string) => {
  currentStrategy.value.type = strategyType as any

  if (strategyType === 'script') {
    currentStrategy.value.script =
      currentStrategy.value.script || '// items 为数据项数组，返回合并后的数据\nreturn items[0] || {}'
  }

  if (strategyType === 'select') {
    // 默认选择第1项（索引0）
    currentStrategy.value.selectedIndex = currentStrategy.value.selectedIndex ?? 0
  }
}
</script>

<template>
  <div class="data-source-merge-strategy-editor-simple">
    <!-- 紧凑的标题行 -->
    <div class="strategy-header">
      <n-space align="center" justify="space-between" size="small">
        <n-text strong style="font-size: 13px">{{ dataSourceId }} - 合并策略</n-text>
        <n-space align="center" size="small">
          <n-tag type="info" size="tiny">{{ dataItemCount }}项</n-tag>
          <n-text depth="3" style="font-size: 11px">{{ previewText }}</n-text>
        </n-space>
      </n-space>
    </div>

    <!-- 合并策略选择 -->
    <n-space align="center" justify="space-between" style="margin-top: 8px">
      <n-select
        :value="currentStrategy.type"
        size="small"
        style="flex: 1; max-width: 150px"
        :options="
          mergeStrategyOptions.map(opt => ({
            label: `${opt.icon} ${opt.label}`,
            value: opt.value
          }))
        "
        @update:value="selectMergeStrategy"
      />

      <!-- 选择数据项(当策略为select且有多项时) -->
      <n-select
        v-if="currentStrategy.type === 'select' && dataItemCount > 1"
        :value="currentStrategy.selectedIndex ?? 0"
        size="small"
        style="width: 100px"
        :options="
          Array.from({ length: dataItemCount }, (_, i) => ({
            label: `第${i + 1}项`,
            value: i
          }))
        "
        @update:value="
          val => {
            currentStrategy.selectedIndex = val
            console.log('📝 [DataSourceMergeStrategyEditor] 选择数据项:', val)
          }
        "
      />
    </n-space>

    <!-- 脚本编辑区域 -->
    <div v-if="currentStrategy.type === 'script'" style="margin-top: 8px">
      <n-input
        v-model:value="currentStrategy.script"
        type="textarea"
        placeholder="// items数组，返回合并结果&#10;return items[0] || {}"
        :rows="4"
        size="small"
        style="font-family: 'Consolas', monospace; font-size: 11px"
      />
    </div>
  </div>
</template>

<style scoped>
.data-source-merge-strategy-editor-simple {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 10px;
  background: var(--card-color);
}

.strategy-header {
  padding: 6px 8px;
  background: var(--body-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}
</style>
