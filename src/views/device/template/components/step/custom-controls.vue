<script setup lang="tsx">
import { computed, defineProps, getCurrentInstance, nextTick, onMounted, reactive, ref } from 'vue'
import { NButton, NDataTable, NEmpty, NForm, NFormItem, NInput, NModal, NPagination, NPopconfirm, NTag } from 'naive-ui'
import CodeMirror from 'vue-codemirror6'
import { javascript } from '@codemirror/lang-javascript'
import { $t } from '@/locales'
import { useThemeStore } from '@/store/modules/theme'
import { isJSON } from '@/utils/common/tool'
import {
  deviceCustomControlAdd,
  deviceCustomControlDel,
  deviceCustomControlList,
  deviceCustomControlPut
} from '@/service/api/system-data'

const props = defineProps<{
  id: string
}>()

// 主题系统集成
const themeStore = useThemeStore()

const configFormRules = ref({
  name: {
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
    page_size: 100
  },
  formjson: {
    name: '',
    description: '',
    content: '{}',
    enable_status: 'disable'
  }
})
const getControlList = (page: number = 1) => {
  const queryjson = { ...commandjson.queryjson, page, device_template_id: props.id }
  deviceCustomControlList(queryjson).then(({ data }) => {
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
    name: '',
    description: '',
    content: '{}',
    enable_status: 'disable'
  }
  commandjson.configForm = !commandjson.configForm
}
const handleDeleteTable = async id => {
  const { error } = await deviceCustomControlDel(id)

  if (!error) {
    getControlList()
  }
}
const handleEditTable = (row: any) => {
  openCommandDialog()
  commandjson.formjson = row
}
const customControlTableThemeOverrides = {
  borderColor: 'var(--border-color)',
  borderRadius: '10px',
  fontSizeMedium: '14px',
  lineHeight: '1.5',
  thColor: 'var(--body-color)',
  thColorHover: 'var(--body-color)',
  thFontWeight: '400',
  thTextColor: 'var(--text-color)',
  tdColor: 'var(--card-color)',
  tdColorHover: 'var(--primary-color-suppl)',
  tdTextColor: 'var(--text-color)',
  thPaddingMedium: '12px',
  tdPaddingMedium: '13px 12px'
}

const customControlTableRowKey = (row: any) => row.id

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})
const columns: any = [
  {
    key: 'name',
    minWidth: '100px',
    title: $t('generate.btnname')
  },
  {
    key: 'content',
    minWidth: '100px',
    title: $t('generate.commandContent')
  },
  {
    key: 'enable_status',
    minWidth: '100px',
    title: $t('generate.enableStatus'),
    render: row => {
      if (row?.enable_status === 'enable') {
        return (
          <NTag type="success" size="small">
            {$t('page.manage.common.status.enable')}
          </NTag>
        )
      }
      return (
        <NTag type="warning" size="small">
          {$t('page.manage.common.status.disable')}
        </NTag>
      )
    }
  },
  {
    key: 'description',
    minWidth: '100px',
    title: $t('common.description')
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
  const params = { ...commandjson.formjson, device_template_id: props.id, control_type: 'telemetry' }
  e.preventDefault()
  configFormRef.value?.validate(async errors => {
    if (!errors && isJSON(commandjson.formjson?.content)) {
      const { error } = commandjson.formjson?.id
        ? await deviceCustomControlPut(params)
        : await deviceCustomControlAdd(params)
      if (!error) {
        openCommandDialog()
        getControlList()
      }
    }
  })
}

onMounted(() => {
  getControlList()
})
const validationJson = computed(() => {
  if (commandjson?.formjson?.content && !isJSON(commandjson.formjson.content)) {
    return 'error'
  }
  return undefined
})
const inputFeedback = computed(() => {
  if (commandjson?.formjson?.content && !isJSON(commandjson.formjson.content)) {
    return $t('generate.inputRightJson')
  }
  return ''
})
</script>

<template>
  <div class="p-t-20px">
    <div class="flex-align-end m-b-20px flex flex-justify-between">
      <div>{{ $t('generate.customControl') }}</div>
      <NButton class="justify-end" type="primary" @click="openCommandDialog">
        {{ $t('generate.addCustomCommand') }}
      </NButton>
    </div>
    <NDataTable
      :columns="columns"
      :data="commandjson.listData"
      class="custom-control-table flex-1-hidden"
      size="medium"
      :theme-overrides="customControlTableThemeOverrides"
      :bordered="true"
      :bottom-bordered="true"
      :single-column="false"
      :single-line="true"
      :striped="false"
      :scroll-x="760"
      :row-key="customControlTableRowKey"
    >
      <template #empty>
        <NEmpty size="small" :description="$t('common.noData')" />
      </template>
    </NDataTable>

    <div class="w-full flex justify-end">
      <NPagination
        :item-count="commandjson.total"
        :page-size="commandjson.queryjson.page_size"
        @update:page="getControlList"
      />
    </div>
    <NModal
      v-model:show="commandjson.configForm"
      :title="$t('generate.customCommand')"
      :class="getPlatform ? 'w-90%' : 'custom-control-modal'"
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
          <NFormItem :label="$t('generate.btnname')" path="name">
            <NInput v-model:value="commandjson.formjson.name" :placeholder="$t('generate.or-enter-here')" />
          </NFormItem>

          <NFormItem
            :label="$t('generate.commandContent')"
            path="content"
            :validation-status="validationJson"
            :feedback="inputFeedback"
          >
            <CodeMirror
              ref="cmRef"
              v-model="commandjson.formjson.content"
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
          <NFormItem :label="$t('generate.enableStatus')" path="enable_status">
            <n-switch
              v-model:value="commandjson.formjson.enable_status"
              checked-value="enable"
              unchecked-value="disable"
            />
          </NFormItem>
          <NFormItem :label="$t('common.description')" path="description">
            <NInput
              v-model:value="commandjson.formjson.description"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 6 }"
              :placeholder="$t('device_template.table_header.PleaseEnterADescription')"
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
.flex-align-end {
  align-items: flex-end;
}

.custom-control-modal {
  width: 800px;
  min-width: 600px;
}

.custom-control-table {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--card-color);

  :deep(.n-data-table-th) {
    color: var(--text-color);
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
  }

  :deep(.n-data-table-th),
  :deep(.n-data-table-td) {
    padding-left: 12px;
    padding-right: 12px;
  }

  :deep(.n-data-table-td) {
    color: var(--text-color);
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
  }

  :deep(.n-data-table-tr:not(.n-data-table-tr--summary):hover > .n-data-table-td) {
    background: rgb(239 246 255) !important;
    box-shadow:
      inset 0 1px 0 rgb(191 219 254 / 60%),
      inset 0 -1px 0 rgb(191 219 254 / 60%) !important;
  }
}
</style>
