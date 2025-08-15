<template>
  <div class="field-mapping-demo">
    <n-card title="字段映射测试组件" size="small">
      <template #header-extra>
        <n-tag type="info" size="small">数据映射演示</n-tag>
      </template>

      <n-space vertical :size="16">
        <!-- 当前接收到的数据展示 -->
        <div class="data-display">
          <n-alert type="info" size="small" :show-icon="false">
            <template #header>
              <n-space align="center" :size="8">
                <span>当前接收数据</span>
                <n-tag :type="hasData ? 'success' : 'warning'" size="tiny">
                  {{ hasData ? '有数据' : '无数据' }}
                </n-tag>
              </n-space>
            </template>
            <div style="margin-top: 8px">
              <n-text depth="3" style="font-size: 12px">数据类型: {{ dataType }}</n-text>
              <br />
              <n-text depth="3" style="font-size: 12px">字段数量: {{ fieldCount }}</n-text>
              <br />
              <n-text depth="3" style="font-size: 12px">更新时间: {{ lastUpdateTime }}</n-text>
            </div>
          </n-alert>
        </div>

        <!-- 数据内容展示 -->
        <div v-if="hasData" class="data-content">
          <!-- 对象数据展示 -->
          <div v-if="!Array.isArray(mappedData)" class="object-data">
            <n-descriptions :column="2" size="small" bordered title="映射后的对象字段">
              <n-descriptions-item v-for="[key, value] in Object.entries(mappedData)" :key="key" :label="key">
                <n-tag size="small" :type="getValueType(value) === 'number' ? 'success' : 'default'">
                  {{ formatValue(value) }}
                </n-tag>
              </n-descriptions-item>
            </n-descriptions>
          </div>

          <!-- 数组数据展示 -->
          <div v-else class="array-data">
            <n-card title="映射后的数组数据" size="small">
              <template #header-extra>
                <n-tag size="small" type="info">{{ mappedData.length }} 项</n-tag>
              </template>

              <n-space vertical :size="8">
                <div v-for="(item, index) in mappedData.slice(0, 5)" :key="index" class="array-item">
                  <n-card size="tiny" embedded>
                    <template #header>
                      <n-text style="font-size: 12px">项目 {{ index + 1 }}</n-text>
                    </template>

                    <n-space size="small" wrap>
                      <n-tag
                        v-for="[key, value] in Object.entries(item)"
                        :key="key"
                        size="tiny"
                        :type="getValueType(value) === 'number' ? 'success' : 'default'"
                      >
                        {{ key }}: {{ formatValue(value) }}
                      </n-tag>
                    </n-space>
                  </n-card>
                </div>

                <div v-if="mappedData.length > 5" class="more-items">
                  <n-text depth="3" style="font-size: 12px">... 还有 {{ mappedData.length - 5 }} 项</n-text>
                </div>
              </n-space>
            </n-card>
          </div>
        </div>

        <!-- 无数据状态 -->
        <div v-else class="no-data">
          <n-empty size="small" description="等待数据输入">
            <template #icon>
              <n-icon>
                <DocumentTextOutline />
              </n-icon>
            </template>
            <template #extra>
              <n-text depth="3" style="font-size: 12px">请在数据源配置中输入JSON数据并配置字段映射</n-text>
            </template>
          </n-empty>
        </div>

        <!-- 原始数据展示（调试用） -->
        <div v-if="showDebugInfo && hasData" class="debug-info">
          <n-collapse size="small">
            <n-collapse-item title="调试信息" name="debug">
              <n-code
                :code="JSON.stringify(mappedData, null, 2)"
                language="json"
                :show-line-numbers="false"
                style="max-height: 200px; overflow-y: auto"
              />
            </n-collapse-item>
          </n-collapse>
        </div>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 字段映射测试组件
 * 用于演示和测试数据字段映射功能
 * 接收经过字段映射处理的数据并进行可视化展示
 */

import { ref, computed, watch } from 'vue'
import {
  NCard,
  NSpace,
  NAlert,
  NTag,
  NText,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NIcon,
  NCollapse,
  NCollapseItem,
  NCode
} from 'naive-ui'
import { DocumentTextOutline } from '@vicons/ionicons5'

// 组件 Props
interface Props {
  mappedData?: any // 经过字段映射后的数据
  showDebugInfo?: boolean // 是否显示调试信息
}

const props = withDefaults(defineProps<Props>(), {
  showDebugInfo: false
})

// 响应式状态
const lastUpdateTime = ref<string>('')

// 计算属性
const hasData = computed(() => {
  return props.mappedData !== undefined && props.mappedData !== null
})

const dataType = computed(() => {
  if (!hasData.value) return '无数据'

  if (Array.isArray(props.mappedData)) {
    return `数组 (${props.mappedData.length} 项)`
  } else if (typeof props.mappedData === 'object') {
    return '对象'
  } else {
    return typeof props.mappedData
  }
})

const fieldCount = computed(() => {
  if (!hasData.value) return 0

  if (Array.isArray(props.mappedData)) {
    return props.mappedData.length > 0 ? Object.keys(props.mappedData[0] || {}).length : 0
  } else if (typeof props.mappedData === 'object') {
    return Object.keys(props.mappedData).length
  } else {
    return 1
  }
})

// 获取值的类型
const getValueType = (value: any): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  return typeof value
}

// 格式化值显示
const formatValue = (value: any): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// 监听数据变化，更新时间戳
watch(
  () => props.mappedData,
  () => {
    lastUpdateTime.value = new Date().toLocaleTimeString()
  },
  { immediate: true, deep: true }
)
</script>

<style scoped>
.field-mapping-demo {
  width: 100%;
  height: 100%;
}

.data-display {
  width: 100%;
}

.data-content {
  width: 100%;
}

.object-data {
  width: 100%;
}

.array-data {
  width: 100%;
}

.array-item {
  width: 100%;
}

.array-item :deep(.n-card) {
  border: 1px solid var(--border-color);
}

.more-items {
  text-align: center;
  padding: 8px;
  background: var(--card-color);
  border-radius: 4px;
  border: 1px dashed var(--border-color);
}

.no-data {
  width: 100%;
  padding: 20px 0;
}

.debug-info {
  width: 100%;
  margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .object-data :deep(.n-descriptions) {
    /* 在小屏幕上单列显示 */
  }

  .array-item :deep(.n-space) {
    /* 在小屏幕上换行显示标签 */
  }
}
</style>
