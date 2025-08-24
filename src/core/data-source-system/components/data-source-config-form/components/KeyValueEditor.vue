<template>
  <div class="key-value-editor">
    <!-- 标题区域 -->
    <div v-if="showHeader" class="editor-header">
      <n-space align="center" justify="space-between">
        <n-text strong>{{ title || $t('keyValue.title') }}</n-text>
        <n-space :size="4">
          <n-button size="tiny" type="primary" :disabled="readonly" @click="addItem">
            <template #icon>
              <n-icon size="12">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2"></path>
                </svg>
              </n-icon>
            </template>
            {{ $t('common.add') }}
          </n-button>

          <n-button
            v-if="modelValue.length > 0"
            size="tiny"
            tertiary
            type="error"
            :disabled="readonly"
            @click="clearAll"
          >
            <template #icon>
              <n-icon size="12">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 7L18.1 5.5L12 11.6L5.9 5.5L5 7L11.1 13L5 19L5.9 20.5L12 14.4L18.1 20.5L19 19L12.9 13L19 7Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </n-icon>
            </template>
            {{ $t('common.clearAll') }}
          </n-button>
        </n-space>
      </n-space>
    </div>

    <!-- 键值对列表 -->
    <div class="key-value-list">
      <!-- 空状态提示 -->
      <div v-if="modelValue.length === 0" class="empty-state">
        <n-text depth="3" style="font-size: 12px">
          {{ emptyText || $t('keyValue.empty') }}
        </n-text>
      </div>

      <!-- 键值对项目 -->
      <div v-else class="key-value-items">
        <n-space vertical :size="4">
          <div
            v-for="(item, index) in modelValue"
            :key="index"
            class="key-value-item"
            :class="{ 'item-disabled': item.enabled === false }"
          >
            <n-grid :cols="gridCols" :x-gap="8" align="center">
              <!-- 启用/禁用开关 -->
              <n-grid-item v-if="showEnabledToggle" :span="1">
                <n-switch
                  :value="item.enabled !== false"
                  size="small"
                  :disabled="readonly"
                  @update:value="value => updateItemEnabled(index, value)"
                />
              </n-grid-item>

              <!-- 键输入框 -->
              <n-grid-item :span="keySpan">
                <n-input
                  :value="item.key"
                  :placeholder="keyPlaceholder || $t('keyValue.keyPlaceholder')"
                  size="small"
                  :disabled="readonly"
                  :status="hasKeyError(item, index) ? 'error' : undefined"
                  @update:value="value => updateItemKey(index, value)"
                />
              </n-grid-item>

              <!-- 值输入框 -->
              <n-grid-item :span="valueSpan">
                <n-input
                  :value="item.value"
                  :placeholder="valuePlaceholder || $t('keyValue.valuePlaceholder')"
                  size="small"
                  :disabled="readonly"
                  :type="multilineValue ? 'textarea' : 'text'"
                  :rows="multilineValue ? 2 : undefined"
                  @update:value="value => updateItemValue(index, value)"
                />
              </n-grid-item>

              <!-- 描述输入框（可选） -->
              <n-grid-item v-if="showDescription" :span="2">
                <n-input
                  :value="item.description || ''"
                  :placeholder="$t('keyValue.descriptionPlaceholder')"
                  size="small"
                  :disabled="readonly"
                  @update:value="value => updateItemDescription(index, value)"
                />
              </n-grid-item>

              <!-- 操作按钮 -->
              <n-grid-item :span="1">
                <n-space :size="2">
                  <n-button size="tiny" quaternary type="info" :disabled="readonly" @click="duplicateItem(index)">
                    <template #icon>
                      <n-icon size="10">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z"
                            fill="currentColor"
                          />
                        </svg>
                      </n-icon>
                    </template>
                  </n-button>

                  <n-button size="tiny" quaternary type="error" :disabled="readonly" @click="removeItem(index)">
                    <template #icon>
                      <n-icon size="10">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M19 7L18.1 5.5L12 11.6L5.9 5.5L5 7L11.1 13L5 19L5.9 20.5L12 14.4L18.1 20.5L19 19L12.9 13L19 7Z"
                            fill="currentColor"
                          ></path>
                        </svg>
                      </n-icon>
                    </template>
                  </n-button>
                </n-space>
              </n-grid-item>
            </n-grid>

            <!-- 键值错误提示 -->
            <div v-if="hasKeyError(item, index)" class="item-error">
              <n-text style="color: var(--error-color); font-size: 10px">
                {{ getKeyErrorMessage(item, index) }}
              </n-text>
            </div>
          </div>
        </n-space>
      </div>
    </div>

    <!-- 统计信息 -->
    <div v-if="showStats && modelValue.length > 0" class="editor-stats">
      <n-space :size="8" align="center">
        <n-text depth="3" style="font-size: 10px">{{ $t('keyValue.stats.total') }}: {{ modelValue.length }}</n-text>
        <n-text v-if="showEnabledToggle" depth="3" style="font-size: 10px">
          {{ $t('keyValue.stats.enabled') }}: {{ enabledCount }}
        </n-text>
        <n-text v-if="duplicateKeys.length > 0" style="color: var(--warning-color); font-size: 10px">
          {{ $t('keyValue.stats.duplicates') }}: {{ duplicateKeys.length }}
        </n-text>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 键值对编辑器组件
 * 支持动态添加、编辑、删除键值对
 * 适用于HTTP头部、URL参数、表单数据等场景
 */

