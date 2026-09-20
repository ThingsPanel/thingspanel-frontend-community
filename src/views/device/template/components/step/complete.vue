<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getTemplat } from '@/service/api/system-data'
import { $t } from '@/locales'
import { message } from '@/utils/common/discrete'

const props = defineProps({
  stepCurrent: { type: Number, required: true },
  modalVisible: {
    type: Boolean,
    required: true
  },
  deviceTemplateId: { type: String, required: true }
})
const emit = defineEmits(['update:modalVisible', 'update:stepCurrent'])
const code = ref<string>('')
const getTemplate = async () => {
  const { data, error } = await getTemplat(props.deviceTemplateId)
  if (!error) {
    data.app_chart_config = JSON.parse(data.app_chart_config)
    data.web_chart_config = JSON.parse(data.web_chart_config)
    code.value = JSON.stringify(data, null, 2)
  }
}
const back: () => void = async () => {
  emit('update:stepCurrent', 4)
}
const copyText = (): void => {
  const textElement = document.getElementById('text-to-copy')
  if (textElement) {
    const text: string | null = textElement.textContent
    if (window.isSecureContext && navigator.clipboard) {
      navigator.clipboard
        .writeText(typeof text === 'string' ? text : '')
        .then(() => {
          message.info($t('common.copiedClipboard'))
        })
        .catch(err => {
          message.error(`${$t('common.copyingFailed')}:`, err)
        })
    } else {
      const range = document.createRange()
      range.selectNodeContents(textElement!)
      const selection = document.getSelection()
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
