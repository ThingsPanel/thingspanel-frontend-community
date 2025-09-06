<!--
🚀 属性绑定可视化器
直观显示组件属性绑定关系和数据流向
-->
<template>
  <n-card class="property-binding-visualizer" :bordered="false">
    <template #header>
      <n-space align="center">
        <n-icon size="20">
          <flow-chart-icon />
        </n-icon>
        <span>{{ $t('propertyBinding.visualizer.title') }}</span>

        <n-tag v-if="totalBindings > 0" type="info" size="small">
          {{ totalBindings }} {{ $t('propertyBinding.visualizer.bindingsCount') }}
        </n-tag>
      </n-space>
    </template>

    <template #header-extra>
      <n-space>
        <n-button size="small" :type="showDetails ? 'primary' : 'default'" @click="showDetails = !showDetails">
          {{ showDetails ? $t('common.hideDetails') : $t('common.showDetails') }}
        </n-button>

        <n-button size="small" :loading="isRefreshing" @click="refreshBindings">
          {{ $t('common.refresh') }}
        </n-button>
      </n-space>
    </template>

    <!-- 绑定关系图 -->
    <div v-if="bindingGroups.length > 0" class="binding-visualization">
      <n-space vertical size="large">
        <!-- 按组件分组显示绑定关系 -->
        <div v-for="group in bindingGroups" :key="group.componentId" class="component-group">
          <!-- 组件头部 -->
          <n-card size="small" :bordered="true" class="component-header">
            <template #header>
              <n-space align="center">
                <n-avatar size="small" :style="{ backgroundColor: group.color }">
                  <n-icon>
                    <component-icon />
                  </n-icon>
                </n-avatar>

                <div>
                  <n-text strong>{{ group.componentName }}</n-text>
                  <n-text depth="3" style="display: block; font-size: 12px">
                    ID: {{ group.componentId.substring(0, 8) }}...
                  </n-text>
                </div>

                <n-tag size="small" :type="getComponentStatusType(group)">
                  {{ group.bindings.length }} {{ $t('propertyBinding.visualizer.properties') }}
                </n-tag>
              </n-space>
            </template>

            <!-- 属性绑定列表 -->
            <n-space vertical size="small">
              <div
                v-for="binding in group.bindings"
                :key="binding.path"
                class="property-binding"
                :class="{ 'binding-active': isBindingActive(binding) }"
              >
                <n-space justify="space-between" align="center">
                  <!-- 属性信息 -->
                  <n-space align="center">
                    <n-icon size="16" :color="getPropertyTypeColor(binding.property.type)">
                      <property-icon />
                    </n-icon>

                    <div>
                      <n-text>{{ binding.property.label }}</n-text>
                      <n-text depth="3" style="display: block; font-size: 11px">
                        {{ binding.property.name }} ({{ binding.property.type }})
                      </n-text>
                    </div>
                  </n-space>

                  <!-- 绑定状态 -->
                  <n-space align="center" size="small">
                    <n-tag size="tiny" :type="getBindingStatusType(binding)">
                      {{ getBindingStatusText(binding) }}
                    </n-tag>

                    <!-- 数据流向箭头 -->
                    <n-icon v-if="hasDataFlow(binding)" size="14" color="#18a058" class="flow-icon">
                      <arrow-forward-icon />
                    </n-icon>

                    <!-- 详细信息按钮 -->
                    <n-button v-if="showDetails" text size="tiny" @click="showBindingDetails(binding)">详情</n-button>
                  </n-space>
                </n-space>

                <!-- 详细信息展开区域 -->
                <n-collapse-transition :show="selectedBinding?.path === binding.path">
                  <div class="binding-details">
                    <n-descriptions :column="1" size="small">
                      <n-descriptions-item label="绑定路径">
                        <n-text code>{{ binding.path }}</n-text>
                      </n-descriptions-item>

                      <n-descriptions-item label="当前值">
                        <n-text code>
                          {{ formatValue(binding.currentValue) }}
                        </n-text>
                      </n-descriptions-item>

                      <n-descriptions-item v-if="binding.property.defaultValue !== undefined" label="默认值">
                        <n-text code>
                          {{ formatValue(binding.property.defaultValue) }}
                        </n-text>
                      </n-descriptions-item>

                      <n-descriptions-item v-if="binding.property.description" label="描述">
                        <n-text depth="3">{{ binding.property.description }}</n-text>
                      </n-descriptions-item>

                      <n-descriptions-item v-if="binding.lastUpdated" label="最后更新">
                        <n-text depth="3">{{ formatTimestamp(binding.lastUpdated) }}</n-text>
                      </n-descriptions-item>
                    </n-descriptions>

                    <!-- 枚举值显示 -->
                    <template v-if="binding.property.enum && binding.property.enum.length > 0">
                      <n-divider style="margin: 12px 0" />
                      <n-space size="small">
                        <n-text depth="2" style="font-size: 12px">可选值：</n-text>
                        <n-tag
                          v-for="option in binding.property.enum"
                          :key="option.value"
                          size="small"
                          :type="option.value === binding.currentValue ? 'primary' : 'default'"
                        >
                          {{ option.label }}
                        </n-tag>
                      </n-space>
                    </template>
                  </div>
                </n-collapse-transition>
              </div>
            </n-space>
          </n-card>
        </div>
      </n-space>
    </div>

    <!-- 空状态 -->
    <n-empty v-else :description="$t('propertyBinding.visualizer.noBindings')" size="large">
      <template #icon>
        <n-icon size="48" depth="3">
          <flow-chart-icon />
        </n-icon>
      </template>

      <template #extra>
        <n-text depth="3" style="font-size: 14px">
          {{ $t('propertyBinding.visualizer.noBindingsHint') }}
        </n-text>
      </template>
    </n-empty>
  </n-card>
