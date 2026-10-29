<script lang="ts" setup>
import { computed, getCurrentInstance, ref } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import {
  createDeviceGroupOperationKey,
  deviceGroupNative,
  DeviceGroupNativeError,
  type GroupTreeNode
} from '@/service/api/device-group-native'
import {
  acceptDeviceGroupEditorReload,
  advanceDeviceGroupEditorVersion,
  canManageDeviceGroups,
  canSubmitDeviceGroupEditor,
  createDeviceGroupEditorState,
  initialParentSelection,
  markDeviceGroupEditorConflict,
  ROOT_DEVICE_GROUP_SELECTION,
  type DeviceGroupEditorDraft,
  type DeviceGroupEditorState
} from '@/service/api/device-group-editor-state'
import { $t } from '@/locales'
import { useAuthStore } from '@/store/modules/auth'

const showModal = ref<boolean>(false)
defineExpose({ showModal })

// Props received from parent component
interface Props {
  isPidNoEdit?: boolean
  isEdit?: boolean
  editData?: {
    id: string
    parent_id: string
    name: string
    description: string
  }
  refreshData: () => void | Promise<void>
}

const props = defineProps<Props>()
const authStore = useAuthStore()
const canManageGroups = computed(() => canManageDeviceGroups(authStore.userInfo.roles))
// const message = useMessage();
const formRef = ref<HTMLElement & FormInst>()
const formItem = ref({
  id: '',
  parentId: ROOT_DEVICE_GROUP_SELECTION,
  name: '',
  description: ''
})

interface TreeOption {
  id: string
  name: string
  children?: TreeOption[]
  disabled?: boolean
}

const options = ref<TreeOption[]>([])
const loading = ref(false)
const saving = ref(false)
const editorState = ref<DeviceGroupEditorState | null>(null)
const pendingSubmission = ref<{ fingerprint: string; key: string } | null>(null)
const hasEditConflict = computed(() => Boolean(editorState.value?.conflict))

// Form validation rules
const rules: FormRules = {
  parentId: {
    required: true,
    trigger: ['blur', 'input'],
    message: $t('custom.groupPage.selectParentGroup')
  },
  name: {
    required: true,
    trigger: ['blur', 'input'],
    message: $t('custom.groupPage.enterGroupName')
  }
}

function descendantsOf(nodes: GroupTreeNode[], target: string, found = false): Set<string> {
  const descendants = new Set<string>()
  for (const node of nodes) {
    const inTarget = found || node.group.id === target
    if (inTarget) descendants.add(node.group.id)
    for (const child of node.children) {
      for (const id of descendantsOf([child], target, inTarget)) descendants.add(id)
    }
  }
  return descendants
}

function toOptions(nodes: GroupTreeNode[], disabledIds: Set<string>): TreeOption[] {
  return nodes.map(node => ({
    id: node.group.id,
    name: node.group.name,
    disabled: disabledIds.has(node.group.id),
    children: toOptions(node.children, disabledIds)
  }))
}

const getOptions = async () => {
  loading.value = true
  try {
    const [tree, current] = await Promise.all([
      deviceGroupNative.tree(32),
      props.isEdit && props.editData?.id ? deviceGroupNative.get(props.editData.id) : Promise.resolve(null)
    ])
    const disabledIds = current ? descendantsOf(tree.nodes, current.group.id) : new Set<string>()
    options.value = [
      {
        id: ROOT_DEVICE_GROUP_SELECTION,
        name: $t('custom.groupPage.group'),
        children: toOptions(tree.nodes, disabledIds)
      }
    ]
    if (current) {
      editorState.value = createDeviceGroupEditorState(current)
      formItem.value = {
        id: current.group.id,
        parentId: current.group.parentId ?? ROOT_DEVICE_GROUP_SELECTION,
        name: current.group.name,
        description: current.group.description ?? ''
      }
      pendingSubmission.value = null
    } else {
      editorState.value = null
      if (!props.isEdit) {
        formItem.value = {
          id: '',
          parentId: initialParentSelection(props.editData?.parent_id),
          name: '',
          description: ''
        }
      }
    }
  } catch (error) {
    window.$message?.error(error instanceof Error ? error.message : $t('common.fetchDataFailed'))
  } finally {
    loading.value = false
  }
}

function operationKey(fingerprint: string): string {
  if (pendingSubmission.value?.fingerprint === fingerprint) return pendingSubmission.value.key
  const key = createDeviceGroupOperationKey()
  pendingSubmission.value = { fingerprint, key }
  return key
}

function parentId(): string | null {
  return formItem.value.parentId === ROOT_DEVICE_GROUP_SELECTION ? null : formItem.value.parentId
}

