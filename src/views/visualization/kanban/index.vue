<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, reactive, ref } from 'vue'
// import {useRouter} from 'vue-router';
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NModal,
  useMessage,
  NPopconfirm,
  NTooltip,
  NFlex,
  NPagination,
  NSelect
} from 'naive-ui'
import type { LastLevelRouteKey } from '@elegant-router/types' // 假设您已经定义好了这些API
import { DelBoard, PostBoard, PutBoard, getBoardList } from '@/service/api/index'
import { useRouterPush } from '@/hooks/common/router'
import { $t } from '@/locales'
import DevCardItem from '@/components/dev-card-item/index.vue'
const { routerPushByKey } = useRouterPush()
const message = useMessage()
const nameSearch = ref('')
const currentPage = ref(1)
const pageSize = ref(12) // 或根据你的实际需求来设置
const total = ref(0)
const boards = ref<Panel.Board[]>([])
const showModal = ref<boolean>(false)
const isEditMode = ref(false)
// 初始化表单数据
const formData = reactive({
  id: '',
  name: '',
  home_flag: 'N',
  description: ''
})

// 设置表单数据
const setFormData = data => {
  Object.assign(formData, data)
}

// 清除表单数据
const clearFormData = () => {
  setFormData({ id: '', name: '', home_flag: 'N', description: '' })
  isEditMode.value = false
}

const setupData = v => {
  boards.value = v
}
// 获取看板列表（过滤掉 vis_type 为 new_board 的数据）
const fetchBoards = async () => {
  const { data } = await getBoardList({ page: currentPage.value, page_size: pageSize.value, name: nameSearch.value })
  if (data && data.list) {
    const filtered = (data.list as Panel.Board[]).filter(item => item?.vis_type !== 'new_board')
    setupData(filtered)
    // 使用过滤后的数量，避免展示被过滤条目
    total.value = filtered.length
  }
}

// 提交表单
const submitForm = async () => {
  if (!formData.name) {
    message.error($t('custom.home.kanbanNameNull'))
    return
  }

  if (isEditMode.value) {
    await PutBoard(formData) // 编辑看板
  } else {
    await PostBoard(formData) // 新建看板
  }

  showModal.value = false
  clearFormData()
  await fetchBoards()
}

const editBoard = board => {
  setFormData({ ...board })
  isEditMode.value = true
  showModal.value = true
}

// 删除看板
const deleteBoard = async (id: string) => {
  await DelBoard(id) // 假设DelBoard接收看板的id
  await fetchBoards() // 刷新看板列表
}

// 取消操作
const handleCancel = () => {
  showModal.value = false
  clearFormData()
}

// 页面跳转
const goRouter = (name: LastLevelRouteKey, id: string) => {
  routerPushByKey(name, { query: { id } })
}
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})
onMounted(fetchBoards)
</script>

