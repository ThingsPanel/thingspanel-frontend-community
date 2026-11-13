<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NButton, NSpace } from 'naive-ui'
import { $t } from '@/locales'
import { useSystemManageStore } from '@/store/modules/system-manage'
import RestartDialog from './restart-dialog.vue'
import UpdatesDialog from './updates-dialog.vue'

defineOptions({ name: 'SystemMenu' })

const store = useSystemManageStore()
const showRestart = ref(false)
const showUpdates = ref(false)

onMounted(() => store.probe())
</script>

<template>
  <div v-if="store.available" class="system-menu">
    <NSpace :size="8">
      <NButton type="primary" secondary size="small" data-test="system-menu-updates" @click="showUpdates = true">
        <template #icon>
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16V8M8.5 11.5 12 8l3.5 3.5" />
          </svg>
        </template>
        {{ $t('system-manage.menu.checkUpdates') }}
      </NButton>
      <NButton size="small" data-test="system-menu-restart" @click="showRestart = true">
        <template #icon>
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4.5h-4.5" />
          </svg>
        </template>
        {{ $t('system-manage.menu.restart') }}
      </NButton>
    </NSpace>
    <RestartDialog v-model:show="showRestart" />
    <UpdatesDialog v-model:show="showUpdates" />
  </div>
</template>
