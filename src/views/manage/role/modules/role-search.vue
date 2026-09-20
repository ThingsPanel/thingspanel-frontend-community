<script setup lang="ts">
import { $t } from '@/locales'
import { enableStatusOptions } from '@/constants/business'
import { translateOptions } from '@/utils/common4'

defineOptions({
  name: 'RoleSearch'
})

interface Emits {
  (e: 'reset'): void

  (e: 'search'): void
}

const emit = defineEmits<Emits>()

const model = defineModel<Api.SystemManage.RoleSearchParams>('model', { required: true })

function reset() {
  emit('reset')
}

function search() {
  emit('search')
}
</script>

<template>
  <NCard :title="$t('common.search')" :bordered="false" size="small" class="card-wrapper">
    <NForm :model="model" label-placement="left">
      <NGrid responsive="screen" item-responsive x-gap="12" y-gap="12" class="search-form-grid">
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.manage.role.roleName')" path="roleName" class="pr-24px">
          <NInput v-model:value="model.roleName" :placeholder="$t('page.manage.role.form.roleName')" />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.manage.role.roleCode')" path="roleCode" class="pr-24px">
          <NInput v-model:value="model.roleCode" :placeholder="$t('page.manage.role.form.roleCode')" />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.manage.role.roleStatus')" path="status" class="pr-24px">
          <NSelect
            v-model:value="model.status"
            :placeholder="$t('page.manage.role.form.roleStatus')"
            :options="translateOptions(enableStatusOptions)"
            clearable
          />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" class="search-form-actions">
          <NSpace class="w-full" justify="end">
            <NButton class="search-form-button" @click="reset">
              <template #icon>
                <IconIcRoundRefresh class="text-icon" />
              </template>
              {{ $t('common.reset') }}
            </NButton>
            <NButton type="primary" class="search-form-button" @click="search">
              <template #icon>
                <IconIcRoundSearch class="text-icon" />
              </template>
              {{ $t('common.search') }}
            </NButton>
          </NSpace>
        </NFormItemGi>
      </NGrid>
    </NForm>
  </NCard>
</template>

<style scoped lang="scss">
.search-form-grid {
  :deep(.n-input),
  :deep(.n-base-selection) {
    min-height: 36px;
    border-radius: 8px;
  }

  :deep(.n-button) {
    height: 36px;
    border-radius: 8px;
  }
}

.search-form-actions {
  :deep(.n-space) {
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .search-form-actions {
    :deep(.n-space) {
      justify-content: stretch;
    }

    :deep(.n-button) {
      flex: 1;
    }
  }
}
</style>
