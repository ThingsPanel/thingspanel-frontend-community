<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NSpace, NPopconfirm } from 'naive-ui'
import { $t } from '@/locales'

interface Props {
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  boundDevicesCount?: number
}

interface Emits {
  (e: 'publish'): void
  (e: 'deriveDraft'): void
  (e: 'archive'): void
  (e: 'delete'): void
}

const props = withDefaults(defineProps<Props>(), {
  boundDevicesCount: 0
})

const emit = defineEmits<Emits>()

const canDelete = computed(() => props.boundDevicesCount === 0)
</script>

<template>
  <NSpace>
    <!-- DRAFT status -->
    <template v-if="status === 'DRAFT'">
      <NPopconfirm @positive-click="emit('publish')">
        <template #trigger>
          <NButton type="primary" size="small">
            {{ $t('deviceTemplate.publish') }}
          </NButton>
        </template>
        {{ $t('deviceTemplate.publishConfirm') }}
      </NPopconfirm>

      <NPopconfirm :disabled="!canDelete" @positive-click="emit('delete')">
        <template #trigger>
          <NButton
            type="error"
            size="small"
            :disabled="!canDelete"
            :title="!canDelete ? $t('deviceTemplate.deleteDisabledTip') : undefined"
          >
            {{ $t('common._delete') }}
          </NButton>
        </template>
        {{ $t('deviceTemplate.deleteConfirm') }}
      </NPopconfirm>
    </template>

    <!-- PUBLISHED status -->
    <template v-else-if="status === 'PUBLISHED'">
      <NPopconfirm @positive-click="emit('deriveDraft')">
        <template #trigger>
          <NButton size="small">
            {{ $t('deviceTemplate.deriveDraft') }}
          </NButton>
        </template>
        {{ $t('deviceTemplate.deriveDraftConfirm') }}
      </NPopconfirm>

      <NPopconfirm @positive-click="emit('archive')">
        <template #trigger>
          <NButton type="warning" size="small">
            {{ $t('deviceTemplate.archive') }}
          </NButton>
        </template>
        {{ $t('deviceTemplate.archiveConfirm') }}
      </NPopconfirm>
    </template>

    <!-- ARCHIVED status: no actions -->
    <template v-else-if="status === 'ARCHIVED'">
      <NButton size="small" disabled>
        {{ $t('deviceTemplate.archivedNoOp') }}
      </NButton>
    </template>
  </NSpace>
</template>
