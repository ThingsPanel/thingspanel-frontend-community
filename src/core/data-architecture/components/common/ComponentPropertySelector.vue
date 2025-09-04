<!--
  组件属性选择器
  用于在HttpConfigForm中选择已加入编辑器的组件属性进行绑定
-->
<template>
  <div class="component-property-selector">
    <!-- 搜索框 -->
    <div class="search-section">
      <n-input v-model:value="searchKeyword" placeholder="搜索组件或属性..." clearable size="small">
        <template #prefix>
          <n-icon><search-icon /></n-icon>
        </template>
      </n-input>
    </div>

    <!-- 组件属性树 -->
    <div class="tree-section">
      <n-tree
        v-if="filteredTreeData.length > 0"
        :data="filteredTreeData"
        key-field="key"
        label-field="label"
        children-field="children"
        selectable
        :selected-keys="selectedKeys"
        :expand-on-click="false"
        :default-expanded-keys="defaultExpandedKeys"
        @update:selected-keys="onSelectionChange"
        @update:expanded-keys="onExpandedKeysChange"
      >
        <template #prefix="{ option }">
          <n-icon>
            <component-icon v-if="option.type === 'component'" />
            <property-icon v-else />
          </n-icon>
        </template>

        <template #suffix="{ option }">
          <n-tag
            v-if="option.type === 'property'"
            size="small"
            :type="getPropertyTypeTagType(option.propertyConfig?.type)"
          >
            {{ option.propertyConfig?.type }}
          </n-tag>
        </template>
      </n-tree>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <n-empty :description="getEmptyStateDescription()" size="small">
          <template #icon>
            <n-icon><empty-icon /></n-icon>
          </template>
          <template #extra>
            <n-text depth="3" style="font-size: 12px">
              提示：请先在编辑器画布中添加组件，然后为组件配置可暴露的属性
            </n-text>
          </template>
        </n-empty>
      </div>
    </div>

    <!-- 选中属性信息 -->
    <div v-if="selectedProperty" class="selected-info">
      <n-card size="small" :bordered="true">
        <template #header>
          <span class="info-title">选中属性</span>
        </template>

        <n-descriptions :column="1" size="small">
          <n-descriptions-item label="组件">
            {{ selectedProperty.componentName }}
          </n-descriptions-item>
          <n-descriptions-item label="属性">
            {{ selectedProperty.propertyLabel }}
          </n-descriptions-item>
          <n-descriptions-item label="类型">
            <n-tag size="small" :type="getPropertyTypeTagType(selectedProperty.type)">
              {{ selectedProperty.type }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item v-if="selectedProperty.description" label="描述">
            <n-text depth="3" style="font-size: 12px">
              {{ selectedProperty.description }}
            </n-text>
          </n-descriptions-item>
        </n-descriptions>

        <!-- 绑定路径 -->
        <div class="binding-path">
          <n-alert type="success" size="small" :show-icon="false">
            <template #header>
              <n-icon style="margin-right: 4px"><link-icon /></n-icon>
              绑定路径
            </template>
            <n-text code>{{ selectedProperty.bindingPath }}</n-text>
          </n-alert>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ComponentPropertySelector - 组件属性选择器
 *
 * 功能：
 * 1. 显示编辑器中已注册组件的可绑定属性
 * 2. 支持搜索过滤
 * 3. 返回选中属性的绑定路径
 */

import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { NInput, NTree, NIcon, NTag, NCard, NDescriptions, NDescriptionsItem, NText, NAlert, NEmpty } from 'naive-ui'
import {
  SearchOutline as SearchIcon,
  ConstructOutline as ComponentIcon,
  SettingsOutline as PropertyIcon,
  LinkOutline as LinkIcon,
  FileTrayStackedOutline as EmptyIcon
} from '@vicons/ionicons5'

// 导入Card2.1相关功能
import { interactionManager } from '@/card2.1/core/interaction-manager'
import { propertyExposureRegistry } from '@/card2.1/core/property-exposure'
import type { ComponentPropertyTreeNode, ListenableProperty } from '@/card2.1/core/property-exposure'
// 导入Visual Editor状态管理 - 使用正确的editor store
import { useEditorStore } from '@/components/visual-editor/store/editor'

// Props接口
interface Props {
  modelValue?: string
  placeholder?: string
  allowClear?: boolean
}

// Emits接口
interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'update:selectedValue', value: string): void
  (e: 'change', value: string, propertyInfo?: SelectedPropertyInfo): void
}

