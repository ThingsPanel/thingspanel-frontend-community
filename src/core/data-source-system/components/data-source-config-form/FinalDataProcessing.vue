<template>
  <div class="final-data-processing">
    <n-text strong>数据源最终处理:</n-text>
    <n-space vertical :size="12" style="margin-top: 8px">
      <!-- 处理方式选择 -->
      <div>
        <n-text depth="2" style="font-size: 12px; margin-bottom: 4px; display: block">
          选择如何将多个原始数据项合并为最终数据:
        </n-text>
        <n-radio-group
          :value="dataValue?.finalProcessingType || 'custom-script'"
          style="width: 100%"
          @update:value="value => emit('update:finalProcessingType', value)"
        >
          <n-space vertical :size="6">
            <n-radio value="merge-object" style="width: 100%">
              <n-space align="center" :size="8">
                <span style="font-weight: 500">对象合并</span>
                <n-text depth="3" style="font-size: 11px">将多个对象合并成一个大对象 (Object.assign)</n-text>
              </n-space>
            </n-radio>
            <n-radio value="concat-array" style="width: 100%">
              <n-space align="center" :size="8">
                <span style="font-weight: 500">数组连接</span>
                <n-text depth="3" style="font-size: 11px">将多个数组连接成一个数组 (Array.concat)</n-text>
              </n-space>
            </n-radio>
            <n-radio value="custom-script" style="width: 100%">
              <n-space align="center" :size="8">
                <span style="font-weight: 500">自定义脚本</span>
                <n-text depth="3" style="font-size: 11px">用JavaScript脚本自定义处理逻辑</n-text>
              </n-space>
            </n-radio>
            <n-radio value="select-specific" style="width: 100%">
              <n-space align="center" :size="8">
                <span style="font-weight: 500">选择特定数据项</span>
                <n-text depth="3" style="font-size: 11px">从多个数据项中选择一个作为最终数据</n-text>
              </n-space>
            </n-radio>
          </n-space>
        </n-radio-group>
      </div>

      <!-- 自定义脚本编辑区域 -->
      <div v-if="(dataValue?.finalProcessingType || 'custom-script') === 'custom-script'" class="custom-script-area">
        <n-card size="small" :bordered="false" style="background: var(--hover-color)">
          <template #header>
            <n-space align="center" justify="space-between">
              <n-text depth="2" style="font-size: 12px">最终处理脚本</n-text>
              <n-space :size="4">
                <n-button size="tiny" tertiary @click="emit('formatFinalScript')">
                  <template #icon>
                    <n-icon size="12">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M9.5 15.5L4.5 10.5L9.5 5.5L8.09 4.09L1.5 10.68L8.09 17.27L9.5 15.5Z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M14.5 8.5L19.5 13.5L14.5 18.5L15.91 19.91L22.5 13.32L15.91 6.73L14.5 8.5Z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </n-icon>
                  </template>
                  格式化
                </n-button>
                <n-button size="tiny" tertiary @click="emit('validateFinalScript')">
                  <template #icon>
                    <n-icon size="12">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
                          stroke="currentColor"
                          stroke-width="2"
                          fill="none"
                        ></path>
                      </svg>
                    </n-icon>
                  </template>
                  验证
                </n-button>
              </n-space>
            </n-space>
          </template>

          <!-- 脚本编辑器 -->
          <div class="script-editor-container">
            <n-input
              :value="dataValue?.finalProcessingScript || 'return processedDataList'"
              type="textarea"
              :rows="8"
              placeholder="// 编写最终处理脚本&#10;// 参数: processedDataList - 已处理的原始数据项列表&#10;// 返回: 合并后的最终数据&#10;return processedDataList"
              style="font-family: 'Courier New', monospace; font-size: 12px"
              @update:value="value => emit('update:finalProcessingScript', value)"
            />

            <!-- 脚本说明 -->
            <div style="margin-top: 8px; padding: 8px; background: var(--info-color-pressed); border-radius: 4px">
              <n-text depth="2" style="font-size: 11px; line-height: 1.4">
                <strong>脚本说明:</strong>
                <br />
                •
                <code>processedDataList</code>
                : 所有原始数据项经过过滤和脚本处理后的结果数组
                <br />
                • 示例:
                <code>Object.assign({}, ...processedDataList)</code>
                合并对象
                <br />
                • 示例:
                <code>processedDataList.flat()</code>
                连接数组
                <br />
                • 示例:
                <code>processedDataList[0]</code>
                使用第一个数据项
              </n-text>
            </div>
          </div>
        </n-card>
      </div>
    </n-space>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { NText, NSpace, NRadioGroup, NRadio, NCard, NButton, NIcon, NInput } from 'naive-ui'

const props = defineProps({
  dataValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits([
  'update:finalProcessingType',
  'update:finalProcessingScript',
  'formatFinalScript',
  'validateFinalScript'
])
</script>

<style scoped>
.final-data-processing {
  /* 样式可以根据需要添加 */
}
.custom-script-area {
  margin-top: 8px;
}
.script-editor-container {
  /* 样式可以根据需要添加 */
}
</style>
