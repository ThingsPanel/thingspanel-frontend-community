<script setup lang="ts">
/**
 * Ultra看板页面
 * 集成visual-editor组件的全新看板实现
 */

import { computed, getCurrentInstance, onMounted, reactive, ref } from 'vue'
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
  NSelect,
  NSpace
} from 'naive-ui'
import type { LastLevelRouteKey } from '@elegant-router/types'
import { DelBoard, PostBoard, PutBoard, getBoardList } from '@/service/api/index'
import { useRouterPush } from '@/hooks/common/router'
import { $t } from '@/locales'
import { useThemeStore } from '@/store/modules/theme'

// 路由和消息管理
const { routerPushByKey } = useRouterPush()
const message = useMessage()

// 主题系统集成
const themeStore = useThemeStore()

// 搜索和分页状态
const nameSearch = ref('')
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const boards = ref<Panel.Board[]>([])

// 模态框状态
const showModal = ref<boolean>(false)
const isEditMode = ref(false)

// 表单数据
const formData = reactive({
  id: '',
  name: '',
  home_flag: 'N',
  description: ''
})

/**
 * 设置表单数据
 * @param data 表单数据对象
 */
const setFormData = (data: any) => {
  Object.assign(formData, data)
}

/**
 * 清除表单数据并重置编辑状态
 */
const clearFormData = () => {
  setFormData({ id: '', name: '', home_flag: 'N', description: '' })
  isEditMode.value = false
}

/**
 * 设置看板数据
 * @param v 看板列表
 */
const setupData = (v: Panel.Board[]) => {
  boards.value = v
}

/**
 * 获取看板列表数据
 */
const fetchBoards = async () => {
  try {
    const { data } = await getBoardList({
      page: currentPage.value,
      page_size: pageSize.value,
      name: nameSearch.value
    })
    if (data && data.list) {
      setupData(data.list as Panel.Board[])
      total.value = data.total
    }
  } catch (error) {
    console.error('获取看板列表失败:', error)
    message.error($t('common.error'))
  }
}

/**
 * 提交表单数据（新建或编辑看板）
 */
const submitForm = async () => {
  if (!formData.name) {
    message.error($t('custom.home.kanbanNameNull'))
    return
  }

  try {
    if (isEditMode.value) {
      await PutBoard(formData)
      message.success($t('common.updateSuccess'))
    } else {
      await PostBoard(formData)
      message.success($t('common.addSuccess'))
    }

    showModal.value = false
    clearFormData()
    await fetchBoards()
  } catch (error) {
    console.error('保存看板失败:', error)
    message.error($t('common.saveError'))
  }
}

/**
 * 编辑看板
 * @param board 要编辑的看板对象
 */
const editBoard = (board: Panel.Board) => {
  setFormData({ ...board })
  isEditMode.value = true
  showModal.value = true
}

/**
 * 删除看板
 * @param id 看板ID
 */
const deleteBoard = async (id: string) => {
  try {
    await DelBoard(id)
    message.success($t('common.deleteSuccess'))
    await fetchBoards()
  } catch (error) {
    console.error('删除看板失败:', error)
    message.error($t('common.deleteError'))
  }
}

/**
 * 取消操作并关闭模态框
 */
const handleCancel = () => {
  showModal.value = false
  clearFormData()
}

/**
 * 路由跳转到看板详情页
 * @param name 路由名称
 * @param id 看板ID
 */
const goRouter = (name: LastLevelRouteKey, id: string) => {
  routerPushByKey(name, { query: { id } })
}

/**
 * 获取平台类型（用于响应式设计）
 */
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})

// 页面初始化
onMounted(fetchBoards)
</script>

