<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NButton, NDropdown, NIcon } from 'naive-ui'
import { $t } from '@/locales'
import { useSystemManageStore } from '@/store/modules/system-manage'
import RestartDialog from './restart-dialog.vue'
import UpdatesDialog from './updates-dialog.vue'

defineOptions({ name: 'SystemMenu' })

const store = useSystemManageStore()
const showRestart = ref(false)
const showUpdates = ref(false)

onMounted(() => store.probe())

const options = () => [
  { label: $t('system-manage.menu.checkUpdates'), key: 'updates' },
  { label: $t('system-manage.menu.restart'), key: 'restart' }
]

function onSelect(key: string) {
  if (key === 'updates') showUpdates.value = true
  else if (key === 'restart') showRestart.value = true
}
</script>

<template>
  <div v-if="store.available" class="system-menu">
    <NDropdown trigger="click" :options="options()" @select="onSelect">
      <NButton quaternary circle :aria-label="$t('system-manage.menu.more')" data-test="system-menu">
        <template #icon>
          <NIcon><span style="font-size: 20px; line-height: 1">⋮</span></NIcon>
        </template>
      </NButton>
    </NDropdown>
    <RestartDialog v-model:show="showRestart" />
    <UpdatesDialog v-model:show="showUpdates" />
  </div>
</template>
