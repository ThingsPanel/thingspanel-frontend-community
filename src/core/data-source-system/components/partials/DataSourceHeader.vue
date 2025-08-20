<!--
  数据源头部组件
  显示数据源基本信息、统计数据和操作按钮
-->
<template>
  <div class="data-source-header">
    <n-space justify="space-between" align="center">
      <!-- 左侧：数据源信息 -->
      <n-space align="center" :size="12">
        <!-- 数据源名称和类型 -->
        <div class="source-info">
          <n-text strong style="font-size: 14px">
            {{ dataSource.name || dataSource.key }}
          </n-text>
          <n-text depth="2" style="font-size: 11px; margin-left: 8px">({{ getDataTypeText() }})</n-text>
        </div>

        <!-- 状态指示器 -->
        <n-tag :type="getStatusType()" size="small" round>
          {{ getStatusText() }}
        </n-tag>

        <!-- 统计信息 -->
        <n-space :size="6" style="margin-left: 8px">
          <n-tag v-if="stats.totalItems > 0" type="info" size="tiny">总计: {{ stats.totalItems }}</n-tag>
          <n-tag v-if="stats.activeItems > 0" type="success" size="tiny">活跃: {{ stats.activeItems }}</n-tag>
          <n-tag v-if="stats.jsonItems > 0" type="default" size="tiny">JSON: {{ stats.jsonItems }}</n-tag>
          <n-tag v-if="stats.httpItems > 0" type="warning" size="tiny">HTTP: {{ stats.httpItems }}</n-tag>
          <n-tag v-if="stats.websocketItems > 0" type="error" size="tiny">WS: {{ stats.websocketItems }}</n-tag>
        </n-space>
      </n-space>

      <!-- 右侧：操作按钮 -->
      <n-space :size="6" @click.stop>
        <!-- 示例数据提示 -->
        <n-tooltip placement="bottom" trigger="hover">
          <template #trigger>
            <n-button size="tiny" quaternary circle>
              <template #icon>
                <n-icon size="14">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                    <path
                      d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M12 17h.01"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </n-icon>
              </template>
            </n-button>
          </template>
          <div class="example-tooltip">
            <div class="tooltip-title">示例数据格式:</div>
            <n-code
              :code="getExampleDataCode()"
              language="json"
              style="font-size: 10px; max-height: 200px; overflow-y: auto"
              :show-line-numbers="false"
            />
          </div>
        </n-tooltip>

        <!-- 设置按钮 -->
        <n-tooltip content="数据源设置" placement="bottom">
          <n-button size="tiny" quaternary circle @click="handleSettings">
            <template #icon>
              <n-icon size="14">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" />
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" stroke-width="2" />
                </svg>
              </n-icon>
            </template>
          </n-button>
        </n-tooltip>

        <!-- 删除按钮 -->
        <n-popconfirm @positive-click="handleDelete">
          <template #trigger>
            <n-tooltip content="删除数据源" placement="bottom">
              <n-button size="tiny" quaternary circle type="error">
                <template #icon>
                  <n-icon size="14">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </n-icon>
                </template>
              </n-button>
            </n-tooltip>
          </template>
          确定要删除数据源 "{{ dataSource.name || dataSource.key }}" 吗？此操作不可撤销。
        </n-popconfirm>
      </n-space>
    </n-space>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据源头部组件
 * 显示数据源基本信息和操作按钮
 */

import { computed } from 'vue'
import { NSpace, NText, NTag, NButton, NIcon, NTooltip, NPopconfirm, NCode } from 'naive-ui'

// Props 定义
interface Props {
  dataSource: {
    key: string
    name: string
    type?: string
    description?: string
  }
  stats: {
    totalItems: number
    activeItems: number
    jsonItems: number
    httpItems: number
    websocketItems: number
  }
}

// Emits 定义
interface Emits {
  (e: 'create-data-source'): void
  (e: 'delete-data-source', key: string): void
  (e: 'settings', key: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ========== 计算属性 ==========

/**
 * 获取数据类型文本
 */
const getDataTypeText = () => {
  if (props.dataSource.type) {
    return props.dataSource.type.toUpperCase()
  }

  // 根据统计信息推断主要类型
  const { jsonItems, httpItems, websocketItems } = props.stats
  if (httpItems > jsonItems && httpItems > websocketItems) return 'HTTP'
  if (websocketItems > jsonItems && websocketItems > httpItems) return 'WebSocket'
  if (jsonItems > 0) return 'JSON'
  return '多数据源'
}

/**
 * 获取状态类型
 */
const getStatusType = () => {
  if (props.stats.totalItems === 0) return 'default'
  if (props.stats.activeItems > 0) return 'success'
  return 'warning'
}

/**
 * 获取状态文本
 */
const getStatusText = () => {
  if (props.stats.totalItems === 0) return '空'
  if (props.stats.activeItems > 0) return '运行中'
  return '已停止'
}

/**
 * 获取示例数据代码
 */
const getExampleDataCode = () => {
  const examples = {
    json: {
      name: '张三',
      age: 25,
      email: 'zhangsan@example.com',
      hobbies: ['reading', 'gaming']
    },
    http: {
      method: 'GET',
      url: '/api/users',
      headers: {
        'Content-Type': 'application/json'
      }
    },
    websocket: {
      url: 'ws://localhost:8080/ws',
      protocols: ['chat', 'json-rpc'],
      message: 'Hello WebSocket'
    }
  }

  // 根据主要数据类型返回示例
  const { jsonItems, httpItems, websocketItems } = props.stats

  if (httpItems > jsonItems && httpItems > websocketItems) {
    return JSON.stringify(examples.http, null, 2)
  }

  if (websocketItems > jsonItems && websocketItems > httpItems) {
    return JSON.stringify(examples.websocket, null, 2)
  }

  return JSON.stringify(examples.json, null, 2)
}

// ========== 事件处理器 ==========

/**
 * 处理设置
 */
function handleSettings(): void {
  emit('settings', props.dataSource.key)
  console.log('⚙️ [DataSourceHeader] 打开设置:', props.dataSource.key)
}

/**
 * 处理删除
 */
function handleDelete(): void {
  emit('delete-data-source', props.dataSource.key)
  console.log('🗑️ [DataSourceHeader] 删除数据源:', props.dataSource.key)
}
</script>

<style scoped>
/* 数据源头部样式 */
.data-source-header {
  width: 100%;
  user-select: none;
}

/* 数据源信息样式 */
.source-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

/* 示例提示样式 */
.example-tooltip {
  max-width: 300px;
  padding: 8px;
}

.tooltip-title {
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 11px;
  color: var(--text-color);
}

/* 标签组样式 */
.stats-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

/* 按钮组样式 */
.action-buttons {
  display: flex;
  gap: 4px;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-source-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .source-info {
    width: 100%;
  }

  .stats-tags {
    width: 100%;
    justify-content: flex-start;
  }

  .action-buttons {
    width: 100%;
    justify-content: flex-end;
  }
}

/* 悬停效果 */
.data-source-header:hover {
  background: var(--hover-color);
  border-radius: 4px;
}

/* 按钮悬停效果 */
.action-buttons :deep(.n-button) {
  transition: all 0.2s ease;
}

.action-buttons :deep(.n-button:hover) {
  transform: scale(1.1);
}

/* 明暗主题适配 */
[data-theme='dark'] .example-tooltip {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

[data-theme='light'] .example-tooltip {
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 性能优化 */
.data-source-header {
  contain: layout style;
}
</style>