interface SelectedPropertyInfo {
  bindingPath: string
  componentId: string
  componentName: string
  propertyName: string
  propertyLabel: string
  type: string
  description?: string
  defaultValue?: any
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择要绑定的组件属性',
  allowClear: true
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// Visual Editor Store - 获取画布组件实例（使用正确的editor store）
const editorStore = useEditorStore()

// 搜索关键词
const searchKeyword = ref('')

// 选中的key
const selectedKeys = ref<string[]>([])

// 展开的key
const expandedKeys = ref<string[]>([])

// 原始组件属性树数据
const rawTreeData = ref<ComponentPropertyTreeNode[]>([])

// 选中的属性信息
const selectedProperty = ref<SelectedPropertyInfo | null>(null)

/**
 * 获取组件属性树数据 - 基于画布组件实例
 */
const fetchTreeData = () => {
  // 获取画布中的组件实例
  const canvasNodes = editorStore.nodes

  if (!canvasNodes || canvasNodes.length === 0) {
    rawTreeData.value = []
    return
  }

  // 为每个组件实例生成属性树节点
  const treeData: ComponentPropertyTreeNode[] = canvasNodes
    .map(node => {
      // 根据组件类型获取属性暴露配置
      const componentType = node.type || node.widget_type
      const exposure = propertyExposureRegistry.getComponentExposure(componentType)

      if (!exposure || !exposure.listenableProperties || exposure.listenableProperties.length === 0) {
        return null
      }

      // 为每个属性生成子节点，使用实例ID作为前缀
      const properties: ComponentPropertyTreeNode[] = exposure.listenableProperties.map(prop => ({
        key: `${node.id}.${prop.name}`,
        label: `${prop.label} (${prop.type})`,
        type: 'property' as const,
        componentId: node.id, // 使用实例ID而不是组件类型
        propertyName: prop.name,
        propertyConfig: {
          ...prop,
          // 确保每个属性都有默认值
          defaultValue: prop.defaultValue !== undefined ? prop.defaultValue : getDefaultValueByType(prop.type)
        },
        isLeaf: true
      }))

      return {
        key: node.id,
        label: `${exposure.componentName} (ID: ${node.id.substring(0, 8)})`, // 显示组件名称和简化的实例ID
        type: 'component' as const,
        children: properties,
        isLeaf: false
      }
    })
    .filter(Boolean) as ComponentPropertyTreeNode[]

  rawTreeData.value = treeData
}

/**
 * 根据属性类型获取默认值
 */
const getDefaultValueByType = (type: string): any => {
  switch (type) {
    case 'string':
      return ''
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'array':
      return []
    case 'object':
      return {}
    case 'date':
      return null
    case 'color':
      return '#000000'
    case 'url':
      return ''
    default:
      return null
  }
}

/**
 * 过滤后的树数据（基于搜索关键词）
 */
const filteredTreeData = computed(() => {
  if (!searchKeyword.value.trim()) {
    return rawTreeData.value
  }

  const keyword = searchKeyword.value.toLowerCase().trim()

  return rawTreeData.value
    .map(componentNode => {
      // 检查组件名是否匹配
      const componentMatches = componentNode.label.toLowerCase().includes(keyword)

      // 过滤属性
      const filteredProperties =
        componentNode.children?.filter(
          propertyNode =>
            propertyNode.label.toLowerCase().includes(keyword) ||
            propertyNode.propertyConfig?.description?.toLowerCase().includes(keyword)
        ) || []

      // 如果组件名匹配或有匹配的属性，则显示该组件节点
      if (componentMatches || filteredProperties.length > 0) {
        return {
          ...componentNode,
          children: componentMatches ? componentNode.children : filteredProperties
        }
      }

      return null
    })
    .filter(Boolean) as ComponentPropertyTreeNode[]
})

/**
 * 默认展开的key（自动展开所有组件节点）
 */
const defaultExpandedKeys = computed(() => {
  return rawTreeData.value.map(node => node.key)
})

/**
 * 选择变化处理
 */
const onSelectionChange = (selectedKeysValue: string[]) => {
  selectedKeys.value = selectedKeysValue
  const selectedKey = selectedKeysValue[0]

  if (selectedKey && selectedKey.includes('.')) {
    // 解析选中的属性 - 现在selectedKey格式为：实例ID.属性名
    const parts = selectedKey.split('.')
    const componentInstanceId = parts[0] // 这是组件实例的唯一ID
    const propertyPath = parts.slice(1).join('.')

    // 查找对应的树节点
    const componentNode = rawTreeData.value.find(node => node.key === componentInstanceId)
    const propertyNode = componentNode?.children?.find(prop => prop.key === selectedKey)

    if (propertyNode && propertyNode.propertyConfig) {
      const propertyInfo: SelectedPropertyInfo = {
        bindingPath: selectedKey, // 格式：实例ID.属性名
        componentId: componentInstanceId, // 组件实例ID
        componentName: componentNode?.label || componentInstanceId,
        propertyName: propertyPath,
        propertyLabel: propertyNode.propertyConfig.label,
        type: propertyNode.propertyConfig.type,
        description: propertyNode.propertyConfig.description,
        defaultValue: propertyNode.propertyConfig.defaultValue
      }

      selectedProperty.value = propertyInfo

      // 发送事件
      emit('update:modelValue', selectedKey)
      emit('update:selectedValue', selectedKey)
      emit('change', selectedKey, propertyInfo)
    }
  } else {
    selectedProperty.value = null
    emit('update:modelValue', '')
    emit('update:selectedValue', '')
    emit('change', '')
  }
}

/**
 * 展开状态变化处理
 */
const onExpandedKeysChange = (keys: string[]) => {
  expandedKeys.value = keys
}

/**
 * 获取属性类型标签颜色
 */
const getPropertyTypeTagType = (type?: string) => {
  const typeMap: Record<string, string> = {
    string: 'default',
    number: 'primary',
    boolean: 'success',
    color: 'warning',
    date: 'info',
    object: 'error',
    array: 'error'
  }
  return typeMap[type || ''] || 'default'
}

/**
 * 监听modelValue变化，同步选中状态
 */
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && newValue !== selectedKeys.value[0]) {
      selectedKeys.value = [newValue]
      // 触发选择事件以更新selectedProperty
      onSelectionChange([newValue])
    } else if (!newValue) {
      selectedKeys.value = []
      selectedProperty.value = null
    }
  },
  { immediate: true }
)

