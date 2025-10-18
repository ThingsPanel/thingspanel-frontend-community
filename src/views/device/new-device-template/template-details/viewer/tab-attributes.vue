<script setup lang="tsx">
/**
 * 属性Tab内容
 * 从 src/views/device/template/components/step/model-definition.vue 复制属性部分逻辑
 */

import { ref, onMounted, reactive, watch } from 'vue'
import { inject } from 'vue'
import type { Ref } from 'vue'
import { NDataTable, NButton, NPopconfirm, NSpace, NModal, NPagination } from 'naive-ui'
import { $t } from '@/locales'
import { attributesApi, delAttributes } from '@/service/api/system-data'
import { attribute } from '@/views/device/template/components/step/tableList'
import EditAttribute from './edit-attribute.vue'
import SvgIcon from '@/components/custom/svg-icon.vue'

const templateData = inject<Ref<any>>('templateData')!

const loading = ref(false)
const attributesList = ref<any[]>([])
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
  ...attribute.value,
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
 * 加载属性数据
 */
const loadData = async () => {
  // 🔥 严格验证：必须有有效的模板ID
  if (!templateData.value?.id || templateData.value.id === '') {
    return
  }

  loading.value = true

  try {
    queryParams.device_template_id = templateData.value.id
    const res: any = await attributesApi(queryParams)
    if (!res.error && res.data) {
      attributesList.value = res.data.list || []
      total.value = Math.ceil(res.data.total / queryParams.page_size)

      // 处理读写标志显示
      attributesList.value.forEach((item: any) => {
        if (item.read_write_flag === 'R' || item.read_write_flag === 'R-只读') {
          item.read_write_flag = $t('device_template.table_header.readOnly')
        } else if (item.read_write_flag === 'RW' || item.read_write_flag === 'RW-读/写') {
          item.read_write_flag = $t('device_template.table_header.readAndWrite')
        }
      })
    }
  } catch (error) {
    console.error('Failed to load attributes data:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 新增属性
 */
const handleAdd = () => {
  editingItem.value = {}
  showEditModal.value = true
}

/**
 * 编辑属性
 */
const handleEdit = (row: any) => {
  editingItem.value = { ...row }
  showEditModal.value = true
}

/**
 * 删除属性
 */
const handleDelete = async (id: string) => {
  await delAttributes(id)
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
 * 当父组件加载完模板数据后，自动加载属性数据
 */
watch(
  () => templateData.value?.id,
  newId => {
    if (newId) {
      loadData()
    }
  },
  { immediate: true }
)

onMounted(() => {
  // 数据加载由 watch 处理
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

    <NDataTable :columns="columns" :data="attributesList" :loading="loading" class="m-t9 flex-1-hidden" />

    <div class="mt-4 w-full flex justify-end">
      <NPagination :page-count="total" :page-size="queryParams.page_size" @update:page="handlePageChange" />
    </div>

    <!-- 编辑弹窗 -->
    <NModal
      v-model:show="showEditModal"
      :title="editingItem.id ? $t('common.edit') : $t('common.add')"
      preset="card"
      class="mw-600px w-50%"
    >
      <EditAttribute
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
