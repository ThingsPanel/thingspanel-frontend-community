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
  <NCard :title="搜索" :bordered="false" size="small" class="card-wrapper">
    <NForm :model="model" label-placement="left">
      <NGrid responsive="screen" item-responsive>
        <NFormItemGi span="24 s:12 m:6" :label="角色名称" path="roleName" class="pr-24px">
          <NInput v-model:value="model.roleName" :placeholder="请输入角色名称" />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="角色编码" path="roleCode" class="pr-24px">
          <NInput v-model:value="model.roleCode" :placeholder="请输入角色编码" />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="角色状态" path="status" class="pr-24px">
          <NSelect
            v-model:value="model.status"
            :placeholder="请选择角色状态"
            :options="translateOptions(enableStatusOptions)"
            clearable
          />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6">
          <NSpace class="w-full" justify="end">
            <NButton @click="reset">
              <template #icon>
                <IconIcRoundRefresh class="text-icon" />
              </template>
              {{ "重置" }}
            </NButton>
            <NButton type="primary" ghost @click="search">
              <template #icon>
                <IconIcRoundSearch class="text-icon" />
              </template>
              {{ "搜索" }}
            </NButton>
          </NSpace>
        </NFormItemGi>
      </NGrid>
    </NForm>
  </NCard>
</template>

<style scoped></style>
