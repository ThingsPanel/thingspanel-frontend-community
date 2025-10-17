<script setup lang="ts">
/**
 * 模板查看器主组件
 * 顶部：模板基本信息
 * 底部：Tab切换（遥测、属性、事件、命令、Web图表、App图表）
 */

import { ref, onMounted, provide, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NSpin, NTabs, NTabPane, NDivider, NModal, NCard } from 'naive-ui'
import { $t } from '@/locales'
import { getTemplat } from '@/service/api/system-data'
import TemplateOverviewSection from './template-overview-section.vue'
import TemplateEditForm from './template-edit-form.vue'
import TelemetryTabContent from './tab-telemetry.vue'
import AttributesTabContent from './tab-attributes.vue'
import EventsTabContent from './tab-events.vue'
import CommandsTabContent from './tab-commands.vue'
import WebChartTab from './tab-web-chart.vue'
import AppChartTab from './tab-app-chart.vue'

const router = useRouter()
const route = useRoute()

// 从路由参数获取模板ID
const templateId = computed(() => {
  const id = route.query.id
  return typeof id === 'string' ? id : ''
})

// 当前激活的tab
const activeTab = ref('telemetry')

// 加载状态
const loading = ref(false)

// 编辑弹窗
const showEditModal = ref(false)

// 模板数据
const templateData = ref<any>(null)

// 完整JSON数据（用于复制）
const fullTemplateJson = ref<string>('')

// 提供给子组件访问
provide('templateData', templateData)
provide('fullTemplateJson', fullTemplateJson)

/**
 * 加载模板数据
 */
const loadTemplateData = async () => {
  if (!templateId.value) {
    window.$message?.warning('模板ID不能为空')
    return
  }

  loading.value = true
  try {
    const res = await getTemplat(templateId.value)
    if (!res.error && res.data) {
      templateData.value = res.data

      // 生成完整JSON（和编辑器第5步一样的处理）
      const jsonData = { ...res.data }
      try {
        jsonData.app_chart_config = JSON.parse(jsonData.app_chart_config)
      } catch (e) {
        // 保持原样
      }
      try {
        jsonData.web_chart_config = JSON.parse(jsonData.web_chart_config)
      } catch (e) {
        // 保持原样
      }
      fullTemplateJson.value = JSON.stringify(jsonData, null, 2)
    } else {
      window.$message?.error($t('common.fetchDataFailed'))
    }
  } catch (error) {
    console.error('Failed to load template data:', error)
    window.$message?.error($t('common.fetchDataFailed'))
  } finally {
    loading.value = false
  }
}

/**
 * 打开编辑弹窗
 */
const handleEdit = () => {
  showEditModal.value = true
}

/**
 * 编辑成功回调
 */
const handleEditSuccess = () => {
  showEditModal.value = false
  loadTemplateData() // 重新加载数据
}

onMounted(() => {
  loadTemplateData()
})
</script>

<template>
  <div class="template-viewer">
    <!-- 内容区 -->
    <NCard>
      <NSpin :show="loading">
        <!-- 顶部：模板基本信息 -->
        <TemplateOverviewSection @edit="handleEdit" />

        <!-- 分隔线 -->
        <n-divider />

        <!-- 底部：Tab 切换 -->
        <NTabs v-model:value="activeTab" type="line" animated>
          <!-- 遥测 -->
          <NTabPane name="telemetry" :tab="$t('device_template.telemetry')">
            <TelemetryTabContent />
          </NTabPane>

          <!-- 属性 -->
          <NTabPane name="attributes" :tab="$t('device_template.attributes')">
            <AttributesTabContent />
          </NTabPane>

          <!-- 事件 -->
          <NTabPane name="events" :tab="$t('device_template.events')">
            <EventsTabContent />
          </NTabPane>

          <!-- 命令 -->
          <NTabPane name="commands" :tab="$t('device_template.commands')">
            <CommandsTabContent />
          </NTabPane>

          <!-- Web图表 -->
          <NTabPane name="web-chart" :tab="$t('device_template.webChartConfiguration')">
            <WebChartTab />
          </NTabPane>

          <!-- App图表 -->
          <NTabPane name="app-chart" :tab="$t('device_template.appChartConfiguration')">
            <AppChartTab />
          </NTabPane>
        </NTabs>
      </NSpin>
    </NCard>

    <!-- 编辑弹窗 -->
    <NModal v-model:show="showEditModal" :title="$t('device_template.editTemplateInfo')" preset="card" class="edit-modal">
      <TemplateEditForm :template-id="templateId" @success="handleEditSuccess" @cancel="showEditModal = false" />
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.template-viewer {
  height: 100%;
}

.edit-modal {
  width: 600px;
  max-width: 90vw;
}
</style>
