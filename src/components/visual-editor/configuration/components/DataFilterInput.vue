<template>
  <div class="data-filter-input">
    <n-form-item>
      <template #label>
        <n-space size="small" align="center">
          <span>数据过滤路径</span>
          <n-tooltip>
            <template #trigger>
              <n-icon size="14" style="color: var(--text-color-3); cursor: help">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                  <path
                    d="m9,9a3,3 0 1,1 6,0c0,2 -3,3 -3,3"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="m12,17.02v.01"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </n-icon>
            </template>
            <div style="max-width: 250px; font-size: 12px">
              <div><strong>过滤路径语法：</strong></div>
              <div style="margin-top: 4px">
                •
                <code>$</code>
                或 空白：使用完整数据
                <br />
                •
                <code>$.data</code>
                ：提取 data 字段
                <br />
                •
                <code>$.data.list</code>
                ：提取 data.list 数组
                <br />
                •
                <code>$.users[0]</code>
                ：提取 users 数组第一项
                <br />
                •
                <code>$.result.items</code>
                ：提取嵌套对象
              </div>
            </div>
          </n-tooltip>
        </n-space>
      </template>
      <n-input
        :value="filterPath"
        placeholder="$ (使用完整数据) 或 $.data.list (过滤路径)"
        clearable
        @update:value="handlePathChange"
      >
        <template #prefix>
          <n-icon size="16" style="color: var(--text-color-3)">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3 6h18l-2 13H5L3 6z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M16 10a4 4 0 0 1-8 0"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </n-icon>
        </template>
      </n-input>
    </n-form-item>

    <!-- 简化状态提示 -->
    <div v-if="filterPath && !filterError" class="filter-status">
      <n-tag size="tiny" type="success">✓ 路径有效</n-tag>
    </div>

    <!-- 错误提示 -->
    <div v-if="filterError" class="filter-error">
      <n-alert type="warning" size="small" :show-icon="false">
        <template #header>
          <span style="font-size: 12px">⚠️ 路径错误</span>
        </template>
        <div style="font-size: 11px">{{ filterError }}</div>
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 通用数据过滤器组件
 * 支持 JSONPath 语法过滤复杂数据结构
 */

import { ref, watch, computed } from 'vue'
import { NFormItem, NInput, NIcon, NTooltip, NSpace, NTag, NAlert } from 'naive-ui'

interface Props {
  /** 原始数据，用于预览过滤结果 */
  sourceData?: any
  /** 当前的过滤路径 */
  modelValue?: string
  /** 是否禁用 */
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'filter-change', filteredData: any, isValid: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  sourceData: null,
  modelValue: '',
  disabled: false
})

const emit = defineEmits<Emits>()

// 响应式状态
const filterPath = ref(props.modelValue || '')
const filterError = ref('')

// 监听外部变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue !== filterPath.value) {
      filterPath.value = newValue || ''
    }
  }
)

/**
 * 应用数据过滤器
 * @param data 原始数据
 * @param path 过滤路径
 */
const applyDataFilter = (data: any, path: string): { result: any; error: string } => {
  // 如果路径为空或者是 $，返回完整数据
  if (!path || path === '$') {
    return { result: data, error: '' }
  }

  // 如果数据为空，返回 null
  if (data === null || data === undefined) {
    return { result: null, error: '' }
  }

  try {
    // 简单的 JSONPath 实现
    let current = data

    // 移除开头的 $ 符号
    const cleanPath = path.startsWith('$') ? path.substring(1) : path

    if (cleanPath === '') {
      return { result: current, error: '' }
    }

    // 按点分割路径，但要处理数组索引
    const parts = parseJsonPath(cleanPath)

    for (const part of parts) {
      if (current === null || current === undefined) {
        return { result: null, error: `路径 "${part}" 处数据为空` }
      }

      // 处理数组索引
      if (part.includes('[') && part.includes(']')) {
        const [field, indexPart] = part.split('[')
        const index = parseInt(indexPart.replace(']', ''), 10)

        if (field) {
          current = current[field]
          if (current === undefined) {
            return { result: null, error: `字段 "${field}" 不存在` }
          }
        }

        if (!Array.isArray(current)) {
          return { result: null, error: `${field || '数据'} 不是数组类型` }
        }

        if (index < 0 || index >= current.length) {
          return { result: null, error: `数组索引 ${index} 超出范围 (0-${current.length - 1})` }
        }

        current = current[index]
      } else {
        // 普通字段访问
        if (typeof current !== 'object' || current === null) {
          return { result: null, error: `无法在非对象类型上访问字段 "${part}"` }
        }

        if (!(part in current)) {
          return { result: null, error: `字段 "${part}" 不存在` }
        }

        current = current[part]
      }
    }

    return { result: current, error: '' }
  } catch (error) {
    return { result: null, error: `路径解析错误: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * 解析 JSONPath，处理嵌套结构
 */
const parseJsonPath = (path: string): string[] => {
  const parts: string[] = []
  let current = ''
  let inBracket = false

  for (let i = 0; i < path.length; i++) {
    const char = path[i]

    if (char === '[') {
      inBracket = true
      current += char
    } else if (char === ']') {
      inBracket = false
      current += char
    } else if (char === '.' && !inBracket) {
      if (current) {
        parts.push(current)
        current = ''
      }
    } else {
      current += char
    }
  }

  if (current) {
    parts.push(current)
  }

  return parts.filter(part => part !== '')
}

/**
 * 处理路径变化
 */
const handlePathChange = (value: string) => {
  filterPath.value = value
  emit('update:modelValue', value)

  // 应用过滤器并更新结果
  updateFilter()
}

/**
 * 更新过滤结果
 */
const updateFilter = () => {
  if (props.sourceData === null || props.sourceData === undefined) {
    filterError.value = ''
    emit('filter-change', null, true)
    return
  }

  const { result, error } = applyDataFilter(props.sourceData, filterPath.value)

  filterError.value = error

  const isValid = error === ''
  emit('filter-change', result, isValid)
}

// 监听原始数据变化，自动更新过滤结果
watch(() => props.sourceData, updateFilter, { immediate: true, deep: true })
watch(() => filterPath.value, updateFilter)
</script>

<style scoped>
.data-filter-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-status {
  margin-top: 4px;
}

.filter-error {
  margin-top: 8px;
}
</style>