const handleSubmit = async () => {
  if (saving.value || loading.value) return
  if (!canManageGroups.value) {
    window.$message?.error('只有租户管理员可以修改分组。')
    return
  }
  if (props.isEdit && !canSubmitDeviceGroupEditor(editorState.value)) return
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  saving.value = true
  const description = formItem.value.description === '' ? null : formItem.value.description
  try {
    if (!props.isEdit) {
      const body = {
        name: formItem.value.name,
        description,
        parentId: parentId(),
        sortOrder: 0
      }
      const key = operationKey(JSON.stringify({ mode: 'create', body }))
      await deviceGroupNative.create(body, key)
    } else {
      const state = editorState.value
      const current = state?.current
      if (!current) throw new Error('Cannot edit this group until its current version is loaded')
      const patch: { name?: string; description?: string | null } = {}
      if (formItem.value.name !== current.group.name) patch.name = formItem.value.name
      if (description !== current.group.description) patch.description = description
      const nextParent = parentId()
      const needsMove = nextParent !== current.group.parentId
      const fingerprint = JSON.stringify({
        mode: 'edit',
        id: current.group.id,
        name: formItem.value.name,
        description,
        nextParent
      })
      const key = operationKey(fingerprint)
      let latest = current.group
      if (Object.keys(patch).length > 0) {
        const result = await deviceGroupNative.update(current.group.id, patch, current.etag, key)
        latest = result.group
        if (state) editorState.value = advanceDeviceGroupEditorVersion(state, result)
      }
      if (needsMove) {
        latest = await deviceGroupNative.move(
          current.group.id,
          {
            parentId: nextParent,
            expectedResourceVersion: latest.resourceVersion
          },
          key
        )
        const currentState = editorState.value
        if (currentState) {
          editorState.value = advanceDeviceGroupEditorVersion(currentState, {
            group: latest,
            etag: currentState.current.etag
          })
        }
      }
    }
    showModal.value = false
    pendingSubmission.value = null
    await props.refreshData()
    formItem.value = { id: '', parentId: ROOT_DEVICE_GROUP_SELECTION, name: '', description: '' }
  } catch (error) {
    if (
      error instanceof DeviceGroupNativeError &&
      (error.status === 409 || error.status === 412) &&
      editorState.value
    ) {
      const draft: DeviceGroupEditorDraft = {
        name: formItem.value.name,
        parentId: formItem.value.parentId,
        description: formItem.value.description
      }
      editorState.value = markDeviceGroupEditorConflict(editorState.value, draft)
    }
    window.$message?.error(error instanceof Error ? error.message : $t('common.saveFailed'))
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  if (saving.value || loading.value) return
  showModal.value = false
  formItem.value = { id: '', parentId: ROOT_DEVICE_GROUP_SELECTION, name: '', description: '' }
  editorState.value = null
  pendingSubmission.value = null
}

function requestReloadLatest() {
  if (!editorState.value?.conflict || saving.value || loading.value) return
  window.$dialog?.warning({
    title: '分组已发生变化',
    content: '重新载入最新版本将替换当前表单中的输入。确认后才会更新表单和版本。',
    positiveText: '重新载入最新版本',
    negativeText: '取消',
    onPositiveClick: async () => {
      loading.value = true
      try {
        const latest = await deviceGroupNative.get(editorState.value!.current.group.id)
        editorState.value = acceptDeviceGroupEditorReload(latest)
        formItem.value = {
          id: latest.group.id,
          parentId: latest.group.parentId ?? ROOT_DEVICE_GROUP_SELECTION,
          name: latest.group.name,
          description: latest.group.description ?? ''
        }
        pendingSubmission.value = null
      } catch (error) {
        window.$message?.error(error instanceof Error ? error.message : $t('common.fetchDataFailed'))
      } finally {
        loading.value = false
      }
    }
  })
}

const instance = getCurrentInstance()
const getPlatform = computed(() => (instance?.proxy as any)?.getPlatform?.())
</script>

<template>
  <!-- Modal component to display a form with tree selection, input field, and textarea -->
  <NModal v-model:show="showModal" @after-enter="getOptions">
    <NCard
      :bordered="false"
      :title="!props.isEdit ? $t('custom.groupPage.addGroup') : $t('custom.groupPage.editGroup')"
      size="huge"
      :class="getPlatform ? 'w-90%' : 'w-600px'"
    >
      <NAlert v-if="hasEditConflict" type="warning" class="mb-12px">
        <div class="flex items-center justify-between gap-12px">
          <span>当前分组已被其他操作修改。表单输入和原版本已保留，保存已暂停；请确认后重新载入最新版本。</span>
          <NButton :disabled="loading || saving" @click="requestReloadLatest">重新载入最新版本</NButton>
        </div>
      </NAlert>
      <NForm ref="formRef" :model="formItem" :rules="rules" label-placement="left" label-width="auto">
        <!-- Parent group selection using tree select component -->
        <NFormItem :rules="[rules.parentId]" :label="$t('generate.parent-group')" path="parentId">
          <NTreeSelect
            v-model:value="formItem.parentId"
            :disabled="props.isPidNoEdit || saving || loading"
            :options="options"
            default-expand-all
            key-field="id"
            label-field="name"
          ></NTreeSelect>
        </NFormItem>
        <!-- Group name input field -->
        <NFormItem :rules="[rules.name]" :label="$t('generate.group-name')" path="name">
          <NInput v-model:value="formItem.name" :disabled="saving || loading" />
        </NFormItem>
        <!-- Description textarea for optional input -->
        <NFormItem :label="$t('custom.groupPage.description')" path="description">
          <NInput v-model:value="formItem.description" :disabled="saving || loading" type="textarea" />
        </NFormItem>
        <!-- Form action buttons -->
        <div style="display: flex; justify-content: flex-end; gap: 8px">
          <NButton :disabled="saving || loading" @click="handleClose">{{ $t('custom.groupPage.cancel') }}</NButton>
          <NButton
            v-if="canManageGroups"
            type="primary"
            :loading="saving"
            :disabled="loading || hasEditConflict || (props.isEdit && !editorState)"
            @click="handleSubmit"
          >
            {{ $t('custom.groupPage.confirm') }}
          </NButton>
        </div>
      </NForm>
    </NCard>
  </NModal>
</template>
