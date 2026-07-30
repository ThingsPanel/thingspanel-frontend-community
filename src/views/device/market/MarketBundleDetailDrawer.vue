<script setup lang="ts">
import { computed } from 'vue'
import {
  NAlert,
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NSelect,
  NSpace,
  NSpin,
  NTag
} from 'naive-ui'
import type { DashboardBindingSpec, MarketBundleDetail, MarketBundleListItem } from '@/service/api/market-bundle'

const props = defineProps<{
  visible: boolean
  bundle: MarketBundleDetail | null
  version: string
  bindings: DashboardBindingSpec[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:version': [value: string]
  install: [bundle: MarketBundleListItem]
}>()

const versionOptions = computed(
  () => props.bundle?.versions.map((item) => ({ label: item.version, value: item.version })) ?? []
)

const selectedVersion = computed(() => props.bundle?.versions.find((item) => item.version === props.version))

function install() {
  if (!props.bundle || !props.version) return
  emit('install', {
    bundleKey: props.bundle.bundleKey,
    name: props.bundle.name,
    description: props.bundle.description,
    category: props.bundle.category,
    author: props.bundle.author,
    tags: props.bundle.tags,
    latestVersion: props.version,
    publishedAt: selectedVersion.value?.publishedAt ?? '',
    installCount: props.bundle.totalInstalls,
    rating: props.bundle.rating
  })
}
</script>

<template>
  <NDrawer :show="visible" width="560" @update:show="emit('update:visible', $event)">
    <NDrawerContent :title="bundle?.name || '解决方案详情'" closable>
      <NSpin :show="loading">
        <NEmpty v-if="!loading && !bundle" description="无法加载商品详情" />
        <template v-else-if="bundle">
          <NDescriptions bordered :column="1">
            <NDescriptionsItem label="分类">{{ bundle.category }}</NDescriptionsItem>
            <NDescriptionsItem label="作者">{{ bundle.author || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="安装量">{{ bundle.totalInstalls }}</NDescriptionsItem>
            <NDescriptionsItem label="版本">
              <NSelect :value="version" :options="versionOptions" @update:value="emit('update:version', $event)" />
            </NDescriptionsItem>
          </NDescriptions>

          <p class="description">{{ bundle.description || '暂无说明' }}</p>

          <NAlert v-if="selectedVersion" type="info" title="安装内容">
            设备模板 {{ selectedVersion.deviceTemplateCount }} 个，看板 {{ selectedVersion.dashboardCount }} 个。
          </NAlert>

          <div class="bindings">
            <h3>安装时需要绑定的设备</h3>
            <NEmpty v-if="bindings.length === 0" description="该方案无需绑定设备" />
            <NSpace v-else vertical>
              <div v-for="dashboard in bindings" :key="dashboard.dashboardKey" class="binding-card">
                <strong>{{ dashboard.dashboardName || 'ThingsVis 看板' }}</strong>
                <NSpace class="mt-2">
                  <NTag v-for="binding in dashboard.bindings" :key="binding.bindingKey">
                    {{ binding.displayName }}
                    <span v-if="binding.required">（必填）</span>
                  </NTag>
                </NSpace>
              </div>
            </NSpace>
          </div>
        </template>
      </NSpin>

      <template #footer>
        <NButton type="primary" :disabled="!bundle || !version" @click="install">安装此版本</NButton>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.description {
  margin: 20px 0;
  line-height: 1.7;
}

.bindings {
  margin-top: 20px;
}

.binding-card {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
}

.mt-2 {
  margin-top: 8px;
}
</style>
