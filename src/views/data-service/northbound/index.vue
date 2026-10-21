<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NAlert, NCard, NDescriptions, NDescriptionsItem, NGrid, NGridItem, NSpin, NStatistic, NTabPane, NTabs, NTag } from 'naive-ui'
import { $t } from '@/locales'
import { fetchOverview, fetchSourceStatus } from '@/service/api/northbound'
import { formatDateTime } from '@/utils/common/datetime'
import ConnectionPanel from './modules/connection-panel.vue'
import DeliveryPanel from './modules/delivery-panel.vue'
import PipelinePanel from './modules/pipeline-panel.vue'

const loading = ref(false)
const overview = ref<Northbound.Overview | null>(null)
const source = ref<Northbound.SourceStatus | null>(null)
const activeTab = ref('overview')

const connectors = computed(() => overview.value?.connectors ?? [])
const pendingCount = computed(() => overview.value?.deliveries.pending ?? 0)
const rejectedCount = computed(() => overview.value?.rejects.capacityRejected ?? 0)

/** 源端是否具备持久边界；不具备时必须明说，不能让用户以为配了就能发。 */
const hasDurableBoundary = computed(() => source.value?.sourceProfile === 'ingress_v1')

function connectorStateTag(state: string) {
  if (state === 'ready') return 'success'
  if (state === 'unreachable') return 'warning'
  return 'error'
}

function connectorStateText(state: string) {
  if (state === 'ready') return $t('page.northbound.connectorReady')
  if (state === 'unreachable') return $t('page.northbound.connectorUnreachable')
  return $t('page.northbound.connectorRevoked')
}

async function load() {
  loading.value = true
  try {
    const [ov, src] = await Promise.all([fetchOverview(), fetchSourceStatus()])
    if (ov.data) overview.value = ov.data
    if (src.data) source.value = src.data
  } finally {
    loading.value = false
  }
}

function refresh() {
  load()
}

onMounted(load)
</script>

<template>
  <NSpin :show="loading">
    <div class="flex-col gap-16px">
      <NAlert v-if="source && !hasDurableBoundary" type="warning" :bordered="false">
        {{ $t('page.northbound.noDurableBoundary', { profile: source.sourceProfile }) }}
      </NAlert>

      <NAlert v-else type="info" :bordered="false">
        {{ $t('page.northbound.guarantee', { point: overview?.capabilities.guaranteeStart ?? '' }) }}
      </NAlert>

      <NTabs v-model:value="activeTab" type="line" animated>
        <NTabPane name="overview" :tab="$t('page.northbound.tabOverview')">
          <div class="flex-col gap-16px">
            <NGrid :cols="4" :x-gap="16" responsive="screen" item-responsive>
              <NGridItem span="4 s:2 m:1">
                <NCard size="small">
                  <NStatistic :label="$t('page.northbound.statPending')" :value="pendingCount">
                    <template #suffix>
                      <span class="text-12px text-gray-400">/ {{ overview?.capabilities.maxBacklogEvents ?? 0 }}</span>
                    </template>
                  </NStatistic>
                </NCard>
              </NGridItem>
              <NGridItem span="4 s:2 m:1">
                <NCard size="small">
                  <NStatistic :label="$t('page.northbound.statDelivered')" :value="overview?.deliveries.delivered ?? 0" />
                </NCard>
              </NGridItem>
              <NGridItem span="4 s:2 m:1">
                <NCard size="small">
                  <NStatistic :label="$t('page.northbound.statUnknown')" :value="overview?.deliveries.unknown ?? 0" />
                </NCard>
              </NGridItem>
              <NGridItem span="4 s:2 m:1">
                <NCard size="small">
                  <NStatistic
                    :label="$t('page.northbound.statRejected')"
                    :value="rejectedCount"
                    :value-style="{ color: rejectedCount > 0 ? '#d03050' : undefined }"
                  />
                </NCard>
              </NGridItem>
            </NGrid>

            <NCard size="small" :title="$t('page.northbound.rejectNote')">
              <p class="m-0 text-13px text-gray-500">{{ $t('page.northbound.rejectExplain') }}</p>
              <p v-if="overview?.rejects.lastRejectAt" class="m-0 mt-8px text-13px">
                {{ $t('page.northbound.lastReject') }}：{{ formatDateTime(overview.rejects.lastRejectAt) }}
                <NTag size="small" type="error" class="ml-8px">{{ overview.rejects.lastRejectCode }}</NTag>
              </p>
            </NCard>

            <NCard size="small" :title="$t('page.northbound.connectors')">
              <div v-for="c in connectors" :key="c.id" class="mb-12px border-b border-gray-100 pb-12px last:mb-0 last:border-0 last:pb-0">
                <div class="flex items-center gap-8px">
                  <span class="font-600">{{ c.displayName }}</span>
                  <NTag size="small" :type="connectorStateTag(c.state)">{{ connectorStateText(c.state) }}</NTag>
                  <span class="text-12px text-gray-400">{{ c.id }} · v{{ c.version }}</span>
                </div>
                <div class="mt-4px text-13px text-gray-500">{{ c.description }}</div>
                <div class="mt-4px flex gap-8px text-12px text-gray-400">
                  <span>{{ $t('page.northbound.ackLevel') }}：{{ c.capabilities.ackLevel }}</span>
                  <span>{{ $t('page.northbound.idempotency') }}：{{ c.capabilities.idempotency }}</span>
                  <span v-if="c.lastError" class="text-red-500">{{ c.lastError }}</span>
                </div>
              </div>
            </NCard>

            <NCard v-if="source" size="small" :title="$t('page.northbound.sourceTitle')">
              <NDescriptions :column="3" label-placement="top" size="small" bordered>
                <NDescriptionsItem :label="$t('page.northbound.sourceEnabled')">
                  <NTag size="small" :type="source.enabled ? 'success' : 'default'">
                    {{ source.enabled ? $t('page.northbound.on') : $t('page.northbound.off') }}
                  </NTag>
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.northbound.sourceProfile')">
                  {{ source.sourceProfile }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.northbound.sourceSubscribed')">
                  {{ source.subscribedTenants }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.northbound.sourceWaiting')">
                  {{ source.outbox.pending }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.northbound.sourceHandedOff')">
                  {{ source.outbox.handedOff }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.northbound.sourceFailed')">
                  {{ source.outbox.failed }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.northbound.sourceRelayOk')" :span="2">
                  {{ source.relay.lastSuccessAt ? formatDateTime(source.relay.lastSuccessAt) : $t('page.northbound.never') }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.northbound.sourceRelayErr')">
                  <span :class="source.relay.lastError ? 'text-red-500' : ''">
                    {{ source.relay.lastError || $t('page.northbound.none') }}
                  </span>
                </NDescriptionsItem>
              </NDescriptions>
            </NCard>
          </div>
        </NTabPane>

        <NTabPane name="connections" :tab="$t('page.northbound.tabConnections')">
          <ConnectionPanel :connectors="connectors" @changed="refresh" />
        </NTabPane>

        <NTabPane name="pipelines" :tab="$t('page.northbound.tabPipelines')">
          <PipelinePanel @changed="refresh" />
        </NTabPane>

        <NTabPane name="deliveries" :tab="$t('page.northbound.tabDeliveries')">
          <DeliveryPanel />
        </NTabPane>
      </NTabs>
    </div>
  </NSpin>
</template>
