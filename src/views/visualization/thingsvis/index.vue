<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NButton,
  NCard,
  NGrid,
  NGridItem,
  NInput,
  NModal,
  NForm,
  NFormItem,
  NPopconfirm,
  NEmpty,
  NSpin,
  useMessage
} from 'naive-ui'
import { useRouterPush } from '@/hooks/common/router'
import { $t } from '@/locales'
import {
  getThingsVisProjects,
  createThingsVisProject,
  updateThingsVisProject,
  deleteThingsVisProject,
  type ProjectListItem
} from '@/service/api/thingsvis'

const { routerPushByKey } = useRouterPush()
const message = useMessage()

// 状态
const loading = ref(false)
const projects = ref<ProjectListItem[]>([])
const showModal = ref(false)
const editingProject = ref<ProjectListItem | null>(null)
const searchKeyword = ref('')

// 表单数据
const formData = ref({
  name: '',
  description: ''
})

/** 获取项目列表 */
const fetchProjects = async () => {
  loading.value = true
  try {
    const { data, error } = await getThingsVisProjects({ page: 1, limit: 100 })
    if (!error && data) {
      // 客户端搜索过滤
      let list = data.data
      if (searchKeyword.value) {
        list = list.filter(item =>
          item.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
        )
      }
      projects.value = list
    } else if (error) {
      message.error('加载项目失败')
    }
  } finally {
    loading.value = false
  }
}

/** 打开新建弹窗 */
const openCreateModal = () => {
  editingProject.value = null
  formData.value = { name: '', description: '' }
  showModal.value = true
}

/** 打开编辑弹窗 */
const openEditModal = (project: ProjectListItem) => {
  editingProject.value = project
  formData.value = {
    name: project.name,
    description: project.description || ''
  }
  showModal.value = true
}

/** 保存项目(新建/编辑) */
const handleSaveProject = async () => {
  if (!formData.value.name.trim()) {
    message.error('请输入项目名称')
    return
  }

  try {
    if (editingProject.value) {
      // 编辑
      const { error } = await updateThingsVisProject(editingProject.value.id, {
        name: formData.value.name,
        description: formData.value.description || null
      })
      if (!error) {
        message.success('更新成功')
        showModal.value = false
        await fetchProjects()
      } else {
        message.error('更新失败')
      }
    } else {
      // 新建
      const { error } = await createThingsVisProject({
        name: formData.value.name,
        description: formData.value.description || undefined
      })
      if (!error) {
        message.success('创建成功')
        showModal.value = false
        formData.value = { name: '', description: '' }
        await fetchProjects()
      } else {
        message.error('创建失败')
      }
    }
  } catch (e) {
    message.error('操作失败')
    console.error(e)
  }
}

/** 删除项目 */
const handleDeleteProject = async (id: string, name: string) => {
  try {
    const { error } = await deleteThingsVisProject(id)
    if (!error) {
      message.success(`已删除项目: ${name}`)
      await fetchProjects()
    } else {
      message.error('删除失败')
    }
  } catch (e) {
    message.error('删除失败')
    console.error(e)
  }
}

/** 进入项目(查看 Dashboards) */
const enterProject = (projectId: string) => {
  routerPushByKey('visualization_thingsvis-dashboards', { query: { projectId } })
}

onMounted(() => {
  fetchProjects()
})
</script>

<template>
  <div class="h-full">
    <NCard>
      <!-- 头部工具栏 -->
      <div class="mb-5 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-bold">可视化项目</h2>
          <span class="text-gray-400">{{ projects.length }} 个项目</span>
        </div>

        <div class="flex items-center gap-3">
          <!-- 搜索框 -->
          <NInput
            v-model:value="searchKeyword"
            clearable
            placeholder="搜索项目名称..."
            style="width: 240px"
            @update:value="fetchProjects"
            @clear="fetchProjects"
          >
            <template #prefix>
              <icon-mdi:magnify />
            </template>
          </NInput>

          <!-- 新建按钮 -->
          <NButton type="primary" @click="openCreateModal">
            <template #icon>
              <icon-mdi:plus />
            </template>
            新建项目
          </NButton>
        </div>
      </div>

      <!-- 加载状态 -->
      <NSpin :show="loading">
        <!-- 空状态 -->
        <NEmpty
          v-if="!loading && projects.length === 0"
          description="暂无项目，点击上方按钮创建第一个项目"
          class="py-20"
        >
          <template #icon>
            <icon-mdi:folder-open-outline class="text-50px text-gray-300" />
          </template>
        </NEmpty>

        <!-- 项目网格 -->
        <NGrid v-else x-gap="24" y-gap="24" cols="1 s:2 m:3 l:4" responsive="screen">
          <NGridItem v-for="project in projects" :key="project.id">
            <!-- 项目卡片 -->
            <div
              class="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:border-primary hover:shadow-lg"
              @click="enterProject(project.id)"
            >
              <!-- 卡片内容 -->
              <div class="p-5">
                <!-- 顶部:图标和操作按钮 -->
                <div class="mb-3 flex items-start justify-between">
                  <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <icon-mdi:folder class="text-24px text-primary" />
                  </div>

                  <!-- 操作按钮(悬停显示) -->
                  <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <NButton
                      size="small"
                      quaternary
                      circle
                      @click.stop="openEditModal(project)"
                    >
                      <template #icon>
                        <icon-mdi:pencil class="text-16px" />
                      </template>
                    </NButton>

                    <NPopconfirm
                      @positive-click.stop="handleDeleteProject(project.id, project.name)"
                    >
                      <template #trigger>
                        <NButton size="small" quaternary circle @click.stop>
                          <template #icon>
                            <icon-mdi:delete class="text-16px" />
                          </template>
                        </NButton>
                      </template>
                      确定删除项目"{{ project.name }}"吗？
                    </NPopconfirm>
                  </div>
                </div>

                <!-- 项目名称 -->
                <h3 class="mb-2 truncate text-lg font-semibold">
                  {{ project.name }}
                </h3>

                <!-- 项目描述 -->
                <p class="mb-4 line-clamp-2 h-10 text-sm text-gray-500">
                  {{ project.description || '暂无描述' }}
                </p>

                <!-- 底部信息 -->
                <div class="flex items-center justify-between text-xs text-gray-400">
                  <div class="flex items-center gap-1">
                    <icon-mdi:chart-box-outline />
                    <span>{{ project._count?.dashboards || 0 }} 个仪表盘</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <icon-mdi:clock-outline />
                    <span>{{ new Date(project.updatedAt).toLocaleDateString() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </NGridItem>
        </NGrid>
      </NSpin>
    </NCard>

    <!-- 新建/编辑弹窗 -->
    <NModal
      v-model:show="showModal"
      preset="card"
      :title="editingProject ? '编辑项目' : '新建项目'"
      class="w-500px"
    >
      <NForm :model="formData">
        <NFormItem label="项目名称" path="name">
          <NInput
            v-model:value="formData.name"
            placeholder="请输入项目名称"
            maxlength="50"
            show-count
          />
        </NFormItem>

        <NFormItem label="项目描述">
          <NInput
            v-model:value="formData.description"
            type="textarea"
            placeholder="请输入项目描述(可选)"
            :rows="4"
            maxlength="200"
            show-count
          />
        </NFormItem>
      </NForm>

      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" @click="handleSaveProject">
            {{ editingProject ? '更新' : '创建' }}
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
