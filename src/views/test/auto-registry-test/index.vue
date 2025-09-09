<script setup lang="ts">
/**
 * Card2.1 自动注册系统测试页面
 * 用于验证组件自动发现和注册功能
 */

import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Card2Components,
  Card2ComponentMap,
  Card2ComponentTypes,
  ComponentStats,
  getAllComponents,
  debugComponents,
  validateComponents,
  reloadComponents
} from '@/card2.1/components'

const { t } = useI18n()

// 响应式数据
const loading = ref(false)
const components = ref<any[]>([])
const stats = ref<any>({})
const validation = ref<any>({ valid: true, issues: [] })

/**
 * 加载组件数据
 */
const loadComponentData = async () => {
  loading.value = true
  try {
    // 获取所有组件
    components.value = getAllComponents()

    // 获取统计信息
    stats.value = {
      total: ComponentStats.total,
      categories: ComponentStats.categories,
      byCategory: ComponentStats.byCategory,
      supportedDataSources: ComponentStats.supportedDataSources,
      versions: ComponentStats.versions
    }

    // 验证组件
    validation.value = validateComponents()

    console.log('Card2Components:', Card2Components)
    console.log('Card2ComponentMap:', Card2ComponentMap)
    console.log('Card2ComponentTypes:', Card2ComponentTypes)
  } catch (error) {
    console.error('加载组件数据失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 重新加载组件
 */
const handleReload = async () => {
  loading.value = true
  try {
    await reloadComponents()
    await loadComponentData()
    $message.success('重新加载完成')
  } catch (error) {
    console.error('重新加载失败:', error)
    $message.error('重新加载失败')
  } finally {
    loading.value = false
  }
}

/**
 * 调试组件信息
 */
const handleDebug = () => {
  debugComponents()
  $message.info('调试信息已输出到控制台')
}

onMounted(() => {
  loadComponentData()
})
</script>

<template>
  <div class="auto-registry-test">
    <n-page-header title="Card2.1 自动注册系统测试" subtitle="验证组件自动发现和注册功能">
      <template #extra>
        <n-space>
          <n-button type="primary" :loading="loading" @click="loadComponentData">
            <template #icon>
              <n-icon>
                <i-mdi-refresh />
              </n-icon>
            </template>
            刷新数据
          </n-button>
          <n-button type="info" :loading="loading" @click="handleReload">
            <template #icon>
              <n-icon>
                <i-mdi-reload />
              </n-icon>
            </template>
            重新加载组件
          </n-button>
          <n-button type="warning" @click="handleDebug">
            <template #icon>
              <n-icon>
                <i-mdi-bug />
              </n-icon>
            </template>
            调试信息
          </n-button>
        </n-space>
      </template>
    </n-page-header>

    <n-space vertical size="large" class="mt-4">
      <!-- 统计概览 -->
      <n-card title="📊 组件统计概览" hoverable>
        <n-spin :show="loading">
          <n-descriptions :column="2" bordered>
            <n-descriptions-item label="总组件数">
              <n-tag type="info" size="large">{{ stats.total || 0 }}</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="分类数量">
              <n-tag type="success" size="large">{{ stats.categories?.length || 0 }}</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="支持的数据源">
              <n-space>
                <n-tag v-for="source in stats.supportedDataSources" :key="source" size="small">
                  {{ source }}
                </n-tag>
              </n-space>
            </n-descriptions-item>
            <n-descriptions-item label="版本分布">
              <n-space>
                <n-tag v-for="version in stats.versions" :key="version" size="small" type="warning">
                  {{ version }}
                </n-tag>
              </n-space>
            </n-descriptions-item>
          </n-descriptions>
        </n-spin>
      </n-card>

      <!-- 验证结果 -->
      <n-card title="✅ 组件验证结果" hoverable>
        <n-alert
          :type="validation.valid ? 'success' : 'warning'"
          :title="validation.valid ? '所有组件验证通过' : '发现组件定义问题'"
        >
          <div v-if="!validation.valid">
            <n-ul>
              <n-li v-for="issue in validation.issues" :key="issue">
                {{ issue }}
              </n-li>
            </n-ul>
          </div>
          <div v-else>所有组件定义都符合规范，可以正常使用。</div>
        </n-alert>
      </n-card>

      <!-- 分类统计 -->
      <n-card title="📂 分类统计" hoverable>
        <n-spin :show="loading">
          <n-space v-if="stats.byCategory" vertical>
            <div v-for="(count, category) in stats.byCategory" :key="category" class="category-item">
              <n-space justify="space-between" align="center">
                <n-text strong>{{ category }}</n-text>
                <n-tag type="info">{{ count }} 个组件</n-tag>
              </n-space>
            </div>
          </n-space>
          <n-empty v-else description="暂无分类数据" />
        </n-spin>
      </n-card>

      <!-- 组件列表 -->
      <n-card title="🧩 组件详细列表" hoverable>
        <n-spin :show="loading">
          <n-data-table
            :columns="[
              { title: '类型', key: 'type', width: 180, ellipsis: { tooltip: true } },
              { title: '名称', key: 'name', width: 150, ellipsis: { tooltip: true } },
              { title: '分类', key: 'category', width: 120, ellipsis: { tooltip: true } },
              { title: '版本', key: 'version', width: 100, ellipsis: { tooltip: true } },
              { title: '数据源', key: 'supportedDataSources', ellipsis: { tooltip: true } },
              { title: '标签', key: 'tags', ellipsis: { tooltip: true } }
            ]"
            :data="
              components.map(c => ({
                type: c.type,
                name: c.name,
                category: c.category || '其他',
                version: c.version || '未指定',
                supportedDataSources: c.supportedDataSources?.join(', ') || '无',
                tags: c.tags?.join(', ') || '无'
              }))
            "
            :pagination="{ pageSize: 10 }"
            :bordered="false"
          />
        </n-spin>
      </n-card>

      <!-- 使用示例 -->
      <n-card title="💡 使用示例" hoverable>
        <n-space vertical>
          <n-code
            language="typescript"
            :code="`
// 获取所有组件
import { getAllComponents } from '@/card2.1/components'
const components = getAllComponents()

// 获取指定分类的组件  
import { getComponentsByCategory } from '@/card2.1/components'
const dataComponents = getComponentsByCategory('数据展示')

// 根据类型获取组件定义
import { getComponentDefinition } from '@/card2.1/components'
const definition = getComponentDefinition('simple-display')

// 调试所有组件信息
import { debugComponents } from '@/card2.1/components'
debugComponents()

// 验证组件定义
import { validateComponents } from '@/card2.1/components'
const validation = validateComponents()
`"
          />
        </n-space>
      </n-card>
    </n-space>
  </div>
</template>

<style scoped>
.auto-registry-test {
  padding: 24px;
}

.category-item {
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--card-color);
}

.category-item:hover {
  background: var(--hover-color);
}
</style>
