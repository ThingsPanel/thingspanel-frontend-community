<script setup lang="ts">
/**
 * 发布信息展示区块
 * 展示 web_chart_config 和 app_chart_config JSON 配置
 */

import { inject, computed } from 'vue'
import type { Ref } from 'vue'
import { NCard, NEmpty, NGrid, NGi, NCode } from 'naive-ui'
import CodeMirror from 'vue-codemirror6'
import { javascript } from '@codemirror/lang-javascript'
import { $t } from '@/locales'
import { useThemeStore } from '@/store/modules/theme'

const templateData = inject<Ref<any>>('templateData')!
const themeStore = useThemeStore()

/**
 * 格式化 JSON 字符串
 */
const formatJson = (jsonStr: string | object | undefined): string => {
  if (!jsonStr) return '{}'

  try {
    const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
    return JSON.stringify(obj, null, 2)
  } catch (error) {
    console.error('Failed to parse JSON:', error)
    return typeof jsonStr === 'string' ? jsonStr : '{}'
  }
}

const webChartConfig = computed(() => formatJson(templateData.value?.web_chart_config))
const appChartConfig = computed(() => formatJson(templateData.value?.app_chart_config))
</script>

<template>
  <div class="publish-info-section">
    <div v-if="!templateData" class="empty-container">
      <NEmpty :description="$t('common.nodata')" />
    </div>

    <div v-else class="config-container">
      <NGrid :x-gap="20" :y-gap="20" :cols="1">
        <!-- Web 图表配置 -->
        <NGi>
          <NCard :bordered="false" :title="$t('device_template.webChartConfiguration')">
            <CodeMirror
              :model-value="webChartConfig"
              basic
              :dark="themeStore.darkMode"
              :lang="javascript()"
              :read-only="true"
              :style="{
                width: '100%',
                minHeight: '300px',
                maxHeight: '500px',
                border: '1px solid var(--n-border-color)',
                borderRadius: 'var(--n-border-radius)',
                overflow: 'auto'
              }"
            />
          </NCard>
        </NGi>

        <!-- App 图表配置 -->
        <NGi>
          <NCard :bordered="false" :title="$t('device_template.appChartConfiguration')">
            <CodeMirror
              :model-value="appChartConfig"
              basic
              :dark="themeStore.darkMode"
              :lang="javascript()"
              :read-only="true"
              :style="{
                width: '100%',
                minHeight: '300px',
                maxHeight: '500px',
                border: '1px solid var(--n-border-color)',
                borderRadius: 'var(--n-border-radius)',
                overflow: 'auto'
              }"
            />
          </NCard>
        </NGi>
      </NGrid>
    </div>
  </div>
</template>

<style scoped lang="scss">
.publish-info-section {
  padding: 20px;
}

.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.config-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