</template>

<script setup lang="ts">
/**
 * 🚀 属性绑定可视化器组件
 * 可视化显示组件间的属性绑定关系
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NCard,
  NSpace,
  NIcon,
  NTag,
  NButton,
  NText,
  NAvatar,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  NEmpty,
  NCollapseTransition
} from 'naive-ui'
import {
  FlowchartOutline as FlowChartIcon,
  ConstructOutline as ComponentIcon,
  SettingsOutline as PropertyIcon,
  ArrowForwardOutline as ArrowForwardIcon
} from '@vicons/ionicons5'

import { propertyExposureRegistry, type ComponentPropertyTreeNode } from '@/card2.1/core/property-exposure'
import { PropertyPath } from '@/card2.1/core/property-path-manager'
import { performanceOptimizer } from '@/card2.1/core/performance-optimizer'
import { useEditorStore } from '@/components/visual-editor/store/editor'

const { t } = useI18n()
const editorStore = useEditorStore()

// 响应式数据
const showDetails = ref(false)
const isRefreshing = ref(false)
const selectedBinding = ref<PropertyBinding | null>(null)

// 绑定数据结构
interface PropertyBinding {
  path: string
  componentId: string
  componentName: string
  property: {
    name: string
    label: string
    type: string
    description?: string
    defaultValue?: any
    enum?: { label: string; value: any }[]
  }
  currentValue?: any
  lastUpdated?: number
  isActive: boolean
}

interface ComponentBindingGroup {
  componentId: string
  componentName: string
  componentType: string
  color: string
  bindings: PropertyBinding[]
}

const bindingData = ref<PropertyBinding[]>([])

// 计算属性
const totalBindings = computed(() => bindingData.value.length)

const bindingGroups = computed((): ComponentBindingGroup[] => {
  const groups = new Map<string, ComponentBindingGroup>()

  bindingData.value.forEach(binding => {
    if (!groups.has(binding.componentId)) {
      groups.set(binding.componentId, {
        componentId: binding.componentId,
        componentName: binding.componentName,
        componentType: getComponentTypeFromId(binding.componentId),
        color: generateComponentColor(binding.componentId),
        bindings: []
      })
    }

    groups.get(binding.componentId)!.bindings.push(binding)
  })

  return Array.from(groups.values()).sort((a, b) => b.bindings.length - a.bindings.length)
})

/**
 * 刷新绑定数据
 */
const refreshBindings = async (): Promise<void> => {
  isRefreshing.value = true

  try {
    const newBindings: PropertyBinding[] = []

    // 从编辑器获取组件实例
    const canvasNodes = editorStore.nodes || []

    for (const node of canvasNodes) {
      const componentType = node.type || node.widget_type
      const exposure = propertyExposureRegistry.getComponentExposure(componentType)

      if (exposure && exposure.listenableProperties) {
        for (const property of exposure.listenableProperties) {
          const bindingPath = PropertyPath.create(node.id, property.name)

          newBindings.push({
            path: bindingPath,
            componentId: node.id,
            componentName: `${exposure.componentName} (${node.id.substring(0, 8)})`,
            property: {
              name: property.name,
              label: property.label,
              type: property.type,
              description: property.description,
              defaultValue: property.defaultValue,
              enum: property.enum
            },
            currentValue: getCurrentPropertyValue(node.id, property.name),
            lastUpdated: Date.now(),
            isActive: isPropertyActivelyUsed(bindingPath)
          })
        }
      }
    }

    bindingData.value = newBindings

    // 记录性能
    performanceOptimizer.incrementCounter('propertyLookups')

    console.log('🎯 [PropertyBindingVisualizer] 绑定数据已刷新', {
      totalBindings: newBindings.length,
      components: bindingGroups.value.length
    })
  } catch (error) {
    console.error('🚨 [PropertyBindingVisualizer] 刷新绑定数据失败:', error)
  } finally {
    isRefreshing.value = false
  }
}

