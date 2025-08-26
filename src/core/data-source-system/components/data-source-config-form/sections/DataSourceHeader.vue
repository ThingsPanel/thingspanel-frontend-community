<script setup lang="ts">
import { computed } from 'vue'
import { NCollapse, NCollapseItem, NSpace, NTag, NTooltip, NIcon } from 'naive-ui'
import { InformationCircleOutline } from '@vicons/ionicons5'

const props = defineProps<{
  dataSourceOptions: { label: string; value: string; type?: string; description?: string; example?: object }[]
  activeDataSourceKey: string
}>()

const emit = defineEmits(['update:activeDataSourceKey'])

const activeDataSource = computed(() => {
  return props.dataSourceOptions.find(opt => opt.value === props.activeDataSourceKey)
})

function handleUpdate(value: string[]) {
  if (value.length > 0) {
    emit('update:activeDataSourceKey', value[0])
  }
}
</script>

<template>
  <div class="data-source-header">
    <NCollapse 
      :default-expanded-names="[activeDataSourceKey]"
      @update:expanded-names="handleUpdate"
    >
      <NCollapseItem 
        v-for="option in dataSourceOptions" 
        :key="option.value"
        :name="option.value"
        :title="option.label"
      >
        <template #header-extra>
          <NSpace align="center">
            <NTag v-if="option.type" type="success">
              {{ option.type }}
            </NTag>
            <NTooltip v-if="option.example" trigger="hover">
              <template #trigger>
                <NIcon :size="20" class="cursor-pointer">
                  <InformationCircleOutline />
                </NIcon>
              </template>
              <pre>{{ JSON.stringify(option.example, null, 2) }}</pre>
            </NTooltip>
          </NSpace>
        </template>
        
        <div v-if="option.description">
          {{ option.description }}
        </div>
      </NCollapseItem>
    </NCollapse>
  </div>
</template>

<style scoped>
.data-source-header {
  margin-bottom: 16px;
}
</style>