import { computed } from 'vue'
import { NInput, NButton, NSpace, NIcon, NText, NGrid, NGridItem, NSwitch } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'

// 键值对项接口
export interface KeyValueItem {
  key: string
  value: string
  enabled?: boolean
  description?: string
}

// 组件Props接口
interface Props {
  /** v-model绑定的键值对数组 */
  modelValue: KeyValueItem[]
  /** 是否显示标题头 */
  showHeader?: boolean
  /** 标题文本 */
  title?: string
  /** 是否显示启用/禁用开关 */
  showEnabledToggle?: boolean
  /** 是否显示描述字段 */
  showDescription?: boolean
  /** 是否显示统计信息 */
  showStats?: boolean
  /** 键的占位符 */
  keyPlaceholder?: string
  /** 值的占位符 */
  valuePlaceholder?: string
  /** 空状态提示文本 */
  emptyText?: string
  /** 是否允许重复的键 */
  allowDuplicateKeys?: boolean
  /** 是否多行输入值 */
  multilineValue?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 最大项目数量 */
  maxItems?: number
}

// 组件Emits接口
interface Emits {
  /** v-model更新事件 */
  'update:modelValue': [value: KeyValueItem[]]
  /** 项目添加事件 */
  'item-added': [item: KeyValueItem, index: number]
  /** 项目更新事件 */
  'item-updated': [item: KeyValueItem, index: number]
  /** 项目删除事件 */
  'item-removed': [item: KeyValueItem, index: number]
  /** 项目复制事件 */
  'item-duplicated': [originalItem: KeyValueItem, newItem: KeyValueItem, newIndex: number]
  /** 清空所有事件 */
  cleared: []
  /** 验证事件 */
  validate: [errors: string[]]
}

// Props和Emits定义
const props = withDefaults(defineProps<Props>(), {
  showHeader: true,
  showEnabledToggle: false,
  showDescription: false,
  showStats: true,
  allowDuplicateKeys: false,
  multilineValue: false,
  readonly: false
})

const emit = defineEmits<Emits>()

// 国际化和主题
const { t } = useI18n()
const themeStore = useThemeStore()

// 计算网格列数和跨度
const gridCols = computed(() => {
  let cols = 6 // 基础：key(2) + value(3) + action(1)
  if (props.showEnabledToggle) cols += 1
  if (props.showDescription) cols += 2
  return cols
})