/**
 * 获取空状态描述
 */
const getEmptyStateDescription = () => {
  const canvasNodes = editorStore.nodes
  if (!canvasNodes || canvasNodes.length === 0) {
    return '画布中暂无组件实例'
  }

  if (searchKeyword.value.trim()) {
    return `没有找到匹配 "${searchKeyword.value}" 的组件属性`
  }

  return '当前组件没有可绑定的属性'
}

/**
 * 组件挂载时获取数据
 */
onMounted(() => {
  console.log('🔍 [ComponentPropertySelector] 属性暴露注册表状态:', {
    registrations: Array.from((propertyExposureRegistry as any).registrations.keys())
  })

  fetchTreeData()

  // 定时检查 store 状态变化
  const checkInterval = setInterval(() => {
    const currentNodes = editorStore.nodes
    if (currentNodes && currentNodes.length > 0) {
      fetchTreeData()
      clearInterval(checkInterval)
    }
  }, 2000)

  // 10秒后清理定时器
  setTimeout(() => {
    clearInterval(checkInterval)
  }, 10000)
})
</script>

<style scoped>
.component-property-selector {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 400px;
}

.search-section {
  flex-shrink: 0;
}

.tree-section {
  flex: 1;
  min-height: 200px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 8px;
  background: var(--card-color);
  overflow-y: auto;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
}

.selected-info {
  flex-shrink: 0;
}

.info-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.binding-path {
  margin-top: 12px;
}

.binding-path :deep(.n-alert) {
  --n-padding: 8px 12px;
}

.binding-path :deep(.n-alert__header) {
  display: flex;
  align-items: center;
  font-weight: 500;
  margin-bottom: 4px;
}

/* 树形控件样式优化 */
.tree-section :deep(.n-tree-node) {
  margin-bottom: 2px;
}

.tree-section :deep(.n-tree-node-content) {
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.tree-section :deep(.n-tree-node-content:hover) {
  background: var(--action-color);
}

.tree-section :deep(.n-tree-node--selected .n-tree-node-content) {
  background: var(--primary-color-suppl);
  color: var(--primary-color);
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .component-property-selector {
    gap: 12px;
  }

  .tree-section {
    min-height: 150px;
  }
}
</style>
