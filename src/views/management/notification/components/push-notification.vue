<script lang="ts" setup>
import { reactive, ref } from 'vue'
import type { FormInst } from 'naive-ui'
import { useLoading } from '@sa/hooks'
import { createRequiredFormRule } from '@/utils/form/rule'
import { deepClone } from '@/utils/common/tool'
import { editPushNotificationServices, fetchPushNotificationServices } from '@/service/api'
import { $t } from '~/src/locales'

const { loading, startLoading, endLoading } = useLoading(false)

const formModel = reactive<NotificationServices.PushNotification>(createDefaultFormModel())

function setTableData(data: Api.NotificationServices.PushNotification) {
  Object.assign(formModel, data)
  if (data.pushServer !== 'null') {
    formModel.pushServer = JSON.parse(data.pushServer)
  }
}

async function getNotificationServices() {
  startLoading()
  const { data } = await fetchPushNotificationServices()
  if (data) {
    setTableData(data)
  }
  endLoading()
}

function createDefaultFormModel(): NotificationServices.PushNotification {
  return {
    pushServer: ''
  }
}

const rules = {
  pushServer: createRequiredFormRule($t('common.pleaseCheckValue'))
}
const formRef = ref<HTMLElement & FormInst>()
async function handleSubmit() {
  await formRef.value?.validate()
  startLoading()
  const formData = deepClone(formModel)
  delete formData.config
  const data: any = await editPushNotificationServices(formData)
  if (!data.error) {
    window.$message?.success('success')
    endLoading()
    await getNotificationServices()
  }
}

function init() {
  getNotificationServices()
}

init()
</script>

<template>
  <NSpin :show="loading">
    <NForm ref="formRef" label-placement="left" :label-width="130" :model="formModel" :rules="rules">
      <NGrid :cols="24">
        <NFormItemGridItem
          :span="14"
          :label="$t('page.manage.notification.pushNotification.pushServer')"
          path="pushNotification.pushServer"
        >
          <NInput v-model:value="formModel.pushServer" />
        </NFormItemGridItem>
      </NGrid>
      <NGrid :cols="24">
        <NFormItemGridItem :span="24" class="mt-20px">
          <div class="w-120px"></div>
          <NButton class="ml-20px w-72px" type="primary" @click="handleSubmit">
            {{ $t('common.save') }}
          </NButton>
        </NFormItemGridItem>
      </NGrid>
    </NForm>
  </NSpin>
</template>

<style lang="scss"></style>