<template>
  <div class="ultra-kanban-container">
    <NCard>
      <!-- 操作工具栏 -->
      <div class="m-b-20px flex flex-wrap items-center gap-15px">
        <!-- 新建按钮区域 -->
        <div class="flex-1">
          <NButton type="primary" @click="showModal = true">+{{ $t('dashboard_panel.addKanBan') }}</NButton>
        </div>

        <!-- 搜索操作区域 -->
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
          <NButton type="primary" @click="fetchBoards">
            {{ $t('common.search') }}
          </NButton>
        </div>
      </div>

      <!-- 看板网格列表 -->
      <NGrid x-gap="24" y-gap="16" cols="1 s:2 m:3 l:4" responsive="screen">
        <NGridItem
          v-for="board in boards"
          :key="board.id"
          @click="goRouter('ultra-kanban_kanban-details', board.id as string)"
        >
          <NCard
            hoverable
            style="height: 180px"
            content-style="display: flex; flex-direction: column; height: 100%; gap: 8px;"
            class="ultra-kanban-card"
          >
            <!-- 看板标题和首页标识 -->
            <div class="flex justify-between items-start">
              <div class="text-16px font-600 text-primary">
                {{ board.name }}
              </div>
              <div v-if="board.home_flag === 'Y'" class="home-badge">
                {{ $t('generate.first') }}
              </div>
            </div>

            <!-- 看板描述信息 -->
            <NTooltip
              trigger="hover"
              :disabled="!board.description || !board.description.trim()"
              placement="top-start"
              :style="{ maxWidth: '200px' }"
            >
              <template #trigger>
                <div class="description-text">{{ board.description || $t('common.noDescription') }}</div>
              </template>
              {{ board.description }}
            </NTooltip>

            <!-- 操作按钮区域 -->
            <div class="flex justify-end gap-8px mt-auto">
              <!-- 编辑按钮 -->
              <NButton strong circle secondary @click.stop="editBoard(board)">
                <template #icon>
                  <icon-material-symbols:contract-edit-outline class="text-20px text-blue" />
                </template>
              </NButton>

              <!-- 删除按钮 -->
              <NPopconfirm @positive-click="deleteBoard(board.id as string)">
                <template #trigger>
                  <NButton strong secondary circle @click.stop>
                    <template #icon>
                      <icon-material-symbols:delete-outline class="text-20px text-red" />
                    </template>
                  </NButton>
                </template>
                {{ $t('common.confirmDelete') }}
              </NPopconfirm>
            </div>
          </NCard>
        </NGridItem>
      </NGrid>

      <!-- 分页器 -->
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

    <!-- 新建/编辑看板模态框 -->
    <NModal
      v-model:show="showModal"
      :title="isEditMode ? $t('dashboard_panel.editKanban') : $t('dashboard_panel.addKanBan')"
      :class="getPlatform ? 'w-90%' : 'w-500px'"
    >
      <NCard bordered>
        <NForm :model="formData" class="flex-1">
          <!-- 看板名称 -->
          <NFormItem :label="$t('generate.dashboard-name')" path="name">
            <NInput v-model:value="formData.name" :placeholder="$t('generate.enter-dashboard-name')" />
          </NFormItem>

          <!-- 是否首页 -->
          <NFormItem :label="$t('generate.is-homepage')">
            <NSelect
              v-model:value="formData.home_flag"
              :options="[
                { label: $t('common.yesOrNo.yes'), value: 'Y' },
                { label: $t('common.yesOrNo.no'), value: 'N' }
              ]"
            />
          </NFormItem>

          <!-- 描述信息 -->
          <NFormItem :label="$t('device_template.table_header.description')">
            <NInput
              v-model:value="formData.description"
              type="textarea"
              :placeholder="$t('generate.enter-description')"
            />
          </NFormItem>
        </NForm>

        <!-- 模态框底部操作按钮 -->
        <template #footer>
          <div class="flex justify-end gap-2">
            <NButton type="default" @click="handleCancel">
              {{ $t('generate.cancel') }}
            </NButton>

            <!-- 设为首页时的确认提示 -->
            <NPopconfirm v-if="formData.home_flag === 'Y'" @positive-click="submitForm">
              <template #trigger>
                <NButton type="primary">{{ $t('common.save') }}</NButton>
              </template>
              {{ $t('custom.visualization.onlyOneHomepage') }}
            </NPopconfirm>

            <!-- 普通保存按钮 -->
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
/* Ultra看板容器样式 */
.ultra-kanban-container {
  width: 100%;
  height: 100%;
}

/* 看板卡片样式 */
.ultra-kanban-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
}

.ultra-kanban-card:hover {
  box-shadow: var(--box-shadow);
  border-color: var(--primary-color);
}

/* 首页标识徽章 */
.home-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -4px;
  margin-top: -2px;
  height: 24px;
  width: 24px;
  border: 1px solid var(--error-color);
  border-radius: 50%;
  text-align: center;
  font-size: 12px;
  color: var(--error-color);
  font-weight: 600;
  background-color: var(--card-color);
}

/* 描述文本样式 */
.description-text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  text-wrap: wrap;
  flex: 1;
  max-width: 100%;
  color: var(--text-color-2);
  line-height: 1.4;
  font-size: 14px;
}

/* 主要文本颜色 */
.text-primary {
  color: var(--primary-color);
}

/* 响应主题变化 */
[data-theme='dark'] .ultra-kanban-card {
  background-color: var(--card-color);
}

[data-theme='dark'] .home-badge {
  background-color: var(--modal-color);
}
</style>
