<template>
  <div class="data-mapping-config">
    <div class="config-header">
      <span class="config-title">数据映射</span>
      <n-button
        size="small"
        type="primary"
        ghost
        @click="autoMapFields"
        :disabled="availableFields.length === 0"
      >
        自动映射
      </n-button>
    </div>
    
    <div v-if="localMappings && localMappings.length > 0" class="mapping-list">
      <div v-for="(mapping, index) in localMappings" :key="index" class="mapping-item">
        <div class="mapping-row">
          <span class="mapping-label">{{ mapping.target }}</span>
          <n-select
            v-model:value="mapping.key"
            :options="fieldOptions"
            placeholder="选择JSON路径"
            size="small"
            filterable
            clearable
            @update:value="updateMappings"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NSelect, NButton } from 'naive-ui'
import type { DataPathMapping } from '../../types/data-source'

interface Props {
  data: any // 数据源数据
  mappings: DataPathMapping[] // 现有映射配置
  componentFields?: ComponentField[] // 组件数据源定义
}

interface Emits {
  'update:mappings': [mappings: DataPathMapping[]]
}

interface ComponentField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  description: string
  defaultValue: any
}

interface DataField {
  path: string
  value: any
  type: string
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localMappings = ref<DataPathMapping[]>([])

// 计算属性
const availableFields = computed(() => {
  return extractFields(props.data)
})

const fieldOptions = computed(() => {
  return availableFields.value.map(field => ({
    label: `${field.path} (${field.type})`,
    value: field.path
  }))
})

// 方法
const extractFields = (obj: any, prefix = ''): DataField[] => {
  const fields: DataField[] = []
  
  if (obj === null || obj === undefined) {
    return fields
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const path = prefix ? `${prefix}[${index}]` : `[${index}]`
      if (typeof item === 'object' && item !== null) {
        fields.push(...extractFields(item, path))
      } else {
        fields.push({
          path,
          value: item,
          type: typeof item
        })
      }
    })
  } else if (typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      const path = prefix ? `${prefix}.${key}` : key
      const value = obj[key]
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        fields.push(...extractFields(value, path))
      } else {
        fields.push({
          path,
          value,
          type: Array.isArray(value) ? 'array' : typeof value
        })
      }
    })
  } else {
    fields.push({
      path: prefix || 'value',
      value: obj,
      type: typeof obj
    })
  }
  
  return fields
}

const autoMapFields = () => {
  // 智能映射逻辑：根据字段名称自动匹配
  localMappings.value.forEach(mapping => {
    if (!mapping.key) {
      const targetName = mapping.target.toLowerCase()
      const matchingField = availableFields.value.find(field => {
        const fieldName = field.path.split('.').pop()?.toLowerCase() || field.path.toLowerCase()
        return fieldName === targetName || 
               fieldName.includes(targetName) || 
               targetName.includes(fieldName)
      })
      
      if (matchingField) {
        mapping.key = matchingField.path
      }
    }
  })
  
  updateMappings()
}

const updateMappings = () => {
  emit('update:mappings', [...localMappings.value])
}

// 监听外部变化
watch(() => props.mappings, (newMappings) => {
  localMappings.value = [...(newMappings || [])]
}, { deep: true, immediate: true })
</script>

<style scoped>
.data-mapping-config {
  width: 100%;
  padding: 8px;
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.config-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.mapping-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mapping-item {
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  padding: 8px;
}

.mapping-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mapping-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  min-width: 60px;
  flex-shrink: 0;
}

.mapping-row .n-select {
  flex: 1;
}
</style>