<template>
  <div>
    <NCard>
      <div class="m-b-20px flex flex-wrap items-center gap-15px">
        <!-- 新建按钮 -->
        <div class="flex-1">
          <NButton type="primary" @click="showModal = true">+{{ $t('dashboard_panel.addKanBan') }}</NButton>
        </div>
        <!-- 搜索部分 -->
        <div class="flex items-center gap-20px">
          <NInput
            v-model:value="nameSearch"
            clearable
            :placeholder="$t('generate.search-by-name')"
            @clear="
              () => {
                nameSearch = ''
                fetchBoards()
              }
            "
          />

          <NButton type="primary" @click="fetchBoards">{{ $t('common.search') }}</NButton>
        </div>
      </div>
      <!-- 看板列表 -->
      <NGrid x-gap="24" y-gap="16" cols="1 s:2 m:3 l:4" responsive="screen">
        <NGridItem
          v-for="board in boards"
          :key="board.id"
          @click="goRouter('visualization_kanban-details', board.id as string)"
        >
          <DevCardItem
            :title="board.name"
            :isStatus="false"
            @click-card="goRouter('visualization_kanban-details', board.id as string)"
          >
            <template #default>{{ board.description || '--' }}</template>
            <!-- 右上角首页图标 -->
            <template #top-right-icon>
              <div
                v-if="board.home_flag === 'Y'"
                class="h-24px w-24px border border-red-4 rounded-50 text-center text-12px text-red font-600 flex items-center justify-center"
              >
                {{ $t('generate.first') }}
              </div>
            </template>

            <!-- 左下角图标 -->
            <template #footer-icon>
              <div class="kanban-icon-container">
                <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
                  <rect x="10" y="20" width="80" height="50" rx="3" fill="none" stroke="#888" stroke-width="3"></rect>
                  <line x1="20" y1="35" x2="80" y2="35" stroke="#888" stroke-width="2"></line>
                  <line x1="20" y1="50" x2="60" y2="50" stroke="#888" stroke-width="2"></line>
                </svg>
              </div>
            </template>

            <!-- 右下角操作按钮 -->
            <template #footer>
              <div class="flex gap-2 justify-between">
                <NButton size="small" quaternary circle @click.stop="editBoard(board)">
                  <template #icon>
                    <icon-material-symbols:contract-edit-outline class="text-24px" color="#888" />
                  </template>
                </NButton>
                <NPopconfirm @positive-click="deleteBoard(board.id as string)">
                  <template #trigger>
                    <NButton size="small" quaternary circle @click.stop>
                      <template #icon>
                        <icon-material-symbols:delete-outline class="text-24px" color="#888" />
                      </template>
                    </NButton>
                  </template>
                  {{ $t('common.confirmDelete') }}
                </NPopconfirm>
              </div>
            </template>
          </DevCardItem>
        </NGridItem>
      </NGrid>
      <!-- 看板列表后面添加分页器 -->
      <div class="mt-4 h-60px w-full">
        <NFlex justify="end">
          <NPagination
            v-model:page="currentPage"
            :page-size="pageSize"
            :item-count="total"
            @update:page="fetchBoards"
          />
        </NFlex>
      </div>
    </NCard>
    <!-- 新建和编辑看板的模态框 -->
    <NModal
      v-model:show="showModal"
      :title="isEditMode ? $t('dashboard_panel.editKanban') : $t('dashboard_panel.addKanBan')"
      :class="getPlatform ? 'w-90%' : 'w-500px'"
    >
      <NCard bordered>
        <NForm :model="formData" class="flex-1">
          <NFormItem :label="$t('generate.dashboard-name')" path="name">
            <NInput v-model:value="formData.name" :placeholder="$t('generate.enter-dashboard-name')" />
          </NFormItem>
          <NFormItem :label="$t('generate.is-homepage')">
            <NSelect
              v-model:value="formData.home_flag"
              :options="[
                { label: $t('common.yesOrNo.yes'), value: 'Y' },
                { label: $t('common.yesOrNo.no'), value: 'N' }
              ]"
            />
          </NFormItem>
          <NFormItem :label="$t('device_template.table_header.description')">
            <NInput
              v-model:value="formData.description"
              type="textarea"
              :placeholder="$t('generate.enter-description')"
            />
          </NFormItem>
        </NForm>
        <template #footer>
          <div class="flex justify-end gap-2">
            <NButton type="default" @click="handleCancel">
              {{ $t('generate.cancel') }}
            </NButton>
            <n-popconfirm v-if="formData.home_flag === 'Y'" @positive-click="submitForm">
              <template #trigger>
                <NButton type="primary">{{ $t('common.save') }}</NButton>
              </template>
              {{ $t('custom.visualization.onlyOneHomepage') }}
            </n-popconfirm>
            <NButton v-if="formData.home_flag === 'N'" type="primary" @click="submitForm">
              {{ $t('common.save') }}
            </NButton>
          </div>
        </template>
      </NCard>
    </NModal>
  </div>
</template>

<style scoped>
.description {
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  text-wrap: wrap;
  flex: 1;
  /* 确保这是一个块级元素 */
  max-width: 100%;
  color: #666;
}
</style>
