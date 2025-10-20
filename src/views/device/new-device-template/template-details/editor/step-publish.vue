<script setup lang="ts">
/**
 * 步骤5：发布完成
 * 显示完整的模板JSON数据，支持复制
 */

import { ref, onMounted } from 'vue'
import { $t } from '@/locales'
import { getTemplat } from '@/service/api/system-data'

const props = defineProps({
  stepCurrent: { type: Number, required: true },
  modalVisible: {
    type: Boolean,
    required: true
  },
  deviceTemplateId: { type: String, required: true }
})

const emit = defineEmits(['update:modalVisible', 'update:stepCurrent'])

// JSON代码
const code = ref<string>('')

/**
 * 加载完整模板数据
 */
const getTemplate = async () => {
  const { data, error } = await getTemplat(props.deviceTemplateId)
  if (!error && data) {
    // 解析JSON字段
    try {
      data.app_chart_config = JSON.parse(data.app_chart_config)
    } catch (e) {
      // 如果解析失败，保持原样
    }
    try {
      data.web_chart_config = JSON.parse(data.web_chart_config)
    } catch (e) {
      // 如果解析失败，保持原样
    }
    code.value = JSON.stringify(data, null, 2)
  }
}

/**
 * 上一步
 */
const back: () => void = async () => {
  emit('update:stepCurrent', 4)
}

/**
 * 复制JSON到剪贴板
 */
const copyText = (): void => {
  const textElement = document.getElementById('text-to-copy')
  if (textElement) {
    const text: string | null = textElement.textContent
    if (window.isSecureContext && navigator.clipboard) {
      navigator.clipboard
        .writeText(typeof text === 'string' ? text : '')
        .then(() => {
          window.$message?.info($t('common.copiedClipboard'))
        })
        .catch(err => {
          window.$message?.error(`${$t('common.copyingFailed')}: ${err}`)
        })
    } else {
      const range = document.createRange()
      range.selectNodeContents(textElement!)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      document.execCommand('Copy')
      window.$message?.success($t('theme.configOperation.copySuccess'))
    }
  }
}

onMounted(getTemplate)
</script>

<template>
  <div>
    <n-card class="mt-4">
      <n-scrollbar class="h-400px">
        <n-code id="text-to-copy" :code="code" language="json" />
      </n-scrollbar>
      <template #footer>
        <div class="flex justify-between border-t pt-3">
          <div>
            <n-button type="primary" class="mr-4" @click="copyText">{{ $t('generate.copy-json') }}</n-button>
          </div>
          <div>
            <n-button class="mr-4" @click="back">{{ $t('generate.previous-step') }}</n-button>
            <n-button type="primary" @click="emit('update:modalVisible', false)">
              {{ $t('common.complete') }}
            </n-button>
          </div>
        </div>
      </template>
    </n-card>
  </div>
</template>

<style scoped></style>
