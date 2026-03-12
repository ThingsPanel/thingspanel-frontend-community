<script setup lang="ts">
import { NCard, NButton, NSpace, NTag, NEllipsis } from 'naive-ui'
import { $t } from '@/locales'
import defaultCover from '@/assets/imgs/default_template_cover.png'

defineProps<{
  template: {
    id: string
    name: string
    brand?: string
    model?: string
    category?: string
    author_name?: string
    latest_version?: string
    description?: string
    cover_url?: string
    install_count?: number
  }
}>()

const emit = defineEmits(['install', 'view-detail'])
</script>

<template>
  <NCard hoverable class="market-card" :content-style="{ padding: '0' }">
    <!-- 封面 -->
    <div class="card-cover">
      <img v-if="template.cover_url" :src="template.cover_url" :alt="template.name" class="cover-img" />
      <img v-else :src="defaultCover" :alt="template.name" class="cover-img opacity-60" />
    </div>

    <div class="card-body">
      <!-- 类别标签 -->
      <NTag v-if="template.category" size="small" type="info" class="mb-1">{{ template.category }}</NTag>

      <!-- 名称 -->
      <div class="card-name">
        <NEllipsis :line-clamp="1">{{ template.name }}</NEllipsis>
      </div>

      <!-- 品牌 + 型号 -->
      <div v-if="template.brand || template.model" class="card-brand">
        <span v-if="template.brand">{{ template.brand }}</span>
        <span v-if="template.brand && template.model">|</span>
        <span v-if="template.model">{{ template.model }}</span>
      </div>

      <!-- 作者 + 版本 -->
      <div class="card-meta">
        <span v-if="template.author_name">{{ template.author_name }}</span>
        <span v-if="template.latest_version" class="version-badge">v{{ template.latest_version }}</span>
      </div>

      <!-- 安装次数 -->
      <div class="card-stats">📥 {{ template.install_count || 0 }} {{ $t('market.installCount') }}</div>

      <!-- 操作按钮 -->
      <NSpace class="card-actions" :size="8">
        <NButton size="small" @click="emit('view-detail', template.id)">{{ $t('market.viewDetail') }}</NButton>
        <NButton size="small" type="primary" @click="emit('install', template.id)">{{ $t('market.install') }}</NButton>
      </NSpace>
    </div>
  </NCard>
</template>

<style scoped lang="scss">
.market-card {
  overflow: hidden;
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}

.card-cover {
  height: 140px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  font-size: 48px;
}

.card-body {
  padding: 12px 16px 16px;
}

.card-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #1a1a2e;
}

.card-brand {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.card-meta {
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.version-badge {
  background: #ede9fe;
  color: #4f46e5;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.card-stats {
  font-size: 12px;
  color: #999;
  margin-bottom: 10px;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