const keySpan = computed(() => (props.showDescription ? 2 : 2))
const valueSpan = computed(() => (props.showDescription ? 2 : 3))

// 启用项目数量统计
const enabledCount = computed(() => {
  return props.modelValue.filter(item => item.enabled !== false).length
})

// 重复键检测
const duplicateKeys = computed(() => {
  if (props.allowDuplicateKeys) return []

  const keyMap = new Map<string, number[]>()
  props.modelValue.forEach((item, index) => {
    if (item.key.trim()) {
      const key = item.key.toLowerCase().trim()
      if (!keyMap.has(key)) {
        keyMap.set(key, [])
      }
      keyMap.get(key)!.push(index)
    }
  })

  return Array.from(keyMap.entries())
    .filter(([_, indices]) => indices.length > 1)
    .map(([key]) => key)
})

/**
 * 检查键是否有错误
 */
const hasKeyError = (item: KeyValueItem, index: number): boolean => {
  if (!item.key.trim()) return false
  if (props.allowDuplicateKeys) return false

  const key = item.key.toLowerCase().trim()
  return duplicateKeys.value.includes(key)
}

/**
 * 获取键错误消息
 */
const getKeyErrorMessage = (item: KeyValueItem, index: number): string => {
  if (hasKeyError(item, index)) {
    return t('keyValue.validation.duplicateKey')
  }
  return ''
}

/**
 * 添加新项目
 */
const addItem = () => {
  if (props.readonly) return
  if (props.maxItems && props.modelValue.length >= props.maxItems) return

  const newItem: KeyValueItem = {
    key: '',
    value: '',
    enabled: true
  }

  const newList = [...props.modelValue, newItem]
  emit('update:modelValue', newList)
  emit('item-added', newItem, newList.length - 1)
}

/**
 * 更新项目的键
 */
const updateItemKey = (index: number, key: string) => {
  if (props.readonly) return

  const newList = [...props.modelValue]
  const oldItem = newList[index]
  newList[index] = { ...oldItem, key }

  emit('update:modelValue', newList)
  emit('item-updated', newList[index], index)
}

/**
 * 更新项目的值
 */
const updateItemValue = (index: number, value: string) => {
  if (props.readonly) return

  const newList = [...props.modelValue]
  const oldItem = newList[index]
  newList[index] = { ...oldItem, value }

  emit('update:modelValue', newList)
  emit('item-updated', newList[index], index)
}

/**
 * 更新项目的描述
 */
const updateItemDescription = (index: number, description: string) => {
  if (props.readonly) return

  const newList = [...props.modelValue]
  const oldItem = newList[index]
  newList[index] = { ...oldItem, description }

  emit('update:modelValue', newList)
  emit('item-updated', newList[index], index)
}

/**
 * 更新项目的启用状态
 */
const updateItemEnabled = (index: number, enabled: boolean) => {
  if (props.readonly) return

  const newList = [...props.modelValue]
  const oldItem = newList[index]
  newList[index] = { ...oldItem, enabled }

  emit('update:modelValue', newList)
  emit('item-updated', newList[index], index)
}

/**
 * 删除项目
 */
const removeItem = (index: number) => {
  if (props.readonly) return

  const newList = [...props.modelValue]
  const removedItem = newList[index]
  newList.splice(index, 1)

  emit('update:modelValue', newList)
  emit('item-removed', removedItem, index)
}

/**
 * 复制项目
 */
const duplicateItem = (index: number) => {
  if (props.readonly) return
  if (props.maxItems && props.modelValue.length >= props.maxItems) return

  const originalItem = props.modelValue[index]
  const newItem: KeyValueItem = {
    ...originalItem,
    key: `${originalItem.key}_copy`,
    enabled: true
  }

  const newList = [...props.modelValue]
  newList.splice(index + 1, 0, newItem)

  emit('update:modelValue', newList)
  emit('item-duplicated', originalItem, newItem, index + 1)
}

/**
 * 清空所有项目
 */
