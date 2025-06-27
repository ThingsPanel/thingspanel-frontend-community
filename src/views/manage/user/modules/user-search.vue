<script setup lang="ts">
import { computed } from 'vue'
import { $t } from '@/locales'
import { useFormRules, useNaiveForm } from '@/hooks/common/form'
import { enableStatusOptions, userGenderOptions } from '@/constants/business'
import { translateOptions } from '@/utils/common4'
defineOptions({
  name: 'UserSearch'
})

interface Emits {
  (e: 'reset'): void
  (e: 'search'): void
}

const emit = defineEmits<Emits>()

const { formRef, validate, restoreValidation } = useNaiveForm()

const model = defineModel<Api.SystemManage.UserSearchParams>('model', { required: true })

type RuleKey = Extract<keyof Api.SystemManage.UserSearchParams, 'userEmail' | 'userPhone'>

const rules = computed<Record<RuleKey, App.Global.FormRule>>(() => {
  const { patternRules } = useFormRules() // inside computed to make locale reactive

  return {
    userEmail: patternRules.email,
    userPhone: patternRules.phone
  }
})

async function reset() {
  await restoreValidation()
  emit('reset')
}

async function search() {
  await validate()
  emit('search')
}
</script>

<template>
  <NCard :title="搜索" :bordered="false" size="small" class="card-wrapper">
    <NForm ref="formRef" :model="model" :rules="rules" label-placement="left">
      <NGrid responsive="screen" item-responsive>
        <NFormItemGi span="24 s:12 m:6" :label="姓名" path="userName" class="pr-24px">
          <NInput v-model:value="model.userName" :placeholder="请输入姓名" />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="性别" path="userGender" class="pr-24px">
          <NSelect
            v-model:value="model.userGender"
            :placeholder="请选择性别"
            :options="translateOptions(userGenderOptions)"
            clearable
          />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="昵称" path="nickName" class="pr-24px">
          <NInput v-model:value="model.nickName" :placeholder="请输入昵称" />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="手机号" path="userPhone" class="pr-24px">
          <NInput v-model:value="model.userPhone" :placeholder="请输入手机号" />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="邮箱" path="userEmail" class="pr-24px">
          <NInput v-model:value="model.userEmail" :placeholder="请输入邮箱" />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="租户状态" path="userStatus" class="pr-24px">
          <NSelect
            v-model:value="model.status"
            :placeholder="请选择租户状态"
            :options="translateOptions(enableStatusOptions)"
            clearable
          />
        </NFormItemGi>
        <NFormItemGi span="24 s:12" class="pr-24px">
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
