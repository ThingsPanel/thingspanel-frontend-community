<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  NDrawer,
  NDrawerContent,
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NSpace,
  NSpin,
  NSelect,
  NAlert
} from 'naive-ui'
import { $t } from '@/locales'
import { getMarketTemplateDetail } from '@/service/api/market'
import { marketTemplateCompatibility } from '../market-template-compatibility'
import defaultCover from '@/assets/imgs/default_template_cover.png'

const props = defineProps<{
  visible: boolean
  templateId: string
}>()

const emit = defineEmits(['update:visible', 'install'])

const loading = ref(false)
const detail = ref<any>(null)

const selectedVersion = ref('')
const compatibility = computed(() => marketTemplateCompatibility(detail.value, selectedVersion.value))
let requestSequence = 0
watch(
  [() => props.visible, () => props.templateId],
  async ([visible, id]) => {
    const sequence = ++requestSequence
    detail.value = null
    selectedVersion.value = ''
    if (!visible || !id) {
      loading.value = false
      return
    }
    loading.value = true
    try {
      const res: any = await getMarketTemplateDetail(id)
      if (sequence !== requestSequence) return
      if (!res.error) {
        detail.value = res.data
        selectedVersion.value = String(res.data?.latest_version || res.data?.versions?.[0]?.version || '')
      }
    } catch {
      if (sequence === requestSequence) window.$message?.error($t('market.compatibility.unavailable'))
    } finally {
      if (sequence === requestSequence) loading.value = false
    }
  },
  { immediate: true }
)

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <NDrawer :show="visible" :width="480" @update:show="handleClose">
    <NDrawerContent :title="$t('market.templateDetail')" closable>
      <NSpin :show="loading">
        <template v-if="detail">
          <!-- 封面 -->
          <div class="drawer-cover">
            <img v-if="detail.cover_url" :src="detail.cover_url" :alt="detail.name" />
            <img v-else :src="defaultCover" :alt="detail.name" />
          </div>

          <!-- 基本信息 -->
          <NDescriptions :column="1" label-placement="left" bordered size="small" class="mb-4">
            <NDescriptionsItem :label="$t('device_template.templateName')">{{ detail.name }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('device_template.brand')">{{ detail.brand || '--' }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('device_template.modelNumber')">{{ detail.model || '--' }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('device_template.author')">
              {{ detail.author_name || detail.author_id || '--' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('device_template.version')">
              {{ detail.latest_version || '--' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('market.installCount')">{{ detail.install_count || 0 }}</NDescriptionsItem>
          </NDescriptions>

          <!-- 描述 -->
          <div v-if="detail.description" class="section">
            <h4>{{ $t('generate.description') }}</h4>
            <p class="desc-text">{{ detail.description }}</p>
          </div>

          <div class="section">
            <NSelect
              v-model:value="selectedVersion"
              :options="(detail.versions || []).map(v => ({ label: v.version, value: v.version }))"
            />
            <NAlert class="mt-2" :type="compatibility === 'native' ? 'success' : 'warning'">
              {{
                $t(
                  compatibility === 'native'
                    ? 'market.compatibility.native'
                    : compatibility === 'legacy'
                      ? 'market.compatibility.legacy'
                      : 'market.compatibility.unavailable'
                )
              }}
            </NAlert>
          </div>

          <!-- 版本历史 -->
          <div v-if="detail.versions && detail.versions.length" class="section">
            <h4>{{ $t('market.versionHistory') }}</h4>
            <div v-for="v in detail.versions" :key="v.version" class="version-item">
              <NSpace align="center" :size="8">
                <NTag size="small" type="primary">v{{ v.version }}</NTag>
                <span class="version-date">
                  {{ v.created_at ? new Date(v.created_at).toLocaleDateString('zh-CN') : '' }}
                </span>
              </NSpace>
              <p v-if="v.changelog" class="version-changelog">{{ v.changelog }}</p>
            </div>
          </div>

          <!-- 标签 -->
          <div v-if="detail.tags && detail.tags.length" class="section">
            <NSpace :size="6">
              <NTag v-for="tag in detail.tags" :key="tag" size="small">{{ tag }}</NTag>
            </NSpace>
          </div>
        </template>
      </NSpin>

      <template #footer>
        <NButton
          type="primary"
          block
          :disabled="loading || compatibility !== 'native'"
          @click="emit('install', templateId, selectedVersion)"
        >
          {{ $t('market.install') }}
        </NButton>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped lang="scss">
.drawer-cover {
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  img {
    width: 100%;
    max-height: 200px;
    object-fit: cover;
  }
}

.section {
  margin-bottom: 16px;
  h4 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #333;
  }
}

.desc-text {
  color: #666;
  font-size: 13px;
  line-height: 1.6;
}

.version-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  &:last-child {
    border-bottom: none;
  }
}

.version-date {
  font-size: 12px;
  color: #999;
}

.version-changelog {
  margin: 4px 0 0;
  font-size: 12px;
  color: #666;
}
</style>
