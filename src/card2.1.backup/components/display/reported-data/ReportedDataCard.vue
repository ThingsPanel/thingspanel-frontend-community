<template>
  <n-card :title="title" :bordered="false" size="small" class="reported-data-card" :loading="loading">
    <template #header-extra>
      <n-button text size="small" :loading="isFetchingUpdate" @click="toggleRefresh">
        <template #icon>
          <n-icon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8zm0 18v-2a8 8 0 0 1-8-8H2a10 10 0 0 0 10 10zm8-10h2a10 10 0 0 0-10-10v2a8 8 0 0 1 8 8z"
              ></path>
            </svg>
          </n-icon>
        </template>
        {{ isRefreshing ? $t('card.reportedData.refreshing') : $t('card.reportedData.startRefresh') }}
      </n-button>
    </template>

    <n-alert v-if="error && !loading" type="error" :title="$t('common.error')">
      {{ error.message }}
    </n-alert>

    <n-spin :show="isFetchingUpdate && !loading">
      <n-empty v-if="!loading && !error && devices.length === 0" :description="$t('card.noData')" />
      <div v-else class="device-list">
        <n-thing
          v-for="(device, index) in devices"
          :key="device.device_id"
          class="device-item"
          :class="{ 'is-first': index === 0 }"
        >
          <template #header>
            <div class="header-content">
              <div class="device-info">
                <n-icon size="16">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </n-icon>
                <span class="device-name" :title="device.device_name">{{ device.device_name }}</span>
                <n-tag :type="device.is_online === 1 ? 'success' : 'default'" size="tiny" round>
                  {{ device.is_online === 1 ? $t('custom.devicePage.online') : $t('custom.devicePage.offline') }}
                </n-tag>
              </div>
              <div class="last-push-time">
                <n-icon size="12">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </n-icon>
                {{ formatRelativeTime(device.last_push_time) }}
              </div>
            </div>
          </template>

          <div class="telemetry-container">
            <BottomUpInfiniteScroller
              v-if="device.telemetry_data.length > 0"
              :list="getPairedTelemetry(device.telemetry_data)"
              height="76px"
            >
              <template #default="{ item: pair }">
                <n-grid x-gap="12" :cols="2" class="telemetry-row">
                  <n-gi><TelemetryItemDisplay :item="pair.left" /></n-gi>
                  <n-gi class="right-col"><TelemetryItemDisplay :item="pair.right" /></n-gi>
                </n-grid>
              </template>
            </BottomUpInfiniteScroller>
            <div v-else class="no-telemetry">{{ $t('card.reportedData.noTelemetry') }}</div>
          </div>
        </n-thing>
      </div>
    </n-spin>

    <template #footer>
      <div class="footer-link">
        <router-link to="/device/manage">{{ $t('card.viewAll') }} ></router-link>
      </div>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue'
import { NCard, NButton, NIcon, NSpin, NEmpty, NThing, NTag, NGrid, NGi, NAlert } from 'naive-ui'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { $t } from '@/locales'
import BottomUpInfiniteScroller from '@/components/BottomUpInfiniteScroller.vue'
import { useData } from './useData'

dayjs.extend(relativeTime)

defineProps<{ title: string }>()

const { devices, loading, error, isRefreshing, isFetchingUpdate, toggleRefresh } = useData()

// --- Formatting Helpers ---
const formatRelativeTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return '-'
  const time = dayjs(timeStr)
  return time.isValid() ? time.fromNow() : '-'
}

const getPairedTelemetry = (telemetry: any[]) => {
  if (!Array.isArray(telemetry)) return []
  const paired = []
  for (let i = 0; i < telemetry.length; i += 2) {
    paired.push({ left: telemetry[i] || null, right: telemetry[i + 1] || null })
  }
  return paired
}

const formatValue = (item: any): string => {
  if (!item || item.value === null || item.value === undefined) return '-'
  const { value, key, unit } = item
  let displayValue: string

  if (typeof value === 'boolean') {
    displayValue = value ? $t('card.on') : $t('card.off')
  } else if (typeof value === 'number') {
    displayValue = Number.isInteger(value) ? String(value) : value.toFixed(1)
  } else {
    displayValue = String(value)
  }

  return unit ? `${displayValue} ${unit}` : displayValue
}

// Sub-component for telemetry item display
const TelemetryItemDisplay = defineComponent({
  props: ['item'],
  setup(props) {
    if (!props.item) return () => <div class="telemetry-item-placeholder" />
    return () => (
      <div>
        <div class="telemetry-label" title={props.item.label || props.item.key}>
          {props.item.label || props.item.key}
        </div>
        <div class="telemetry-value" title={String(props.item.value)}>
          {formatValue(props.item)}
        </div>
      </div>
    )
  }
})
</script>

<style scoped>
.reported-data-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
:deep(.n-card__content) {
  flex-grow: 1;
  overflow: hidden;
  padding: 0 16px !important;
}
.device-list {
  margin-top: 8px;
}
.device-item {
  padding: 12px;
  border: 1px solid var(--n-border-color);
  border-radius: 4px;
  margin-bottom: 8px;
  background-color: var(--n-color-embedded);
}
.device-item.is-first {
  border-left: 4px solid var(--n-primary-color);
}
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.device-info {
  display: flex;
  align-items: center;
  min-width: 0;
}
.device-name {
  font-weight: 500;
  margin: 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.last-push-time {
  font-size: 12px;
  color: var(--n-text-color-disabled);
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.telemetry-container {
  margin-top: 4px;
}
.telemetry-row {
  font-size: 12px;
  padding: 6px 0;
  border-bottom: 1px solid var(--n-divider-color);
}
.telemetry-row:last-child {
  border-bottom: none;
}
.right-col {
  border-left: 1px solid var(--n-divider-color);
  padding-left: 12px;
}
.telemetry-label {
  color: var(--n-text-color-disabled);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.telemetry-value {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}
.telemetry-item-placeholder {
  height: 34px;
} /* Consistent height */
.no-telemetry {
  font-size: 12px;
  text-align: center;
  padding: 8px 0;
  color: var(--n-text-color-disabled);
}
.footer-link {
  text-align: center;
}
.footer-link a {
  font-size: 12px;
  color: var(--n-primary-color);
  text-decoration: none;
}
</style>