/**
 * 显示绑定详情
 */
const showBindingDetails = (binding: PropertyBinding): void => {
  selectedBinding.value = selectedBinding.value?.path === binding.path ? null : binding
}

/**
 * 获取组件状态类型
 */
const getComponentStatusType = (group: ComponentBindingGroup): 'info' | 'success' | 'warning' => {
  const activeBindings = group.bindings.filter(b => b.isActive).length
  const ratio = activeBindings / group.bindings.length

  if (ratio >= 0.7) return 'success'
  if (ratio >= 0.3) return 'info'
  return 'warning'
}

/**
 * 获取属性类型颜色
 */
const getPropertyTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    string: '#18a058',
    number: '#2080f0',
    boolean: '#f0a020',
    color: '#d03050',
    array: '#722ed1',
    object: '#fa541c',
    date: '#13c2c2'
  }
  return colorMap[type] || '#666666'
}

/**
 * 获取绑定状态类型
 */
const getBindingStatusType = (binding: PropertyBinding): 'success' | 'info' | 'default' => {
  if (binding.isActive) return 'success'
  if (binding.currentValue !== undefined) return 'info'
  return 'default'
}

/**
 * 获取绑定状态文本
 */
const getBindingStatusText = (binding: PropertyBinding): string => {
  if (binding.isActive) return t('propertyBinding.status.active')
  if (binding.currentValue !== undefined) return t('propertyBinding.status.bound')
  return t('propertyBinding.status.available')
}

/**
 * 检查是否有数据流
 */
const hasDataFlow = (binding: PropertyBinding): boolean => {
  return binding.isActive || binding.currentValue !== binding.property.defaultValue
}

/**
 * 检查绑定是否活跃
 */
const isBindingActive = (binding: PropertyBinding): boolean => {
  return binding.isActive
}

/**
 * 格式化值显示
 */
const formatValue = (value: any): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

/**
 * 格式化时间戳
 */
const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

/**
 * 生成组件颜色
 */
const generateComponentColor = (componentId: string): string => {
  const colors = ['#18a058', '#2080f0', '#f0a020', '#d03050', '#722ed1', '#fa541c', '#13c2c2', '#52c41a']

  let hash = 0
  for (let i = 0; i < componentId.length; i++) {
    hash = componentId.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

/**
 * 从ID获取组件类型
 */
const getComponentTypeFromId = (componentId: string): string => {
  // 尝试从编辑器获取组件类型
  const node = editorStore.nodes?.find(n => n.id === componentId)
  return node?.type || node?.widget_type || 'unknown'
}

/**
 * 获取当前属性值
 */
const getCurrentPropertyValue = (componentId: string, propertyName: string): any => {
  // 这里可以集成实际的属性值获取逻辑
  // 暂时返回模拟数据
  return undefined
}

/**
 * 检查属性是否被活跃使用
 */
const isPropertyActivelyUsed = (bindingPath: string): boolean => {
  // 这里可以集成实际的使用检测逻辑
  // 暂时返回随机结果用于演示
  return Math.random() > 0.6
}

// 定时刷新
let refreshTimer: NodeJS.Timeout | null = null

onMounted(() => {
  refreshBindings()

  // 每10秒自动刷新
  refreshTimer = setInterval(refreshBindings, 10000)

  console.log('🎯 [PropertyBindingVisualizer] 属性绑定可视化器已初始化')
})

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<style scoped>
.property-binding-visualizer {
  min-height: 300px;
}

.binding-visualization {
  margin-top: 16px;
}

.component-group {
  position: relative;
}

.component-header {
  margin-bottom: 16px;
}

.property-binding {
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.property-binding:hover {
  border-color: var(--primary-color-suppl);
  box-shadow: 0 2px 8px rgba(24, 160, 88, 0.1);
}

.binding-active {
  border-color: var(--success-color);
  background: var(--success-color-suppl);
}

.binding-details {
  margin-top: 12px;
  padding: 12px;
  background: var(--body-color);
  border-radius: 4px;
  border: 1px solid var(--divider-color);
}

.flow-icon {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .property-binding {
    padding: 6px 8px;
  }

  .binding-details {
    padding: 8px;
  }
}
</style>
