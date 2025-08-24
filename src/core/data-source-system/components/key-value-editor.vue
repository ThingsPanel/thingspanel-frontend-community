<!--
  键值对编辑器组件
  用于编辑HTTP请求头、请求参数等键值对数据
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { NButton, NInput, NSpace } from 'naive-ui'
import { $t } from '@/locales'

interface KeyValuePair {
  key: string
  value: string
}

interface Props {
  modelValue: Record<string, string>
  placeholder?: {
    key?: string
    value?: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: () => ({
    key: '',
    value: ''
  })
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, string>): void
}>()

// 将对象转换为键值对数组
const pairs = ref<KeyValuePair[]>([])

// 初始化和同步数据
watch(
  () => props.modelValue,
  newValue => {
    pairs.value = Object.entries(newValue).map(([key, value]) => ({ key, value }))
    if (pairs.value.length === 0) {
      addPair()
    }
  },
  { immediate: true }
)

// 添加新的键值对
const addPair = () => {
  pairs.value.push({ key: '', value: '' })
}

// 删除键值对
const removePair = (index: number) => {
  pairs.value.splice(index, 1)
  if (pairs.value.length === 0) {
    addPair()
  }
  updateModelValue()
}

// 更新父组件的值
const updateModelValue = () => {
  const result: Record<string, string> = {}
  pairs.value.forEach(pair => {
    if (pair.key) {
      result[pair.key] = pair.value
    }
  })
  emit('update:modelValue', result)
}
</script>

<template>
  <div class="key-value-editor">
    <div v-for="(pair, index) in pairs" :key="index" class="key-value-pair">
      <NSpace align="center" :size="8">
        <NInput
          v-model:value="pair.key"
          :placeholder="placeholder.key || $t('form.key')"
          @update:value="updateModelValue"
        />
        <span class="separator">:</span>
        <NInput
          v-model:value="pair.value"
          :placeholder="placeholder.value || $t('form.value')"
          @update:value="updateModelValue"
        />
        <NButton quaternary circle type="error" size="small" @click="removePair(index)">
          <template #icon>
            <div class="i-material-symbols:delete-outline" />
          </template>
        </NButton>
      </NSpace>
    </div>
    <div class="add-button">
      <NButton dashed type="primary" @click="addPair">
        {{ $t('form.addKeyValuePair') }}
      </NButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.key-value-editor {
  .key-value-pair {
    margin-bottom: 8px;

    .separator {
      color: var(--n-text-color-3);
      margin: 0 4px;
    }
  }

  .add-button {
    margin-top: 16px;
  }
}
</style>
