<script setup>
import { inject, ref, watch, onBeforeUnmount } from 'vue'
import { useDeviceList } from './use-list.js'
import { loadLinkedAlarmRules } from './alarm-navigation.js'
import { navigateMini } from './bridge.js'
const props = defineProps({ deviceId: String, alarmOnly: Boolean })
const emit = defineEmits(['notify'])
const { api } = inject('mp-device')
const name = ref(''),
  pending = ref(''),
  editing = ref(''),
  choices = ref([]),
  choiceId = ref('')
let appliedName = ''
let navigationVersion = 0
onBeforeUnmount(() => {
  navigationVersion++
})
const { items, loading, error, total, load } = useDeviceList(page =>
  api(props.alarmOnly ? 'scene_automations/alarm' : 'scene_automations/list', {
    device_id: props.deviceId,
    name: appliedName,
    page,
    page_size: 10
  })
)
watch(
  () => [props.deviceId, props.alarmOnly],
  () => load(true),
  { immediate: true }
)
function enabled(value) {
  return ['Y', '1', 1, true].includes(value)
}
function search() {
  appliedName = name.value.trim()
  load(true)
}
async function go(path) {
  try {
    await navigateMini(path)
  } catch (cause) {
    emit('notify', cause.message)
  }
}
async function edit(item) {
  if (!props.alarmOnly || !item?.id) {
    go('/pages/automation/rule' + (item?.id ? '?id=' + encodeURIComponent(item.id) : ''))
    return
  }
  if (editing.value) return
  const current = ++navigationVersion
  editing.value = item.id
  choices.value = []
  choiceId.value = ''
  try {
    const rules = await loadLinkedAlarmRules(item.id, api)
    if (current !== navigationVersion) return
    if (rules.length === 1) await go('/pages/alarm-rules/editor?id=' + encodeURIComponent(rules[0].id))
    else {
      choices.value = rules
      choiceId.value = item.id
    }
  } catch (cause) {
    emit('notify', cause.message)
  } finally {
    editing.value = ''
  }
}
async function toggle(item) {
  if (pending.value) return
  pending.value = item.id
  try {
    await api('scene_automations/switch/' + encodeURIComponent(item.id), null, 'POST')
    await load(true)
  } catch (cause) {
    emit('notify', cause.message)
  } finally {
    pending.value = ''
  }
}
</script>
<template>
  <div class="mp-business-tab" :class="{ embedded: alarmOnly }">
    <form class="mp-search-row" @submit.prevent="search">
      <input v-model="name" type="search" placeholder="搜索场景联动" aria-label="搜索场景联动" />
      <button>搜索</button>
      <button type="button" @click="edit()">{{ alarmOnly ? '新增联动' : '新增' }}</button>
    </form>
    <div v-if="!items.length && !loading && !error" class="mp-state">
      暂无关联{{ alarmOnly ? '告警规则' : '场景联动' }}
    </div>
    <article v-for="item in items" :key="item.id" class="mp-rule-row">
      <div class="mp-row-heading">
        <strong>{{ item.name }}</strong>
        <small>{{ enabled(item.enabled) ? '已启用' : '已停用' }}</small>
      </div>
      <p class="mp-muted">{{ item.description || '暂无描述' }}</p>
      <div class="mp-actions">
        <button :disabled="!!editing" @click="edit(item)">{{ editing === item.id ? '加载中' : '编辑' }}</button>
        <button :disabled="!!pending" @click="toggle(item)">
          {{ pending === item.id ? '处理中' : enabled(item.enabled) ? '停用' : '启用' }}
        </button>
      </div>
      <div v-if="choiceId === item.id">
        <p>请选择要编辑的告警配置</p>
        <button
          v-for="rule in choices"
          :key="rule.id"
          @click="go('/pages/alarm-rules/editor?id=' + encodeURIComponent(rule.id))"
        >
          {{ rule.name || rule.id }} ›
        </button>
      </div>
    </article>
    <div v-if="error" class="mp-state mp-error" role="alert">
      {{ error }}
      <button @click="load(!items.length)">重试</button>
    </div>
    <div v-if="loading" class="mp-state">加载中…</div>
    <button v-else-if="items.length < total" @click="load()">加载更多</button>
  </div>
</template>
