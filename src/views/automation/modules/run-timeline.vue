<script setup lang="ts">
/**
 * One run, as a timeline.
 *
 * The entries come from `buildTimeline`, so the wording is the same here, in the
 * list page and in the device tab. A step that ended "unknown" is amber, not
 * red: the command may well have arrived, and telling the customer it failed
 * leads them to send it twice.
 */
import { computed } from 'vue'
import { NEmpty, NTag, NTimeline, NTimelineItem } from 'naive-ui'
import type { Run } from '@/service/api/automation-rules'
import { buildTimeline, formatDuration } from '@/utils/automation/summary'
import { formatDateTime } from '@/utils/common/datetime'

const props = defineProps<{ run: Run }>()

const entries = computed(() => buildTimeline(props.run))

function typeOf(tone: string) {
  switch (tone) {
    case 'ok':
      return 'success' as const
    case 'bad':
      return 'error' as const
    case 'warn':
      return 'warning' as const
    default:
      return 'info' as const
  }
}

const duration = computed(() => {
  if (!props.run.started_at) return ''
  const start = new Date(props.run.started_at).getTime()
  const end = props.run.finished_at ? new Date(props.run.finished_at).getTime() : Date.now()
  if (Number.isNaN(start) || Number.isNaN(end)) return ''
  return formatDuration(`${Math.max(0, Math.round((end - start) / 1000))}s`)
})
</script>

<template>
  <div class="run-timeline">
    <div class="run-timeline__head">
      <span class="run-timeline__time">{{ formatDateTime(run.started_at) }}</span>
      <NTag size="small" :bordered="false">耗时 {{ duration || '—' }}</NTag>
      <NTag v-if="run.device_id" size="small" :bordered="false" type="info">设备 {{ run.device_id }}</NTag>
      <NTag v-if="run.revision" size="small" :bordered="false">修订 {{ run.revision }}</NTag>
    </div>
    <NTimeline v-if="entries.length">
      <NTimelineItem v-for="entry in entries" :key="entry.key" :type="typeOf(entry.tone)" :title="entry.title">
        <div v-if="entry.detail" class="run-timeline__detail">{{ entry.detail }}</div>
      </NTimelineItem>
    </NTimeline>
    <NEmpty v-else size="small" description="这次执行没有留下步骤记录" />
  </div>
</template>

<style scoped>
.run-timeline__head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.run-timeline__time {
  color: var(--text-color-2);
  font-size: 13px;
}

.run-timeline__detail {
  margin-top: 2px;
  color: var(--text-color-3);
  font-size: 12px;
  line-height: 1.6;
  word-break: break-all;
}
</style>
