<template>
  <div class="auto-form-generator">
    <!-- TS配置生成的表单 -->
    <div v-if="tsConfig" class="ts-config-section">
      <n-form 
        ref="formRef"
        :model="formData" 
        label-placement="left" 
        label-width="auto" 
        size="small"
        @update:model="handleTSChange"
      >
        <!-- 分组显示 -->
        <template v-for="group in groupedFields" :key="group.name">
          <div v-if="groupedFields.length > 1" class="form-group">
            <h4 class="group-title">{{ group.label }}</h4>
          </div>
          
          <!-- 字段渲染 -->
          <template v-for="field in group.fields" :key="field.key">
            <!-- Vue组件字段 -->
            <div v-if="field.type === 'vue-component'" class="vue-component-field">
              <component
                :is="getVueComponent(field)"
                v-model="formData[field.key]"
                v-bind="field.props || {}"
                @update:model-value="handleFieldChange(field.key, $event)"
              />
            </div>
            
            <!-- 普通字段 -->
            <n-form-item 
              v-else
              :label="field.label"
              :path="field.key"
              :rule="getFieldRule(field)"
            >
              <!-- 字符串输入 -->
              <n-input
                v-if="field.type === 'string'"
                v-model:value="formData[field.key]"
                :placeholder="field.description"
                :disabled="readonly"
                @update:value="handleFieldChange(field.key, $event)"
              />
              
              <!-- 文本域 -->
              <n-input
                v-else-if="field.type === 'textarea'"
                v-model:value="formData[field.key]"
                type="textarea"
                :rows="3"
                :placeholder="field.description"
                :disabled="readonly"
                @update:value="handleFieldChange(field.key, $event)"
              />
              
              <!-- 数字输入 -->
              <n-input-number
                v-else-if="field.type === 'number'"
                v-model:value="formData[field.key]"
                :min="field.min"
                :max="field.max"
                :step="field.step || 1"
                :disabled="readonly"
                @update:value="handleFieldChange(field.key, $event)"
              />
              
              <!-- 滑块 -->
              <n-slider
                v-else-if="field.type === 'slider'"
                v-model:value="formData[field.key]"
                :min="field.min || 0"
                :max="field.max || 100"
                :step="field.step || 1"
                :disabled="readonly"
                @update:value="handleFieldChange(field.key, $event)"
              />
              
              <!-- 布尔开关 -->
              <n-switch
                v-else-if="field.type === 'boolean'"
                v-model:value="formData[field.key]"
                :disabled="readonly"
                @update:value="handleFieldChange(field.key, $event)"
              />
              
              <!-- 选择器 -->
              <n-select
                v-else-if="field.type === 'select'"
                v-model:value="formData[field.key]"
                :options="field.options || []"
                :disabled="readonly"
                @update:value="handleFieldChange(field.key, $event)"
              />
              
              <!-- 颜色选择器 -->
              <n-color-picker
                v-else-if="field.type === 'color'"
                v-model:value="formData[field.key]"
                :disabled="readonly"
                show-alpha
                @update:value="handleFieldChange(field.key, $event)"
              />
            </n-form-item>
          </template>
        </template>
      </n-form>
    </div>
    
    <!-- 纯Vue配置组件 -->
    <div v-if="mode === 'vue-only' && vueConfig" class="vue-config-section">
      <component
        :is="vueConfig"
        v-model="formData"
        :readonly="readonly"
        @update:model-value="handleVueChange"
      />
    </div>
    
    <!-- 混合模式：Vue组件补充 -->
    <div v-if="mode === 'hybrid' && vueConfig" class="hybrid-vue-section">
      <div class="section-divider">
        <n-divider>自定义配置</n-divider>
      </div>
      <component
        :is="vueConfig"
        v-model="vueFormData"
        :readonly="readonly"
        @update:model-value="handleVueChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSlider,
  NSwitch,
  NSelect,
  NColorPicker,
  NDivider,
  FormInst
} from 'naive-ui'
import type { Component } from 'vue'
import type { TSConfig, ConfigMode, ConfigValues } from './config-types'
import { FlexibleConfigManager } from './config-manager'

