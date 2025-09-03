<template>
  <div class="auto-form-generator">
    <n-form
      ref="formRef"
      :model="localValue"
      :label-placement="labelPlacement"
      :label-width="labelWidth"
      :disabled="disabled"
    >
      <!-- 按组分组显示设置项 -->
      <div v-for="groupName in groupNames" :key="groupName" class="form-group">
        <!-- 组标题 -->
        <div v-if="groupName !== 'default'" class="form-group-title">
          {{ groupName }}
        </div>

        <!-- 组内的表单项 -->
        <n-form-item
          v-for="setting in getSettingsByGroup(groupName)"
          :key="setting.path"
          :label="setting.label"
          :path="setting.path"
          :rule="getValidationRules(setting)"
        >
          <!-- 输入框 -->
          <n-input
            v-if="setting.controlType === 'INPUT' || setting.controlType === 'input'"
            :value="getNestedValue(localValue, setting.path)"
            :placeholder="setting.options?.placeholder"
            :disabled="setting.options?.disabled"
            :clearable="setting.options?.clearable ?? true"
            @update:value="val => updateNestedValue(setting.path, val)"
          />

          <!-- 文本域 -->
          <n-input
            v-else-if="setting.controlType === 'TEXTAREA' || setting.controlType === 'textarea'"
            type="textarea"
            :value="getNestedValue(localValue, setting.path)"
            :placeholder="setting.options?.placeholder"
            :rows="setting.options?.rows || 3"
            :disabled="setting.options?.disabled"
            :clearable="setting.options?.clearable ?? true"
            @update:value="val => updateNestedValue(setting.path, val)"
          />

          <!-- 数字输入 -->
          <n-input-number
            v-else-if="setting.controlType === 'INPUT_NUMBER' || setting.controlType === 'input-number'"
            :value="getNestedValue(localValue, setting.path)"
            :min="setting.options?.min"
            :max="setting.options?.max"
            :step="setting.options?.step"
            :precision="setting.options?.precision"
            :disabled="setting.options?.disabled"
            @update:value="val => updateNestedValue(setting.path, val)"
          />

          <!-- 开关 -->
          <n-switch
            v-else-if="setting.controlType === 'SWITCH' || setting.controlType === 'switch'"
            :value="getNestedValue(localValue, setting.path)"
            :disabled="setting.options?.disabled"
            @update:value="val => updateNestedValue(setting.path, val)"
          />

          <!-- 选择器 -->
          <n-select
            v-else-if="setting.controlType === 'SELECT' || setting.controlType === 'select'"
            :value="getNestedValue(localValue, setting.path)"
            :options="setting.options?.options || []"
            :placeholder="setting.options?.placeholder"
            :disabled="setting.options?.disabled"
            :clearable="setting.options?.clearable ?? true"
            :multiple="setting.options?.multiple"
            @update:value="val => updateNestedValue(setting.path, val)"
          />

          <!-- 颜色选择器 -->
          <n-color-picker
            v-else-if="setting.controlType === 'COLOR_PICKER' || setting.controlType === 'color-picker'"
            :value="getNestedValue(localValue, setting.path)"
            :disabled="setting.options?.disabled"
            :show-alpha="setting.options?.showAlpha"
            @update:value="val => updateNestedValue(setting.path, val)"
          />

          <!-- 滑块 -->
          <n-slider
            v-else-if="setting.controlType === 'SLIDER' || setting.controlType === 'slider'"
            :value="getNestedValue(localValue, setting.path)"
            :min="setting.options?.min || 0"
            :max="setting.options?.max || 100"
            :step="setting.options?.step || 1"
            :disabled="setting.options?.disabled"
            @update:value="val => updateNestedValue(setting.path, val)"
          />

          <!-- 日期选择器 -->
          <n-date-picker
            v-else-if="setting.controlType === 'DATE_PICKER' || setting.controlType === 'date-picker'"
            :value="getNestedValue(localValue, setting.path)"
            :type="setting.options?.type || 'date'"
            :placeholder="setting.options?.placeholder"
            :disabled="setting.options?.disabled"
            :clearable="setting.options?.clearable ?? true"
            @update:value="val => updateNestedValue(setting.path, val)"
          />

          <!-- 时间选择器 -->
          <n-time-picker
            v-else-if="setting.controlType === 'TIME_PICKER' || setting.controlType === 'time-picker'"
            :value="getNestedValue(localValue, setting.path)"
            :placeholder="setting.options?.placeholder"
            :disabled="setting.options?.disabled"
            :clearable="setting.options?.clearable ?? true"
            @update:value="val => updateNestedValue(setting.path, val)"
          />

          <!-- 评分 -->
          <n-rate
            v-else-if="setting.controlType === 'RATE' || setting.controlType === 'rate'"
            :value="getNestedValue(localValue, setting.path)"
            :count="setting.options?.count || 5"
            :disabled="setting.options?.disabled"
            :allow-half="setting.options?.allowHalf"
            @update:value="val => updateNestedValue(setting.path, val)"
          />

          <!-- 复选框组 -->
          <n-checkbox-group
            v-else-if="setting.controlType === 'CHECKBOX_GROUP' || setting.controlType === 'checkbox-group'"
            :value="getNestedValue(localValue, setting.path)"
            :disabled="setting.options?.disabled"
            @update:value="val => updateNestedValue(setting.path, val)"
          >
            <n-space>
              <n-checkbox
                v-for="option in setting.options?.options || []"
                :key="option.value"
                :value="option.value"
                :label="option.label"
              />
            </n-space>
          </n-checkbox-group>

          <!-- 单选框组 -->
          <n-radio-group
            v-else-if="setting.controlType === 'RADIO_GROUP' || setting.controlType === 'radio-group'"
            :value="getNestedValue(localValue, setting.path)"
            :disabled="setting.options?.disabled"
            @update:value="val => updateNestedValue(setting.path, val)"
          >
            <n-space>
              <n-radio v-for="option in setting.options?.options || []" :key="option.value" :value="option.value">
                {{ option.label }}
              </n-radio>
            </n-space>
          </n-radio-group>

          <!-- 未知控件类型提示 -->
          <n-text v-else type="warning">未支持的控件类型: {{ setting.controlType }}</n-text>
        </n-form-item>
      </div>
    </n-form>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
