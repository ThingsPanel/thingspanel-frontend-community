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

const revisit = computed<Api.UserManagement.TenantRevisitStatistics>(
  () =>
    props.statistics?.revisit ?? {
      revisited: 0,
      not_revisited: 0
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
  <section>
    <div class="mb-12px flex items-center justify-between">
      <h3 class="m-0 text-16px font-600">{{ $t('page.manage.user.statistics.title') }}</h3>
      <span class="text-12px text-gray-500">{{ $t('page.manage.user.statistics.scopeTip') }}</span>
    </div>

    <NSpin :show="loading">
      <NGrid cols="1 s:2 m:3 l:5" :x-gap="12" :y-gap="12" responsive="screen">
        <NGridItem v-for="card in cards" :key="card.key">
          <button
            type="button"
            class="statistics-card"
            :class="{
              'statistics-card--selected': selectedScope === card.scope && card.scope !== null,
              'statistics-card--warning': card.warning
            }"
            :title="card.description"
            @click="selectCard(card.scope)"
          >
            <span class="text-13px text-gray-500">{{ card.title }}</span>
            <strong class="mt-10px text-28px font-600 leading-none">{{ card.value }}</strong>
            <span class="mt-8px min-h-18px text-12px text-gray-400">
              <template v-if="card.rate !== undefined">
                {{ $t('page.manage.user.statistics.percentage', { value: card.rate }) }}
              </template>
              <template v-else>{{ card.description }}</template>
            </span>
          </button>
        </NGridItem>
      </NGrid>

      <NCard class="mt-12px" size="small" :bordered="true">
        <template #header>
          <span class="text-14px font-600">{{ $t('page.manage.user.statistics.revisitTitle') }}</span>
        </template>
        <NGrid cols="1 m:2" :x-gap="24" :y-gap="16" responsive="screen">
          <NGridItem>
            <div class="mb-8px flex items-center justify-between">
              <span>{{ $t('page.manage.user.statistics.revisited') }}</span>
              <span class="font-600">{{ revisit.revisited }} · {{ percentage(revisit.revisited) }}%</span>
            </div>
            <NProgress type="line" :percentage="percentage(revisit.revisited)" :show-indicator="false" />
          </NGridItem>
          <NGridItem>
            <div class="mb-8px flex items-center justify-between">
              <span>{{ $t('page.manage.user.statistics.notRevisited') }}</span>
              <span class="font-600">{{ revisit.not_revisited }} · {{ percentage(revisit.not_revisited) }}%</span>
            </div>
            <NProgress
              type="line"
              status="warning"
              :percentage="percentage(revisit.not_revisited)"
              :show-indicator="false"
            />
          </NGridItem>
        </NGrid>
      </NCard>
    </NSpin>
  </section>
</template>

<style scoped>
.statistics-card {
  width: 100%;
  min-height: 118px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px;
  color: inherit;
  text-align: left;
  background: transparent;
  border: 1px solid rgba(128, 128, 128, 0.18);
  border-radius: 8px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.2s;
}

.statistics-card:hover,
.statistics-card--selected {
  border-color: #646cff;
  box-shadow: 0 4px 14px rgba(100, 108, 255, 0.14);
  transform: translateY(-1px);
}

.statistics-card--selected {
  background: rgba(100, 108, 255, 0.06);
}

.statistics-card--warning strong {
  color: #f0a020;
}
</style>
