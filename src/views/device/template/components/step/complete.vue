<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getTemplat } from '@/service/api/system-data'
import { $t } from '@/locales'

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
          window.NMessage.info("已复制到剪贴板")
        })
        .catch(err => {
          window.NMessage.error(`${"复制失败"}:`, err)
        })
    } else {
      const range = document.createRange()
      range.selectNodeContents(textElement!)
      const selection = document.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      document.execCommand('Copy')
      window.$message?.success("复制成功")
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
            <n-button type="primary" class="mr-4" @click="copyText">{{ "复制json" }}</n-button>
          </div>
          <div>
            <n-button class="mr-4" @click="back">{{ "上一步" }}</n-button>
            <n-button type="primary" @click="emit('update:modalVisible', false)">
              {{ "完成" }}
            </n-button>
          </div>
        </div>
      </template>
    </n-card>
  </div>
</template>

<style scoped></style>
