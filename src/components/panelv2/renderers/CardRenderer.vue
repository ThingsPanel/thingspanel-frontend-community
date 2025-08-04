<!--
  卡片渲染器
  根据cardId动态渲染对应的卡片组件
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { NAlert, NSpin } from 'naive-ui'
import type { BaseCanvasItem } from '../types/core'
import { usePanelStore } from '@/store/modules/panel'

// Props
interface Props {
  item: BaseCanvasItem
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

// Store
const panelStore = usePanelStore()

// 响应式状态
const loading = ref(false)
const error = ref<string | null>(null)
const cardComponent = ref<any>(null)

// 获取卡片定义
const cardDefine = computed(() => {
  const cardId = props.item.cardData.cardId
  return panelStore.cardMap.get(cardId)
})

// 卡片配置数据
const cardViewData = computed(() => {
  return {
    type: props.item.cardData.type || 'builtin',
    cardId: props.item.cardData.cardId,
    config: props.item.cardData.config || {},
    title: props.item.cardData.title,
    basicSettings: props.item.cardData.basicSettings || {
      showTitle: true,
      title: props.item.cardData.title
    },
    layout: {
      w: Math.ceil(props.item.size.width / 100), // 转换为网格单位
      h: Math.ceil(props.item.size.height / 100),
      minW: props.item.constraints?.minWidth ? Math.ceil(props.item.constraints.minWidth / 100) : 2,
      minH: props.item.constraints?.minHeight ? Math.ceil(props.item.constraints.minHeight / 100) : 2
    },
    dataSource: props.item.cardData.dataSource || {
      origin: 'system' as const,
      systemSource: [],
      deviceSource: [],
      isSupportTimeRange: false,
      dataTimeRange: 'last_1h',
      isSupportAggregate: false,
      dataAggregateRange: '1m'
    }
  }
})

// 加载卡片组件
const loadCardComponent = async () => {
  if (!cardDefine.value) {
    error.value = `未找到卡片定义: ${props.item.cardData.cardId}`
    return
  }

  try {
    loading.value = true
    error.value = null

    // 获取卡片组件
    cardComponent.value = cardDefine.value.component

    console.log('加载卡片组件:', {
      cardId: props.item.cardData.cardId,
      cardDefine: cardDefine.value,
      cardData: cardViewData.value
    })
  } catch (err) {
    error.value = `加载卡片组件失败: ${err instanceof Error ? err.message : '未知错误'}`
    console.error('Failed to load card component:', err)
  } finally {
    loading.value = false
  }
}

// 监听卡片ID变化
watch(
  () => props.item.cardData.cardId,
  () => {
    loadCardComponent()
  },
  { immediate: true }
)

// 生命周期
onMounted(() => {
  loadCardComponent()
})

onUnmounted(() => {
  cardComponent.value = null
})
</script>

<template>
  <div class="card-renderer h-full w-full">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center h-full">
      <NSpin size="small" />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="p-2 h-full">
      <NAlert type="error" size="small" :show-icon="false">
        <template #header>
          <div class="text-xs">卡片加载失败</div>
        </template>
        <div class="text-xs">{{ error }}</div>
      </NAlert>
    </div>

    <!-- 渲染实际卡片组件 -->
    <div v-else-if="cardComponent && cardDefine" class="h-full w-full">
      <component :is="cardComponent" :data="cardViewData" :readonly="readonly" class="h-full w-full" />
    </div>

    <!-- 占位符 -->
    <div v-else class="default-card-fallback p-3 h-full">
      <div class="text-sm font-medium text-gray-700">
        {{ item.cardData.title || '未知卡片' }}
      </div>
      <div class="text-xs text-gray-500 mt-1">卡片ID: {{ item.cardData.cardId }}</div>
      <div class="text-xs text-gray-400 mt-2">卡片组件未找到或加载失败</div>
    </div>
  </div>
</template>

<style scoped>
.card-renderer {
  position: relative;
  overflow: hidden;
}

.default-card-fallback {
  background: #f8f9fa;
  border: 1px dashed #dee2e6;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* 确保卡片组件填满容器 */
:deep(.n-card) {
  height: 100%;
}

:deep(.card-item) {
  height: 100%;
}
</style>