const clearAll = () => {
  if (props.readonly) return

  emit('update:modelValue', [])
  emit('cleared')
}

/**
 * 验证所有项目
 */
const validateAll = (): string[] => {
  const errors: string[] = []

  props.modelValue.forEach((item, index) => {
    // 检查必填字段
    if (!item.key.trim()) {
      errors.push(t('keyValue.validation.emptyKey', { index: index + 1 }))
    }

    // 检查重复键
    if (!props.allowDuplicateKeys && hasKeyError(item, index)) {
      errors.push(t('keyValue.validation.duplicateKey', { key: item.key }))
    }
  })

  emit('validate', errors)
  return errors
}

/**
 * 从JSON字符串导入
 */
const importFromJson = (jsonString: string): { success: boolean; error?: string } => {
  try {
    const parsed = JSON.parse(jsonString)

    if (typeof parsed !== 'object' || parsed === null) {
      return { success: false, error: t('keyValue.import.invalidFormat') }
    }

    const items: KeyValueItem[] = Object.entries(parsed).map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
      enabled: true
    }))

    emit('update:modelValue', items)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : t('keyValue.import.parseError')
    }
  }
}

/**
 * 导出为JSON字符串
 */
const exportToJson = (onlyEnabled: boolean = false): string => {
  const items = onlyEnabled ? props.modelValue.filter(item => item.enabled !== false) : props.modelValue

  const obj = items.reduce(
    (acc, item) => {
      if (item.key.trim()) {
        acc[item.key] = item.value
      }
      return acc
    },
    {} as Record<string, string>
  )

  return JSON.stringify(obj, null, 2)
}

// 公开的方法供父组件调用
defineExpose({
  /** 添加项目 */
  addItem,
  /** 删除项目 */
  removeItem,
  /** 复制项目 */
  duplicateItem,
  /** 清空所有 */
  clearAll,
  /** 验证所有项目 */
  validateAll,
  /** 从JSON导入 */
  importFromJson,
  /** 导出为JSON */
  exportToJson,
  /** 获取启用的项目 */
  getEnabledItems: () => props.modelValue.filter(item => item.enabled !== false),
  /** 获取重复键列表 */
  getDuplicateKeys: () => duplicateKeys.value
})
</script>

<style scoped>
.key-value-editor {
  width: 100%;
}

.editor-header {
  margin-bottom: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--divider-color);
}

.key-value-list {
  min-height: 40px;
}

.empty-state {
  padding: 20px;
  text-align: center;
  background: var(--hover-color);
  border: 1px dashed var(--border-color);
  border-radius: 6px;
}

.key-value-items {
  max-height: 300px;
  overflow-y: auto;
  padding: 4px 0;
}

.key-value-item {
  padding: 6px 8px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.key-value-item:hover {
  border-color: var(--primary-color-hover);
  background: var(--hover-color);
}

.key-value-item.item-disabled {
  opacity: 0.6;
  background: var(--hover-color);
}

.item-error {
  margin-top: 4px;
  padding-left: 8px;
}

.editor-stats {
  margin-top: 8px;
  padding: 6px 8px;
  background: var(--hover-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

/* 自定义滚动条 */
.key-value-items::-webkit-scrollbar {
  width: 4px;
}

.key-value-items::-webkit-scrollbar-track {
  background: var(--hover-color);
  border-radius: 2px;
}

.key-value-items::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.key-value-items::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-3);
}

/* 主题适配 */
[data-theme='dark'] .key-value-item {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .key-value-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

[data-theme='light'] .key-value-item {
  background: rgba(0, 0, 0, 0.01);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme='light'] .key-value-item:hover {
  background: rgba(0, 0, 0, 0.02);
}

/* 无障碍设计 */
@media (prefers-reduced-motion: reduce) {
  .key-value-item {
    transition: none;
  }
}

@media (prefers-contrast: high) {
  .key-value-item {
    border-width: 2px;
  }
}
</style>
