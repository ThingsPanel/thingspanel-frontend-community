<script setup lang="ts">
/**
 * ResourceSelector - 资源选择器组件
 * 用于选择要发布的设备模板和看板
 */
import { computed, h } from 'vue'
import { NCard, NButton, NTag, NEmpty, NSpin, NCheckbox, NCheckboxGroup, NSpace, NGrid, NGi } from 'naive-ui'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  deviceTemplates: Array<{
    id: string
    name: string
    description?: string
  }>
  dashboards: Array<{
    id: string
    name: string
    thumbnail?: string | null
    projectName?: string
  }>
  selectedDeviceTemplateIds: string[]
  selectedDashboardIds: string[]
  loading?: boolean
  mode?: 'single' | 'multiple'
}>()

const emit = defineEmits<{
  'update:selectedDeviceTemplateIds': [ids: string[]]
  'update:selectedDashboardIds': [ids: string[]]
  confirm: [deviceTemplateIds: string[], dashboardIds: string[]]
}>()

const { t } = useI18n()

const localDeviceTemplateIds = computed({
  get: () => props.selectedDeviceTemplateIds,
  set: val => emit('update:selectedDeviceTemplateIds', val)
})

const localDashboardIds = computed({
  get: () => props.selectedDashboardIds,
  set: val => emit('update:selectedDashboardIds', val)
})

const hasSelection = computed(() => {
  return localDeviceTemplateIds.value.length > 0 || localDashboardIds.value.length > 0
})

const totalSelected = computed(() => {
  return localDeviceTemplateIds.value.length + localDashboardIds.value.length
})

const isTemplateSelected = (id: string) => localDeviceTemplateIds.value.includes(id)
const isDashboardSelected = (id: string) => localDashboardIds.value.includes(id)

const toggleTemplate = (id: string) => {
  if (isTemplateSelected(id)) {
    localDeviceTemplateIds.value = localDeviceTemplateIds.value.filter(i => i !== id)
  } else {
    localDeviceTemplateIds.value = [...localDeviceTemplateIds.value, id]
  }
}

const toggleDashboard = (id: string) => {
  if (isDashboardSelected(id)) {
    localDashboardIds.value = localDashboardIds.value.filter(i => i !== id)
  } else {
    localDashboardIds.value = [...localDashboardIds.value, id]
  }
}

const selectAllTemplates = () => {
  localDeviceTemplateIds.value = props.deviceTemplates.map(t => t.id)
}

const deselectAllTemplates = () => {
  localDeviceTemplateIds.value = []
}

const selectAllDashboards = () => {
  localDashboardIds.value = props.dashboards.map(d => d.id)
}

const deselectAllDashboards = () => {
  localDashboardIds.value = []
}

const handleConfirm = () => {
  emit('confirm', localDeviceTemplateIds.value, localDashboardIds.value)
}
</script>

<template>
  <NSpin :show="loading">
    <div class="resource-selector">
      <!-- 设备模板选择 -->
      <NCard
        v-if="deviceTemplates.length > 0"
        :title="t('market.publish.selectDeviceTemplates')"
        size="small"
        class="mb-4"
      >
        <template #header-extra>
          <NSpace size="small">
            <NButton size="tiny" @click="selectAllTemplates">
              {{ t('common.selectAll') }}
            </NButton>
            <NButton size="tiny" @click="deselectAllTemplates">
              {{ t('common.deselectAll') }}
            </NButton>
          </NSpace>
        </template>

        <NGrid :cols="mode === 'single' ? 1 : '1 s:2 m:3'" :x-gap="12" :y-gap="12">
          <NGi v-for="template in deviceTemplates" :key="template.id">
            <div
              class="resource-item"
              :class="{ selected: isTemplateSelected(template.id) }"
              @click="toggleTemplate(template.id)"
            >
              <div class="resource-checkbox">
                <NCheckbox :checked="isTemplateSelected(template.id)" />
              </div>
              <div class="resource-info">
                <div class="resource-name">{{ template.name }}</div>
                <div v-if="template.description" class="resource-desc">
                  {{ template.description }}
                </div>
              </div>
              <NTag v-if="isTemplateSelected(template.id)" type="success" size="small">
                {{ t('common.selected') }}
              </NTag>
            </div>
          </NGi>
        </NGrid>
      </NCard>

      <!-- 看板选择 -->
      <NCard v-if="dashboards.length > 0" :title="t('market.publish.selectDashboards')" size="small" class="mb-4">
        <template #header-extra>
          <NSpace size="small">
            <NButton size="tiny" @click="selectAllDashboards">
              {{ t('common.selectAll') }}
            </NButton>
            <NButton size="tiny" @click="deselectAllDashboards">
              {{ t('common.deselectAll') }}
            </NButton>
          </NSpace>
        </template>

        <NGrid :cols="mode === 'single' ? 1 : '1 s:2 m:3'" :x-gap="12" :y-gap="12">
          <NGi v-for="dashboard in dashboards" :key="dashboard.id">
            <div
              class="resource-item"
              :class="{ selected: isDashboardSelected(dashboard.id) }"
              @click="toggleDashboard(dashboard.id)"
            >
              <div class="resource-checkbox">
                <NCheckbox :checked="isDashboardSelected(dashboard.id)" />
              </div>
              <div class="resource-info">
                <div class="resource-name">{{ dashboard.name }}</div>
                <div v-if="dashboard.projectName" class="resource-desc">
                  {{ dashboard.projectName }}
                </div>
              </div>
              <NTag v-if="isDashboardSelected(dashboard.id)" type="success" size="small">
                {{ t('common.selected') }}
              </NTag>
            </div>
          </NGi>
        </NGrid>
      </NCard>

      <!-- 空状态 -->
      <NEmpty
        v-if="deviceTemplates.length === 0 && dashboards.length === 0 && !loading"
        :description="t('market.publish.noResourcesAvailable')"
      />

      <!-- 底部确认栏 -->
      <div v-if="hasSelection && mode === 'multiple'" class="selection-footer">
        <div class="selection-summary">
          {{ t('market.publish.selectedCount', { count: totalSelected }) }}
        </div>
        <NButton type="primary" @click="handleConfirm">
          {{ t('common.confirm') }}
        </NButton>
      </div>
    </div>
  </NSpin>
</template>

<style scoped>
.resource-selector {
  min-height: 200px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--n-color);
}

.resource-item:hover {
  border-color: var(--n-primary-color);
  background: var(--n-primary-color-hover);
}

.resource-item.selected {
  border-color: var(--n-primary-color);
  background: var(--n-primary-color-pressed);
}

.resource-checkbox {
  flex-shrink: 0;
}

.resource-info {
  flex: 1;
  min-width: 0;
}

.resource-name {
  font-weight: 500;
  color: var(--n-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-desc {
  font-size: 12px;
  color: var(--n-text-color-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 4px;
}

.selection-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-top: 1px solid var(--n-border-color);
  background: var(--n-color);
  margin-top: 16px;
  border-radius: 8px;
}

.selection-summary {
  color: var(--n-text-color-2);
  font-size: 14px;
}
</style>
