<script setup lang="tsx">
import { computed, defineProps, getCurrentInstance, nextTick, onMounted, reactive, ref } from 'vue'
import { NButton, NDataTable, NForm, NFormItem, NInput, NModal, NPagination, NPopconfirm, NTag } from 'naive-ui'
import CodeMirror from 'vue-codemirror6'
import { javascript } from '@codemirror/lang-javascript'
import { $t } from '@/locales'
import { useThemeStore } from '@/store/modules/theme'
import {
  deviceCustomCommandsAdd,
  deviceCustomCommandsDel,
  deviceCustomCommandsList,
  deviceCustomCommandsPut
} from '@/service/api/system-data'

const props = defineProps<{
  id: string
}>()

// 主题系统集成
const themeStore = useThemeStore()

const configFormRules = ref({
  data_identifier: {
    required: true,
    message: $t('device_template.table_header.commandIdentifier'),
    trigger: 'blur'
  },
  buttom_name: {
    required: true,
    message: $t('generate.btnname'),
    trigger: 'blur'
  }
})

const commandjson: any = reactive({
  configForm: false,
  listData: [],
  total: 0,
  queryjson: {
    page: 1,
    page_size: 4
  },
  formjson: {
    buttom_name: '',
    data_identifier: '',
    description: '',
    instruct: '{}',
    enable_status: 'disable'
  }
})
const getCommandList = (page: number = 1) => {
  const queryjson = { ...commandjson.queryjson, page, device_template_id: props.id }
  deviceCustomCommandsList(queryjson).then(({ data }) => {
    commandjson.listData = data.list || []
    commandjson.total = data.total
  })
}
const cmRef = ref()

const setupEditor = () => {
  nextTick(() => {
    // CodeMirror 6 会自动处理，不需要手动聚焦
  })
}
const openCommandDialog = () => {
  commandjson.formjson = {
    buttom_name: '',
    data_identifier: '',
    description: '',
    instruct: '{}',
    enable_status: 'disable'
  }
  commandjson.configForm = !commandjson.configForm
}
const handleDeleteTable = async id => {
  const { error } = await deviceCustomCommandsDel(id)

  if (!error) {
    getCommandList()
  }
}
const handleEditTable = (row: any) => {
  openCommandDialog()
  commandjson.formjson = row
}
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})
const columns: any = [
  {
    key: 'buttom_name',
    minWidth: '100px',
    title: $t('generate.btnname')
  },

  {
    key: 'data_identifier',
    minWidth: '100px',
    title: $t('device_template.table_header.commandIdentifier')
  },
  {
    key: 'instruct',
    minWidth: '100px',
    title: $t('generate.commandConetnt')
  },
  {
    key: 'description',
    minWidth: '100px',
    title: $t('device_template.table_header.commandDescription')
  },
  {
    key: 'enable_status',
    minWidth: '100px',
    title: $t('generate.status'),
    render: row => {
      if (row?.enable_status === 'enable') {
        return <NTag type="success">{$t('page.manage.common.status.enable')}</NTag>
      }
      return <NTag type="warning">{$t('page.manage.common.status.disable')}</NTag>
    }
  },
  {
    key: 'actions',
    minWidth: '100px',
    title: $t('page.product.list.operate'),
    align: 'center',
    render: row => {
      return (
        <div class="flex gap-20px flex-justify-center">
          <NButton size={'small'} type="primary" onClick={() => handleEditTable(row)}>
            {$t('common.edit')}
          </NButton>

          <NPopconfirm onPositiveClick={() => handleDeleteTable(row.id)}>
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton type="error" size={'small'}>
                  {$t('common.delete')}
                </NButton>
              )
            }}
          </NPopconfirm>
        </div>
      )
    }
  }
]
const configFormRef = ref()
const onCommandSubmit = async e => {
  const params = { ...commandjson.formjson, device_template_id: props.id }
  e.preventDefault()
  configFormRef.value?.validate(async errors => {
    if (!errors) {
      const { error } = commandjson.formjson?.id
        ? await deviceCustomCommandsPut(params)
        : await deviceCustomCommandsAdd(params)
      if (!error) {
        openCommandDialog()
        getCommandList()
      }
    }
  })
}

onMounted(() => {
  getCommandList()
})
</script>

<template>
  <div class="p-t-20px">
    <div class="m-b-20px flex flex-justify-end">
      <NButton class="justify-end" type="primary" @click="openCommandDialog">
        {{ $t('generate.addCustomCommand') }}
      </NButton>
    </div>
    <NDataTable :columns="columns" :data="commandjson.listData" class="flex-1-hidden" />

    <div class="w-full flex justify-end">
      <NPagination
        :item-count="commandjson.total"
        :page-size="commandjson.queryjson.page_size"
        @update:page="getCommandList"
      />
    </div>
    <NModal
      v-model:show="commandjson.configForm"
      :title="$t('generate.customCommand')"
      :class="getPlatform ? 'w-90%' : 'custom-command-modal'"
      @after-enter="setupEditor"
    >
      <n-card>
        <NForm
          ref="configFormRef"
          :model="commandjson.formjson"
          label-placement="left"
          class="flex-wrap"
          :rules="configFormRules"
          label-width="120px"
        >
          <NFormItem :label="$t('generate.btnname')" path="buttom_name">
            <NInput v-model:value="commandjson.formjson.buttom_name" :placeholder="$t('generate.or-enter-here')" />
          </NFormItem>
          <NFormItem :label="$t('device_template.table_header.commandIdentifier')" path="data_identifier">
            <NInput v-model:value="commandjson.formjson.data_identifier" :placeholder="$t('generate.or-enter-here')" />
          </NFormItem>
          <NFormItem :label="$t('generate.commandConetnt')" path="instruct">
            <CodeMirror
              ref="cmRef"
              v-model="commandjson.formjson.instruct"
              basic
              :dark="themeStore.darkMode"
              :lang="javascript()"
              :style="{
                width: '100%',
                height: '200px',
                border: '1px solid var(--n-border-color)',
                borderRadius: 'var(--n-border-radius)'
              }"
              :placeholder="$t('generate.enter-json-format')"
            />
          </NFormItem>
          <NFormItem :label="$t('device_template.table_header.commandDescription')" path="description">
            <NInput
              v-model:value="commandjson.formjson.description"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 6 }"
              :placeholder="$t('device_template.table_header.PleaseEnterADescription')"
            />
          </NFormItem>
          <NFormItem :label="$t('generate.status')" path="enable_status">
            <n-switch
              v-model:value="commandjson.formjson.enable_status"
              checked-value="enable"
              unchecked-value="disable"
            />
          </NFormItem>

          <NFlex justify="end">
            <NButton @click="openCommandDialog">{{ $t('generate.cancel') }}</NButton>
            <NButton type="primary" @click="onCommandSubmit">{{ $t('custom.groupPage.confirm') }}</NButton>
          </NFlex>
        </NForm>
      </n-card>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.custom-command-modal {
  width: 800px;
  min-width: 600px;
}
</style>
