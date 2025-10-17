<script setup lang="ts">
/**
 * 模板信息展示区块 - 优化布局
 */

import { inject, computed } from 'vue'
import type { Ref } from 'vue'
import { NCard, NGrid, NGi, NTag, NSpace, NEmpty, NDivider } from 'naive-ui'
import { $t } from '@/locales'
import { getDemoServerUrl } from '@/utils/common/tool'
import SvgIcon from '@/components/custom/svg-icon.vue'

const templateData = inject<Ref<any>>('templateData')!

const demoUrl = getDemoServerUrl()

const getIconPath = computed(() => {
  if (!templateData.value || !templateData.value.path) return ''
  const relativePath = templateData.value.path.replace(/^\.\//, '')
  return `${demoUrl.replace('api/v1', '') + relativePath}`
})

const tags = computed(() => {
  if (!templateData.value || !templateData.value.label) return []
  return templateData.value.label.split(',').filter(Boolean)
})
</script>

<template>
  <div class="template-info-section">
    <div v-if="!templateData" class="empty-container">
      <NEmpty :description="$t('common.nodata')" />
    </div>

    <div v-else class="info-container">
      <!-- 顶部卡片：模板概览 -->
      <NCard :bordered="false" class="overview-card">
        <div class="overview-content">
          <!-- 左侧图标 -->
          <div class="icon-container">
            <img v-if="getIconPath" :src="getIconPath" alt="template icon" class="template-icon" />
            <SvgIcon v-else local-icon="default-template" :size="120" />
          </div>

          <!-- 右侧信息 -->
          <div class="info-content">
            <h2 class="template-title">{{ templateData.name || '--' }}</h2>
            <p class="template-description">{{ templateData.description || $t('device_template.noDescription') }}</p>

            <div class="meta-info">
              <div class="meta-item">
                <span class="label">{{ $t('device_template.version') }}:</span>
                <span class="value">{{ templateData.version || '--' }}</span>
              </div>
              <div class="meta-item">
                <span class="label">{{ $t('device_template.author') }}:</span>
                <span class="value">{{ templateData.author || '--' }}</span>
              </div>
              <div class="meta-item">
                <span class="label">{{ $t('common.creationTime') }}:</span>
                <span class="value">{{
                  templateData.created_at ? new Date(templateData.created_at).toLocaleString() : '--'
                }}</span>
              </div>
            </div>

            <div v-if="tags.length > 0" class="tags-section">
              <span class="tags-label">{{ $t('generate.labels') }}:</span>
              <NSpace :size="8">
                <NTag v-for="tag in tags" :key="tag" type="primary" size="small">
                  {{ tag }}
                </NTag>
              </NSpace>
            </div>
          </div>
        </div>
      </NCard>
    </div>
  </div>
</template>

<style scoped lang="scss">
.template-info-section {
  padding: 20px;
}

.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.info-container {
  max-width: 1200px;
  margin: 0 auto;
}

.overview-card {
  background: linear-gradient(135deg, var(--card-color) 0%, var(--card-color) 100%);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.overview-content {
  display: flex;
  gap: 32px;
  padding: 16px 0;
}

.icon-container {
  flex-shrink: 0;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden;
  background: var(--n-color-target);
  border: 2px solid var(--border-color);

  .template-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.template-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  line-height: 1.3;
}

.template-description {
  font-size: 14px;
  color: var(--text-color-3);
  line-height: 1.6;
  margin: 0;
}

.meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;

  .label {
    color: var(--text-color-3);
    font-weight: 500;
  }

  .value {
    color: var(--text-color);
  }
}

.tags-section {
  display: flex;
  align-items: center;
  gap: 12px;

  .tags-label {
    font-size: 13px;
    color: var(--text-color-3);
    font-weight: 500;
  }
}

@media (max-width: 768px) {
  .overview-content {
    flex-direction: column;
    align-items: center;
  }

  .icon-container {
    width: 100px;
    height: 100px;
  }

  .template-title {
    font-size: 20px;
    text-align: center;
  }

  .meta-info {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