/**
 * 自动表单生成器
 * 根据 ComponentSettingConfig 自动生成配置表单
 */

import { computed, reactive, watch, nextTick, ref } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
  NSelect,
  NColorPicker,
  NSlider,
  NDatePicker,
  NTimePicker,
  NRate,
  NCheckboxGroup,
  NCheckbox,
  NRadioGroup,
  NRadio,
  NSpace,
  NText,
  type FormInst,
  type FormValidationError,
  type FormItemRule
} from 'naive-ui'
import type { ComponentSettingConfig, Setting } from '@/card2.1/types/setting-config'

// Props接口
interface Props<T extends Record<string, any> = Record<string, any>> {
  /** 设置配置 */
  settingConfig: ComponentSettingConfig<T>
  /** 当前值 */
  modelValue?: T
  /** 表单标签位置 */
  labelPlacement?: 'left' | 'top'
  /** 标签宽度 */
  labelWidth?: number | string
  /** 是否禁用 */
  disabled?: boolean
}

// Emits接口
interface Emits<T extends Record<string, any> = Record<string, any>> {
  (e: 'update:modelValue', value: T): void
}

const props = withDefaults(defineProps<Props<T>>(), {
  labelPlacement: 'left',
  labelWidth: 120,
  disabled: false
})

const emit = defineEmits<Emits<T>>()

// 表单引用
const formRef = ref<FormInst>()

// 本地值管理
const localValue = reactive<T>(
  (props.modelValue ? { ...props.modelValue } : { ...props.settingConfig.customConfig }) as T
)

// 防循环更新标志
let isUpdatingFromProps = false

/**
 * 获取设置项分组
 */
const settingGroups = computed(() => {
  const groups: Record<string, Setting[]> = {}

  for (const setting of props.settingConfig.settings) {
    const groupName = setting.options?.group || 'default'
    if (!groups[groupName]) {
      groups[groupName] = []
    }

    // 转换设置项，将 type 映射为 controlType，path 映射为 field
    const transformedSetting = {
      ...setting,
      controlType: setting.type, // 映射字段名
      path: setting.field, // 映射字段名
      label: setting.label,
      options: setting.options
    }

    groups[groupName].push(transformedSetting as Setting)
  }

  return groups
})

/**
 * 获取所有分组名称
 */
