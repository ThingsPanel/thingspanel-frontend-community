<template>
  <div class="auto-form-generator">
    <!-- 基于 TS 配置的表单生成 -->
    <div v-if="mode === 'ts-only' && tsConfig" class="ts-config-form">
      <n-space vertical>
        <!-- 分组显示 -->
        <div v-for="group in groupedFields" :key="group.name" class="form-group">
          <n-card v-if="group.label" size="small" class="group-card">
            <template #header>
              <span class="group-title">{{ group.label }}</span>
            </template>
            <n-space vertical :size="16">
              <div v-for="field in group.fields" :key="field.field" class="form-field">
                <FormField
                  :setting="field"
                  :model-value="getFieldValue(field.field)"
                  :readonly="readonly"
                  @update:model-value="updateFieldValue(field.field, $event)"
                />
              </div>
            </n-space>
          </n-card>
          <!-- 无分组的字段 -->
          <n-space v-else vertical :size="16">
            <div v-for="field in group.fields" :key="field.field" class="form-field">
              <FormField
                :setting="field"
                :model-value="getFieldValue(field.field)"
                :readonly="readonly"
                @update:model-value="updateFieldValue(field.field, $event)"
              />
            </div>
          </n-space>
        </div>
      </n-space>
    </div>

    <!-- 基于 Vue 组件的表单渲染 -->
    <div v-else-if="mode === 'vue-only' && vueConfig" class="vue-config-form">
      <component
        :is="vueConfig"
        v-model="formData"
        :readonly="readonly"
        @change="handleFormChange"
      />
    </div>

    <!-- 混合模式 -->
    <div v-else-if="mode === 'hybrid'" class="hybrid-config-form">
      <n-space vertical>
        <!-- Vue 组件部分 -->
        <n-card v-if="vueConfig" title="高级配置" size="small">
          <component
            :is="vueConfig"
            v-model="formData"
            :readonly="readonly"
            @change="handleFormChange"
          />
        </n-card>

        <!-- TS 配置部分 -->
        <n-card v-if="tsConfig" title="基础配置" size="small">
          <n-space vertical :size="16">
            <div v-for="field in tsConfig.fields" :key="field.field" class="form-field">
              <FormField
                :setting="field"
                :model-value="getFieldValue(field.field)"
                :readonly="readonly"
                @update:model-value="updateFieldValue(field.field, $event)"
              />
            </div>
          </n-space>
        </n-card>
      </n-space>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <n-empty description="暂无配置项" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AutoFormGenerator - 自动表单生成器
 * 根据 TS 配置或 Vue 组件配置自动生成配置表单
 * 支持多种模式：ts-only, vue-only, hybrid
 */

import { ref, computed, watch, onMounted } from 'vue'
import { NSpace, NCard, NEmpty } from 'naive-ui'
import type { Component } from 'vue'
import FormField from './FormField.vue'
import type { TSConfig, ConfigMode, ConfigValues, Setting, SettingGroup } from '@/card2.1/types/setting-config'

interface Props {
  // TS 配置
  tsConfig?: TSConfig
  // Vue 组件配置
  vueConfig?: Component
  // 配置模式
  mode?: ConfigMode
  // 当前值
  modelValue?: ConfigValues
  // 是否只读
  readonly?: boolean
}

interface Emits {
  (event: 'update:modelValue', value: ConfigValues): void
  (event: 'change', value: ConfigValues): void
  (event: 'validate', result: { valid: boolean; errors: string[] }): void
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'ts-only',
  modelValue: () => ({}),
  readonly: false
})

const emit = defineEmits<Emits>()

// 表单数据
const formData = ref<ConfigValues>({})

// 分组字段
const groupedFields = computed(() => {
  if (!props.tsConfig?.fields) return []

  const groups = props.tsConfig.groups || []
  const fields = props.tsConfig.fields

  // 如果没有定义分组，创建默认分组
  if (groups.length === 0) {
    return [{
      name: 'default',
      label: '',
      fields: fields
    }]
  }

  // 根据分组组织字段
  const result: Array<{ name: string; label: string; fields: Setting[] }> = []

  // 添加定义的分组
  groups.forEach(group => {
    const groupFields = fields.filter(field =>
      group.fields.includes(field.field)
    )
    if (groupFields.length > 0) {
      result.push({
        name: group.name,
        label: group.label,
        fields: groupFields
      })
    }
  })

  // 添加未分组的字段
  const groupedFieldNames = groups.flatMap(g => g.fields)
  const ungroupedFields = fields.filter(field =>
    !groupedFieldNames.includes(field.field)
  )

  if (ungroupedFields.length > 0) {
    result.push({
      name: 'ungrouped',
      label: '其他设置',
      fields: ungroupedFields
    })
  }

  return result
})

// 获取字段值
const getFieldValue = (fieldPath: string) => {
  return getNestedValue(formData.value, fieldPath)
}

// 更新字段值
const updateFieldValue = (fieldPath: string, value: unknown) => {
  setNestedValue(formData.value, fieldPath, value)
  emit('update:modelValue', { ...formData.value })
  emit('change', { ...formData.value })
}

// 处理表单变化
const handleFormChange = (newData: ConfigValues) => {
  formData.value = { ...formData.value, ...newData }
  emit('update:modelValue', formData.value)
  emit('change', formData.value)
}

// 获取嵌套属性值
const getNestedValue = (obj: any, path: string): unknown => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

// 设置嵌套属性值
const setNestedValue = (obj: any, path: string, value: unknown) => {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {}
    }
    return current[key]
  }, obj)
  target[lastKey] = value
}

// 表单验证
const validateForm = () => {
  const errors: string[] = []
  let valid = true

  if (props.tsConfig?.fields) {
    props.tsConfig.fields.forEach(field => {
      const value = getFieldValue(field.field)

      // 必填验证
      if (field.required && (value === undefined || value === null || value === '')) {
        valid = false
        errors.push(`${field.label}为必填项`)
      }

      // 最小值验证
      if (field.min !== undefined && typeof value === 'number' && value < field.min) {
        valid = false
        errors.push(`${field.label}不能小于${field.min}`)
      }

      // 最大值验证
      if (field.max !== undefined && typeof value === 'number' && value > field.max) {
        valid = false
        errors.push(`${field.label}不能大于${field.max}`)
      }
    })
  }

  const result = { valid, errors }
  emit('validate', result)
  return result
}

// 监听外部值变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      formData.value = { ...newValue }
    }
  },
  { immediate: true, deep: true }
)

// 组件挂载时初始化
onMounted(() => {
  if (props.modelValue) {
    formData.value = { ...props.modelValue }
  }
})

// 暴露验证方法
defineExpose({
  validate: validateForm
})
</script>

<style scoped>
.auto-form-generator {
  width: 100%;
}

.form-group {
  margin-bottom: 16px;
}

.group-card {
  margin-bottom: 16px;
}

.group-title {
  font-weight: 500;
  color: var(--text-color-1);
}

.form-field {
  width: 100%;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.ts-config-form,
.vue-config-form,
.hybrid-config-form {
  width: 100%;
}
</style>