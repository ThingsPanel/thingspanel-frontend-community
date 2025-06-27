<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useMessage } from 'naive-ui'
import type { FormInst, MessageReactive } from 'naive-ui'
import { useBoolean, useLoading } from '@sa/hooks'
import { editNotificationServices, fetchNotificationServicesEmail, sendTestEmail } from '@/service/api'
import { deepClone } from '@/utils/common/tool'
import { createRequiredFormRule } from '@/utils/form/rule'
import { $t } from '~/src/locales'

const { loading, startLoading, endLoading } = useLoading(false)
const { bool: visible, setTrue: openModal, setFalse: closeModal } = useBoolean()

const formModel = reactive<NotificationServices.Email>(createDefaultFormModel())

function setTableData(data: Api.NotificationServices.Email) {
  Object.assign(formModel, data)
  if (data.config !== 'null') {
    formModel.email_config = JSON.parse(data.config)
  }
}

async function getNotificationServices() {
  startLoading()
  const { data } = await fetchNotificationServicesEmail()
  if (data) {
    setTableData(data)
  }
  endLoading()
}

function createDefaultFormModel(): NotificationServices.Email {
  return {
    id: '',
    email_config: {},
    config: '',
    notice_type: 'EMAIL',
    status: 'OPEN',
    remark: ''
  }
}

const rules = {
  'email_config.host': createRequiredFormRule("请检查数值"),
  'email_config.port': createRequiredFormRule("请检查数值"),
  'email_config.from_email': createRequiredFormRule("请检查数值"),
  'email_config.from_password': createRequiredFormRule("请检查数值"),
  email: createRequiredFormRule("请检查数值"),
  body: createRequiredFormRule("请检查数值")
}
const formRef = ref<HTMLElement & FormInst>()
async function handleSubmit() {
  await formRef.value?.validate()
  startLoading()
  const formData = deepClone(formModel)
  delete formData.config
  const data: any = await editNotificationServices(formData)
  if (!data.error) {
    window.$message?.success('success')
    endLoading()
    await getNotificationServices()
  }
}

type FormModel = {
  body: string
  email: string
  header: string
}

const debugData = reactive<FormModel>({
  body: '',
  email: '',
  header: ''
})

function handleOpenModal() {
  Object.assign(debugData, {
    body: '',
    email: '',
    header: ''
  })
  openModal()
}

const message = useMessage()
const debugFormRef = ref<HTMLElement & FormInst>()
async function handleSend() {
  await debugFormRef.value?.validate()
  let messageReactive: MessageReactive | null = message.loading("修改成功", {
    duration: 100000
  })
  const data: any = await sendTestEmail(debugData)
  if (!data.error) {
    window.$message?.success('success')
  }
  if (messageReactive) {
    messageReactive.destroy()
    messageReactive = null
  }
  closeModal()
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
          :span="6"
          :label="发送邮件服务器"
          path="email_config.host"
        >
          <NInput v-model:value="formModel.email_config.host" />
        </NFormItemGridItem>
      </NGrid>
      <NGrid :cols="24">
        <NFormItemGridItem
          :span="6"
          :label="发送端口"
          path="email_config.port"
        >
          <NInputNumber v-model:value="formModel.email_config.port" />
        </NFormItemGridItem>
      </NGrid>
      <NGrid :cols="24">
        <NFormItemGridItem
          :span="6"
          :label="发送人邮件"
          path="email_config.from_email"
        >
          <NInput v-model:value="formModel.email_config.from_email" />
        </NFormItemGridItem>
      </NGrid>
      <NGrid :cols="24">
        <NFormItemGridItem
          :span="6"
          :label="授权码/密码"
          path="email_config.from_password"
        >
          <NInput v-model:value="formModel.email_config.from_password" />
        </NFormItemGridItem>
      </NGrid>
      <NGrid :cols="24">
        <NFormItemGridItem :span="6" :label="开启SSL" path="email_config.ssl">
          <n-checkbox v-model:checked="formModel.email_config.ssl"></n-checkbox>
        </NFormItemGridItem>
      </NGrid>
      <NGrid :cols="24">
        <NFormItemGridItem :span="6" :label="开启/关闭服务" path="status">
          <n-switch v-model:value="formModel.status" checked-value="OPEN" unchecked-value="CLOSE" />
        </NFormItemGridItem>
      </NGrid>
      <NGrid :cols="24">
        <NFormItemGridItem :span="24" class="mt-20px">
          <div class="w-120px"></div>
          <NButton class="w-72px" @click="handleOpenModal">
            {{ "调试" }}
          </NButton>
          <NButton class="ml-20px w-72px" type="primary" @click="handleSubmit">
            {{ "保存" }}
          </NButton>
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="start"></NSpace>
    </NForm>
  </NSpin>

  <NModal v-model:show="visible" preset="card" :title="调试" class="w-500px">
    <NForm ref="debugFormRef" label-placement="left" :label-width="120" :model="debugData" :rules="rules">
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem :span="24" :label="收件箱" path="email">
          <NInput v-model:value="debugData.email" placeholder=" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="消息内容" path="body">
          <NInput v-model:value="debugData.body" placeholder=" />
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="center">
        <NButton class="w-72px" type="primary" @click="handleSend">{{ "发送" }}</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style lang="scss"></style>