interface Props {
  // 配置定义
  tsConfig?: TSConfig
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
  mode: 'vue-only',
  modelValue: () => ({}),
  readonly: false
})

const emit = defineEmits<Emits>()

// 表单引用
const formRef = ref<FormInst>()

// 表单数据
const formData = reactive<ConfigValues>({})
const vueFormData = reactive<ConfigValues>({})

// 计算属性
const groupedFields = computed(() => {
  if (!props.tsConfig) return []
  return FlexibleConfigManager.getGroupedFields(props.tsConfig)
})

// 初始化表单数据
const initFormData = () => {
  // 清空现有数据
  Object.keys(formData).forEach(key => delete formData[key])
  Object.keys(vueFormData).forEach(key => delete vueFormData[key])
  
  // 设置默认值
  if (props.tsConfig) {
    const defaults = FlexibleConfigManager.getDefaultValues(props.tsConfig)
    Object.assign(formData, defaults)
  }
  
  // 设置外部传入的值
  if (props.modelValue) {
    Object.assign(formData, props.modelValue)
    Object.assign(vueFormData, props.modelValue)
  }
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    Object.assign(formData, newValue)
    Object.assign(vueFormData, newValue)
  }
}, { deep: true })

// 监听配置变化
watch([() => props.tsConfig, () => props.vueConfig], () => {
  initFormData()
}, { deep: true })

// 字段变化处理
const handleFieldChange = (key: string, value: any) => {
  if (props.readonly) return
  
  console.log('[AutoFormGenerator] 字段变化:', { key, value })
  emitChange()
}

// TS表单变化处理
const handleTSChange = () => {
  if (props.readonly) return
  emitChange()
}

// Vue组件变化处理
const handleVueChange = (newValue: ConfigValues) => {
  if (props.readonly) return
  
  Object.assign(vueFormData, newValue)
  emitChange()
}

// 发出变化事件
const emitChange = () => {
  const values = props.mode === 'hybrid' 
    ? FlexibleConfigManager.mergeValues(formData, vueFormData)
    : formData
  
  // 验证
  const validation = FlexibleConfigManager.validateValues(values, props.tsConfig)
  emit('validate', validation)
  
  if (validation.valid) {
    emit('update:modelValue', { ...values })
    emit('change', { ...values })
  }
}

// 获取Vue组件
const getVueComponent = (field: any): Component => {
  if (typeof field.component === 'string') {
    // 这里可以实现组件名称到实际组件的映射
    // 现在简单返回null，实际使用时需要组件注册机制
    return null as any
  }
  return field.component
}

// 获取字段验证规则
const getFieldRule = (field: any) => {
  const rules: any[] = []
  
  if (field.required) {
    rules.push({
      required: true,
      message: `${field.label} 是必填字段`,
      trigger: ['blur', 'input']
    })
  }
  
  return rules.length > 0 ? rules : undefined
}

// 初始化
onMounted(() => {
  initFormData()
})

// 暴露验证方法
const validate = async () => {
  if (formRef.value) {
    try {
      await formRef.value.validate()
      const validation = FlexibleConfigManager.validateValues(formData, props.tsConfig)
      return validation
    } catch (error) {
      return { valid: false, errors: ['表单验证失败'] }
    }
  }
  return { valid: true, errors: [] }
}

defineExpose({
  validate
})
</script>

<style scoped>
.auto-form-generator {
  width: 100%;
}

.form-group {
  margin: 16px 0 8px 0;
}

.group-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
  margin: 0 0 12px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-color);
}

.vue-component-field {
  margin-bottom: 16px;
}

.section-divider {
  margin: 20px 0 16px 0;
}

.hybrid-vue-section {
  border-top: 1px dashed var(--border-color);
  padding-top: 16px;
}
</style>