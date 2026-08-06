<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NButton, NEllipsis, NIcon } from 'naive-ui'
import { CloudDownloadOutline } from '@vicons/ionicons5'
import { $t } from '@/locales'
import defaultCover from '@/assets/imgs/default_template_cover.png'

const props = withDefaults(
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
    mode?: 'grid' | 'list'
  }>(),
  {
    mode: 'grid'
  }
)

const emit = defineEmits(['install', 'view-detail'])

/** 分类标签文字色：农业紫 / 工业青绿 / 其他橙 / IoT 红 / sensor 蓝 / 默认主色 */
const categoryColor = computed(() => {
  const category = (props.template.category || '').toLowerCase()
  if (category.includes('农业') || category.includes('agriculture')) return '#7c3aed'
  if (category.includes('工业') || category.includes('industrial')) return '#0d9488'
  if (category.includes('其他') || category.includes('other')) return '#ea580c'
  if (category === 'iot') return '#dc2626'
  if (category.includes('sensor') || category.includes('传感')) return '#2563eb'
  return 'var(--primary-color, #6366f1)'
})

const brandModelText = computed(() => {
  const parts = [props.template.brand, props.template.model].filter(Boolean)
  return parts.join(' · ')
})

const coverSrc = computed(() => props.template.cover_url || defaultCover)
</script>

<template>
  <!-- 网格卡片 -->
  <NCard v-if="mode === 'grid'" hoverable class="market-card" :content-style="{ padding: '0' }">
    <div
      class="card-cover"
      role="img"
      :aria-label="template.name"
      :style="{ backgroundImage: `url(${coverSrc})` }"
    >
      <span v-if="template.category" class="category-badge" :style="{ color: categoryColor }">
        {{ template.category }}
      </span>
    </div>

    <div class="card-body">
      <div class="card-name">
        <NEllipsis :line-clamp="1">{{ template.name }}</NEllipsis>
      </div>

      <div v-if="brandModelText" class="card-brand">{{ brandModelText }}</div>

      <div class="card-meta">
        <span v-if="template.author_name" class="author-name">{{ template.author_name }}</span>
        <span v-if="template.latest_version" class="version-badge">v{{ template.latest_version }}</span>
        <span class="install-stat">
          <NIcon size="14" class="install-icon"><CloudDownloadOutline /></NIcon>
          {{ template.install_count || 0 }} {{ $t('market.installCount') }}
        </span>
      </div>

      <div class="card-actions">
        <NButton class="action-btn" size="small" @click="emit('view-detail', template.id)">
          {{ $t('market.viewDetail') }}
        </NButton>
        <NButton class="action-btn" size="small" type="primary" @click="emit('install', template.id)">
          {{ $t('market.install') }}
        </NButton>
      </div>
    </div>
  </NCard>

  <!-- 列表行 -->
  <div v-else class="market-list-row" @click="emit('view-detail', template.id)">
    <div
      class="list-cover"
      role="img"
      :aria-label="template.name"
      :style="{ backgroundImage: `url(${coverSrc})` }"
    />

    <div class="list-main">
      <div class="card-name">
        <NEllipsis :line-clamp="1">{{ template.name }}</NEllipsis>
      </div>
      <div class="list-sub">
        <span v-if="brandModelText" class="card-brand">{{ brandModelText }}</span>
        <span v-if="template.category" class="list-category" :style="{ color: categoryColor }">
          {{ template.category }}
        </span>
      </div>
    </div>

    <div class="list-right">
      <span class="install-stat">
        <NIcon size="14" class="install-icon"><CloudDownloadOutline /></NIcon>
        {{ template.install_count || 0 }} {{ $t('market.installCount') }}
      </span>
      <div class="list-actions" @click.stop>
        <NButton size="small" @click="emit('view-detail', template.id)">{{ $t('market.viewDetail') }}</NButton>
        <NButton size="small" type="primary" @click="emit('install', template.id)">{{ $t('market.install') }}</NButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.market-card {
  overflow: hidden;
  min-width: 0;
  width: 100%;
  border-radius: 12px;
  transition: box-shadow 0.2s;

  :deep(.n-card__content) {
    display: flex;
    flex-direction: column;
  }

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}

.card-cover {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #f1f5f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
}

.category-badge {
  position: absolute;
  left: 10px;
  bottom: 10px;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(4px);
  line-height: 1.5;
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
  margin-bottom: 8px;
}

.card-meta {
  font-size: 12px;
  color: #888;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.author-name {
  color: #666;
}

.version-badge {
  background: #ede9fe;
  color: #4f46e5;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.install-stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #999;
}

.install-icon {
  color: #999;
}

.card-actions {
  display: flex;
  gap: 8px;
  width: 100%;
}

.action-btn {
  flex: 1;
  width: 100%;
}

/* 列表模式 */
.market-list-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef0f4;
  cursor: pointer;
  transition:
    box-shadow 0.2s,
    border-color 0.2s;
  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border-color: #e0e4ef;
  }
}

.list-cover {
  flex-shrink: 0;
  width: 96px;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f1f5f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.list-main {
  flex: 1;
  min-width: 0;
  .card-brand {
    margin-bottom: 0;
  }
}

.list-sub {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.list-category {
  font-size: 12px;
  font-weight: 500;
  padding: 1px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid #eee;
}

.list-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.list-actions {
  display: flex;
  gap: 8px;
}
</style>
