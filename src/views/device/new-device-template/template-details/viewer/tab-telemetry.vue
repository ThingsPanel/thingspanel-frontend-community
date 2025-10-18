<script setup lang="tsx">
/**
 * 遥测Tab内容
 * 从 src/views/device/template/components/step/model-definition.vue 复制遥测部分逻辑
 */

import { ref, onMounted, reactive, watch } from 'vue'
import { inject } from 'vue'
import type { Ref } from 'vue'
import { NDataTable, NSpin, NButton, NPopconfirm, NSpace, NModal, NPagination } from 'naive-ui'
import { $t } from '@/locales'
import { telemetryApi, delTelemetry } from '@/service/api/system-data'
import { test } from '@/views/device/template/components/step/tableList'
import EditTelemetry from './edit-telemetry.vue'
import SvgIcon from '@/components/custom/svg-icon.vue'
import CustomControls from '@/views/device/template/components/step/custom-controls.vue'

const templateData = inject<Ref<any>>('templateData')!

const loading = ref(false)
const telemetryList = ref<any[]>([])
const total = ref(0)

// 分页参数
const queryParams = reactive({
  page: 1,
  page_size: 5,
  device_template_id: ''
})

// 编辑弹窗
const showEditModal = ref(false)
const editingItem = ref<any>({})

// 表格列配置
const columns: any = [
  ...test.value,
  {
    key: 'actions',
    width: 350,
    title: () => $t('common.actions'),
    align: 'center',
    render: row => {
      return (
        <NSpace justify={'center'}>
          <NButton quaternary type="primary" size={'small'} onClick={() => handleEdit(row)}>
            {$t('common.edit')}
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton quaternary type="primary" size={'small'}>
                  {$t('common.delete')}
                </NButton>
              )
            }}
          </NPopconfirm>
        </NSpace>
      )
    }
  }
]

/**
 * 加载遥测数据
 */
const loadData = async () => {
  // 🔥 严格验证：必须有有效的模板ID
  if (!templateData.value?.id || templateData.value.id === '') {
    return
  }

  loading.value = true

  try {
    queryParams.device_template_id = templateData.value.id
    const res: any = await telemetryApi(queryParams)
    if (!res.error && res.data) {
      telemetryList.value = res.data.list || []
      total.value = Math.ceil(res.data.total / queryParams.page_size)

      // 处理读写标志显示
      telemetryList.value.forEach((item: any) => {
        if (item.read_write_flag === 'R' || item.read_write_flag === 'R-只读') {
          item.read_write_flag = $t('device_template.table_header.readOnly')
        } else if (item.read_write_flag === 'RW' || item.read_write_flag === 'RW-读/写') {
          item.read_write_flag = $t('device_template.table_header.readAndWrite')
        }
      })
    }
  } catch (error) {
    console.error('Failed to load telemetry data:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 新增遥测
 */
const handleAdd = () => {
  editingItem.value = {}
  showEditModal.value = true
}

/**
 * 编辑遥测
 */
const handleEdit = (row: any) => {
  editingItem.value = { ...row }
  showEditModal.value = true
}

/**
 * 删除遥测
 */
const handleDelete = async (id: string) => {
  await delTelemetry(id)
  window.$message?.success($t('common.deleteSuccess'))
  loadData()
}

/**
 * 编辑成功回调
 */
const handleEditSuccess = () => {
  showEditModal.value = false
  editingItem.value = {}
  loadData()
}

/**
 * 取消编辑
 */
const handleEditCancel = () => {
  showEditModal.value = false
  editingItem.value = {}
}

/**
 * 分页变化
 */
const handlePageChange = (page: number) => {
  queryParams.page = page
  loadData()
}

/**
 * 🔥 监听 templateData 变化
 * 当父组件加载完模板数据后，自动加载遥测数据
 */
watch(
  () => templateData.value?.id,
  newId => {
    if (newId) {
      loadData()
    }
  },
  { immediate: true } // 立即执行一次
)

// 🔥 移除 onMounted 中的 loadData()，改为通过 watch 触发
onMounted(() => {
  // 不再在这里调用 loadData()，交给 watch 处理
})
</script>

<template>
  <div class="tab-content">
    <NButton type="primary" class="addBtn" @click="handleAdd">
      <template #icon>
        <SvgIcon local-icon="add" class="more" />
      </template>
      {{ $t('device_template.add') }}
    </NButton>

    <NDataTable :columns="columns" :data="telemetryList" :loading="loading" class="m-t9 flex-1-hidden" />

    <div class="mt-4 w-full flex justify-end">
      <NPagination :page-count="total" :page-size="queryParams.page_size" @update:page="handlePageChange" />
    </div>

    <!-- 自定义控制 -->
    <CustomControls :id="templateData?.id || ''" />

    <!-- 编辑弹窗 -->
    <NModal
      v-model:show="showEditModal"
      :title="editingItem.id ? $t('common.edit') : $t('common.add')"
      preset="card"
      class="mw-600px w-50%"
    >
      <EditTelemetry
        :device-template-id="templateData?.id || ''"
        :edit-item="editingItem"
        @success="handleEditSuccess"
        @cancel="handleEditCancel"
      />
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.tab-content {
  padding: 20px 0;
  min-height: 300px;
  position: relative;
}

.addBtn {
  position: absolute;
  right: 0;
  top: 0.5rem;
}

.mw-600px {
  min-width: 600px !important;
}
</style>
