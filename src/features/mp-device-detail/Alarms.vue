<script setup>
import { inject, ref, watch, onBeforeUnmount } from 'vue'
import dayjs from 'dayjs'
import { useDeviceList } from './use-list.js'
import Automation from './Automation.vue'
import Sheet from './Sheet.vue'
const props = defineProps({ deviceId: String })
defineEmits(['notify'])
const { api } = inject('mp-device')
const tab = ref('history'),
  start = ref(dayjs().subtract(7, 'day').format('YYYY-MM-DD')),
  end = ref(dayjs().format('YYYY-MM-DD')),
  preset = ref('7d'),
  status = ref(''),
  selected = ref(null)
const statuses = [
  { label: '全部状态', value: '' },
  { label: '高告警', value: 'H' },
  { label: '中级告警', value: 'M' },
  { label: '低告警', value: 'L' },
  { label: '正常', value: 'N' }
]
function filters() {
  const now = dayjs()
  return {
    start_time: preset.value === '24h' ? now.subtract(24, 'hour').format() : dayjs(start.value).startOf('day').format(),
    end_time: preset.value === '24h' ? now.format() : dayjs(end.value).endOf('day').format(),
    alarm_status: status.value
  }
}
let applied = filters()
const { items, loading, error, total, load, invalidate } = useDeviceList(page =>
  api('alarm/info/history', { device_id: props.deviceId, page, page_size: 10, ...applied })
)
watch(
  () => props.deviceId,
  () => load(true),
  { immediate: true }
)
let searchTimer
function search() {
  clearTimeout(searchTimer)
  if (!start.value || !end.value) {
    error.value = '请选择开始日期和结束日期'
    return
  }
  if (start.value > end.value) {
    error.value = '开始日期不能晚于结束日期'
    return
  }
  applied = filters()
  load(true)
}
watch(
  [start, end, status, preset],
  () => {
    clearTimeout(searchTimer)
    invalidate()
    searchTimer = setTimeout(search, 200)
  },
  { flush: 'sync' }
)
onBeforeUnmount(() => clearTimeout(searchTimer))
function selectPreset(value) {
  preset.value = value
  start.value = dayjs()
    .subtract(value === '24h' ? 1 : 7, 'day')
    .format('YYYY-MM-DD')
  end.value = dayjs().format('YYYY-MM-DD')
  search()
}
function reset() {
  status.value = ''
  selectPreset('7d')
}
function label(value) {
  return statuses.find(item => item.value === value)?.label || value || '未知状态'
}
function time(value) {
  return value && dayjs(value).isValid() ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--'
}
</script>
<template>
  <div class="mp-business-tab">
    <div class="mp-segments">
      <button :class="{ active: tab === 'history' }" @click="tab = 'history'">告警历史</button>
      <button :class="{ active: tab === 'rules' }" @click="tab = 'rules'">告警规则</button>
    </div>
    <Automation v-if="tab === 'rules'" :device-id="deviceId" alarm-only @notify="$emit('notify', $event)" />
    <template v-else>
      <form @submit.prevent="search">
        <div class="mp-date-filters">
          <label>
            开始日期
            <input v-model="start" type="date" :max="end" @change="preset = ''" />
          </label>
          <label>
            结束日期
            <input v-model="end" type="date" :min="start" @change="preset = ''" />
          </label>
          <label>
            状态
            <select v-model="status">
              <option v-for="item in statuses" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </label>
        </div>
        <div class="mp-query-actions">
          <div>
            <button type="button" :class="{ active: preset === '7d' }" @click="selectPreset('7d')">最近7天</button>
            <button type="button" :class="{ active: preset === '24h' }" @click="selectPreset('24h')">最近24小时</button>
          </div>
          <div>
            <button type="button" @click="reset">重置</button>
            <button :disabled="loading">查询</button>
          </div>
        </div>
      </form>
      <button v-for="item in items" :key="item.id" class="mp-alarm-row" @click="selected = item">
        <span class="mp-row-heading">
          <strong>{{ item.name || item.alarm_config_name || '告警' }}</strong>
          <small :class="{ normal: item.alarm_status === 'N' }">{{ label(item.alarm_status) }}</small>
        </span>
        <span class="mp-alarm-content">{{ item.content || '暂无告警原因' }}</span>
        <span class="mp-row-heading mp-muted">
          <time>{{ time(item.create_at || item.created_at) }}</time>
          <span>查看详情 ›</span>
        </span>
      </button>
      <div v-if="error" class="mp-state mp-error" role="alert">
        {{ error }}
        <button @click="load(!items.length)">重试</button>
      </div>
      <div v-if="loading" class="mp-state">加载中…</div>
      <div v-else-if="!items.length && !error" class="mp-state">暂无告警历史</div>
      <button v-else-if="items.length < total" @click="load()">加载更多</button>
    </template>
    <Sheet v-if="selected" :title="selected.name || '告警详情'" @close="selected = null">
      <dl class="mp-info-list">
        <dt>告警状态</dt>
        <dd>{{ label(selected.alarm_status) }}</dd>
        <dt>告警时间</dt>
        <dd>{{ time(selected.create_at || selected.created_at) }}</dd>
        <dt>告警内容</dt>
        <dd>{{ selected.content || '--' }}</dd>
        <template v-if="selected.description">
          <dt>告警描述</dt>
          <dd>{{ selected.description }}</dd>
        </template>
      </dl>
      <p v-for="item in selected.alarm_device_list || []" :key="item.id">
        {{ item.device_name || item.name }} · {{ item.id }}
      </p>
    </Sheet>
  </div>
</template>
