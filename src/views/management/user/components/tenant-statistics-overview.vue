<script setup lang="ts">
import { computed } from 'vue'
import { $t } from '@/locales'
import { useAppStore } from '@/store/modules/app'

defineOptions({ name: 'TenantStatisticsOverview' })

const props = defineProps<{
  statistics: Api.UserManagement.TenantStatistics | null
  loading: boolean
  selectedScope: Api.UserManagement.TenantActivityScope | null
}>()

const emit = defineEmits<{
  'select-scope': [scope: Api.UserManagement.TenantActivityScope | null]
}>()

const appStore = useAppStore()

const summary = computed<Api.UserManagement.TenantStatisticsSummary>(
  () =>
    props.statistics?.summary ?? {
      total: 0,
      active_today: 0,
      active_last_7_days: 0,
      active_last_30_days: 0,
      inactive_over_30_days: 0
    }
)

function percentage(value: number) {
  if (summary.value.total === 0) return 0
  return Number(((value / summary.value.total) * 100).toFixed(1))
}

const cards = computed(() => {
  void appStore.locale
  return [
    {
      key: 'total',
      title: $t('page.manage.user.statistics.total'),
      value: summary.value.total,
      description: $t('page.manage.user.statistics.totalTip'),
      scope: null
    },
    {
      key: 'today',
      title: $t('page.manage.user.statistics.activeToday'),
      value: summary.value.active_today,
      description: $t('page.manage.user.statistics.activeTodayTip'),
      scope: 'today' as const
    },
    {
      key: 'last7Days',
      title: $t('page.manage.user.statistics.active7Days'),
      value: summary.value.active_last_7_days,
      description: $t('page.manage.user.statistics.active7DaysTip'),
      rate: percentage(summary.value.active_last_7_days),
      scope: 'last_7_days' as const
    },
    {
      key: 'last30Days',
      title: $t('page.manage.user.statistics.active30Days'),
      value: summary.value.active_last_30_days,
      description: $t('page.manage.user.statistics.active30DaysTip'),
      rate: percentage(summary.value.active_last_30_days),
      scope: 'last_30_days' as const
    },
    {
      key: 'inactive',
      title: $t('page.manage.user.statistics.inactive30Days'),
      value: summary.value.inactive_over_30_days,
      description: $t('page.manage.user.statistics.inactive30DaysTip'),
      scope: 'inactive_over_30_days' as const,
      warning: true
    }
  ]
})

function selectCard(scope: Api.UserManagement.TenantActivityScope | null) {
  if (scope !== null && props.selectedScope === scope) {
    emit('select-scope', null)
    return
  }
  emit('select-scope', scope)
}
</script>

<template>
  <section class="statistics-overview" :aria-label="$t('page.manage.user.statistics.title')">
    <NSpin :show="loading">
      <NGrid cols="1 s:2 m:3 l:5" :x-gap="0" :y-gap="0" responsive="screen">
        <NGridItem v-for="card in cards" :key="card.key">
          <button
            type="button"
            class="statistics-card"
            :class="{
              'statistics-card--selected': selectedScope === card.scope && card.scope !== null,
              'statistics-card--warning': card.warning
            }"
            :title="`${card.description} · ${$t('page.manage.user.statistics.scopeTip')}`"
            :aria-pressed="selectedScope === card.scope"
            @click="selectCard(card.scope)"
          >
            <span class="statistic-label">{{ card.title }}</span>
            <strong>{{ loading ? '—' : card.value }}</strong>
          </button>
        </NGridItem>
      </NGrid>
    </NSpin>
  </section>
</template>

<style scoped>
.statistics-overview {
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  overflow: hidden;
}
.statistics-card {
  width: 100%;
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  color: inherit;
  text-align: left;
  background: transparent;
  border: 0;
  border-right: 1px solid var(--n-border-color);
  cursor: pointer;
  transition: background-color 0.15s;
}
.statistic-label {
  font-size: 13px;
  opacity: 0.65;
}
.statistics-card strong {
  font-size: 24px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.statistics-card:hover {
  background: rgba(100, 108, 255, 0.04);
}
.statistics-card--selected {
  background: rgba(100, 108, 255, 0.08);
  box-shadow: inset 0 -2px #646cff;
}
.statistics-card:focus-visible {
  outline: 2px solid #646cff;
  outline-offset: -2px;
}
.statistics-card--warning strong {
  color: #d99018;
}
</style>