const groupNames = computed(() => {
  const names = Object.keys(settingGroups.value)
  // 将 'default' 组放在最前面，其他按字母顺序排序
  return names.sort((a, b) => {
    if (a === 'default') return -1
    if (b === 'default') return 1
    return a.localeCompare(b)
  })
})

/**
 * 根据分组获取设置项
 */
const getSettingsByGroup = (groupName: string): Setting[] => {
  return settingGroups.value[groupName] || []
}

/**
 * 获取嵌套对象的值
 */
const getNestedValue = <V = any,>(obj: Record<string, any>, path: string): V => {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? current[key] : undefined
  }, obj)
}

/**
 * 设置嵌套对象的值
 */
const setNestedValue = (obj: Record<string, any>, path: string, value: any) => {
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

/**
 * 更新嵌套值并触发事件
 */
const updateNestedValue = (path: string, value: any) => {
  if (isUpdatingFromProps) return

  console.log('🔄 [AutoFormGenerator] 更新值:', { path, value })

  setNestedValue(localValue, path, value)

  // 发送更新事件
  emit('update:modelValue', { ...localValue } as T)
}

/**
 * 获取表单验证规则
 */
const getValidationRules = (setting: Setting): FormItemRule[] => {
  const rules: FormItemRule[] = []

  // 必填验证
  if (setting.options?.required) {
    rules.push({
      required: true,
      message: `请${setting.controlType === 'SELECT' ? '选择' : '输入'}${setting.label}`,
      trigger: ['blur', 'change']
    })
  }

  // 长度验证
  if (setting.options?.minLength !== undefined || setting.options?.maxLength !== undefined) {
    rules.push({
      validator: (rule, value: string) => {
        if (!value && !setting.options?.required) return true

        const len = value?.length || 0
        const min = setting.options?.minLength
        const max = setting.options?.maxLength

        if (min !== undefined && len < min) {
          return new Error(`${setting.label}长度不能少于${min}个字符`)
        }
        if (max !== undefined && len > max) {
          return new Error(`${setting.label}长度不能超过${max}个字符`)
        }

        return true
      },
      trigger: ['blur', 'change']
    })
  }

  // 数值范围验证
  if (
    setting.controlType === 'INPUT_NUMBER' &&
    (setting.options?.min !== undefined || setting.options?.max !== undefined)
  ) {
    rules.push({
      validator: (rule, value: number) => {
        if (value == null && !setting.options?.required) return true

        const min = setting.options?.min
        const max = setting.options?.max

        if (min !== undefined && value < min) {
          return new Error(`${setting.label}不能小于${min}`)
        }
        if (max !== undefined && value > max) {
          return new Error(`${setting.label}不能大于${max}`)
        }

        return true
      },
      trigger: ['blur', 'change']
    })
  }

  return rules
}

/**
 * 表单验证
 */
const validate = async (): Promise<boolean> => {
  try {
    await formRef.value?.validate()
    return true
  } catch (validationErrors: any) {
    console.warn('🚨 [AutoFormGenerator] 表单验证失败:', validationErrors)
    return false
  }
}

/**
 * 重置表单
 */
const resetForm = () => {
  // 重置为默认配置
  Object.assign(localValue, props.settingConfig.customConfig)
  emit('update:modelValue', { ...localValue } as T)
}

/**
 * 监听props变化
 */
watch(
  () => props.modelValue,
  newValue => {
    if (isUpdatingFromProps || !newValue) return

    isUpdatingFromProps = true
    try {
      Object.assign(localValue, newValue)
      console.log('📥 [AutoFormGenerator] 同步props:', localValue)
    } finally {
      nextTick(() => {
        setTimeout(() => {
          isUpdatingFromProps = false
        }, 10)
      })
    }
  },
  { deep: true, immediate: true }
)

// 暴露方法给父组件
defineExpose({
  validate,
  resetForm,
  formRef
})
</script>

<style scoped>
.auto-form-generator {
  width: 100%;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

:deep(.n-form-item) {
  margin-bottom: 16px;
}

:deep(.n-form-item:last-child) {
  margin-bottom: 0;
}

:deep(.n-form-item-label) {
  font-weight: 500;
  color: var(--text-color-2);
}

/* 响应式设计 */
@media (max-width: 600px) {
  .auto-form-generator {
    padding: 0 8px;
  }

  .form-group-title {
    font-size: 13px;
  }

  :deep(.n-form-item) {
    margin-bottom: 12px;
  }
}
</style>
