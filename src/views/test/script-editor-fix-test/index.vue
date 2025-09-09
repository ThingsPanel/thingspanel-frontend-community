<!--
CodeMirror 6 脚本编辑器演示页面
展示基于 vue-codemirror6 的专业代码编辑器功能
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useThemeStore } from '@/store/modules/theme'
import SimpleScriptEditor from '@/core/script-engine/components/SimpleScriptEditor.vue'
import {
  CodeOutline,
  ColorPaletteOutline,
  RefreshOutline,
  TrashOutline,
  PlayOutline,
  CopyOutline,
  CheckmarkOutline
} from '@vicons/ionicons5'

// 主题系统集成
const themeStore = useThemeStore()

// 测试数据
const scriptCode = ref(`// 欢迎使用 CodeMirror 6 脚本编辑器
// 这是一个功能完整的 JavaScript 代码编辑器

/**
 * 数据处理示例函数
 * @param {Array} data - 输入数据数组
 * @returns {Object} 处理结果
 */
function processUserData(data) {
  const result = {
    total: data.length,
    processed: data.map(item => ({
      ...item,
      id: item.id || Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      status: 'processed'
    })),
    summary: {
      averageValue: data.reduce((sum, item) => sum + (item.value || 0), 0) / data.length,
      createdAt: new Date().toISOString()
    }
  }
  
  return result
}

// 示例数据
const sampleData = [
  { name: '用户1', value: 100 },
  { name: '用户2', value: 200 },
  { name: '用户3', value: 150 }
]

// 返回处理结果
return processUserData(sampleData)`)

// 执行状态
const isExecuting = ref(false)
const executionResult = ref('')
const isCopied = ref(false)

/**
 * 切换主题进行测试
 */
const toggleTheme = () => {
  themeStore.toggleThemeScheme()
}

/**
 * 清空编辑器
 */
const clearEditor = () => {
  scriptCode.value = ''
}

/**
 * 加载示例代码
 */
const loadExample = () => {
  scriptCode.value = `// 高级数据处理示例
class DataProcessor {
  constructor(config = {}) {
    this.config = {
      batchSize: 100,
      timeout: 5000,
      retries: 3,
      ...config
    }
  }

  /**
   * 批量处理数据
   * @param {Array} items - 待处理数据
   * @returns {Promise<Object>} 处理结果
   */
  async processBatch(items) {
    const startTime = performance.now()
    
    try {
      const processed = await Promise.all(
        items.map(async (item, index) => {
          // 模拟异步处理
          await new Promise(resolve => setTimeout(resolve, 10))
          
          return {
            ...item,
            id: \`item_\${index + 1}\`,
            processedAt: new Date().toISOString(),
            hash: btoa(JSON.stringify(item)).slice(0, 8)
          }
        })
      )
      
      const endTime = performance.now()
      
      return {
        success: true,
        data: processed,
        meta: {
          totalItems: items.length,
          processingTime: Math.round(endTime - startTime),
          averageTimePerItem: Math.round((endTime - startTime) / items.length)
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      }
    }
  }
}

// 使用示例
const processor = new DataProcessor({ batchSize: 50 })
const testData = Array.from({ length: 20 }, (_, i) => ({
  name: \`Item \${i + 1}\`,
  value: Math.floor(Math.random() * 1000),
  category: ['A', 'B', 'C'][i % 3]
}))

return processor.processBatch(testData)`
}

/**
 * 执行代码
 */
const executeCode = async () => {
  if (!scriptCode.value.trim()) {
    window.$message?.warning('请先输入代码')
    return
  }

  isExecuting.value = true
  executionResult.value = ''

  try {
    const func = new Function(scriptCode.value)
    const result = await func()

    executionResult.value = JSON.stringify(result, null, 2)
    window.$message?.success('代码执行成功')
  } catch (error) {
    executionResult.value = `执行错误: ${error.message}`
    window.$message?.error('代码执行失败')
  } finally {
    isExecuting.value = false
  }
}

/**
 * 复制代码
 */
const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(scriptCode.value)
    isCopied.value = true
    window.$message?.success('代码已复制到剪贴板')
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (error) {
    window.$message?.error('复制失败')
  }
}

// 主题显示名称
const themeDisplayName = computed(() => {
  const themeNames = {
    light: '浅色主题',
    dark: '深色主题',
    auto: '跟随系统'
  }
  return themeNames[themeStore.themeScheme] || themeStore.themeScheme
})

// 代码统计
const codeStats = computed(() => {
  const code = scriptCode.value
  return {
    lines: code.split('\n').length,
    characters: code.length,
    words: code
      .trim()
      .split(/\s+/)
      .filter(w => w).length,
    size: new Blob([code]).size
  }
})
</script>

<template>
  <div class="script-editor-demo">
    <!-- 页面头部 -->
    <div class="demo-header">
      <div class="header-content">
        <div class="title-section">
          <n-icon size="28" color="var(--primary-color)">
            <CodeOutline />
          </n-icon>
          <div class="title-text">
            <h1>CodeMirror 6 脚本编辑器</h1>
            <p>基于 vue-codemirror6 的专业代码编辑器演示</p>
          </div>
        </div>

        <div class="header-actions">
          <n-space>
            <n-button circle quaternary :title="`切换主题 (${themeDisplayName})`" @click="toggleTheme">
              <template #icon>
                <n-icon>
                  <ColorPaletteOutline />
                </n-icon>
              </template>
            </n-button>

            <n-tag :bordered="false" type="info">
              {{ themeDisplayName }}
            </n-tag>
          </n-space>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="demo-content">
      <!-- 左侧编辑器区域 -->
      <div class="editor-section">
        <n-card>
          <template #header>
            <div class="editor-header">
              <n-space align="center">
                <n-icon>
                  <CodeOutline />
                </n-icon>
                <span>JavaScript 编辑器</span>
              </n-space>

              <n-space>
                <n-button size="small" :loading="false" @click="loadExample">
                  <template #icon>
                    <n-icon>
                      <RefreshOutline />
                    </n-icon>
                  </template>
                  加载示例
                </n-button>

                <n-button size="small" :disabled="!scriptCode" @click="copyCode">
                  <template #icon>
                    <n-icon>
                      <component :is="isCopied ? CheckmarkOutline : CopyOutline" />
                    </n-icon>
                  </template>
                  {{ isCopied ? '已复制' : '复制代码' }}
                </n-button>

                <n-button size="small" type="warning" :disabled="!scriptCode" @click="clearEditor">
                  <template #icon>
                    <n-icon>
                      <TrashOutline />
                    </n-icon>
                  </template>
                  清空
                </n-button>
              </n-space>
            </div>
          </template>

          <!-- 编辑器 -->
          <div class="editor-container">
            <SimpleScriptEditor
              v-model="scriptCode"
              :show-templates="true"
              height="400px"
              placeholder="// 在这里输入 JavaScript 代码..."
            />
          </div>

          <!-- 编辑器底部信息 -->
          <template #footer>
            <div class="editor-footer">
              <n-space size="large">
                <n-statistic label="行数" :value="codeStats.lines" :show-label="true" />
                <n-statistic label="字符" :value="codeStats.characters" :show-label="true" />
                <n-statistic label="单词" :value="codeStats.words" :show-label="true" />
                <n-statistic label="大小" :value="`${codeStats.size} B`" :show-label="true" />
              </n-space>

              <n-button type="primary" :loading="isExecuting" :disabled="!scriptCode.trim()" @click="executeCode">
                <template #icon>
                  <n-icon>
                    <PlayOutline />
                  </n-icon>
                </template>
                {{ isExecuting ? '执行中...' : '运行代码' }}
              </n-button>
            </div>
          </template>
        </n-card>
      </div>

      <!-- 右侧结果区域 -->
      <div class="result-section">
        <n-card title="执行结果" style="height: 100%">
          <template #header-extra>
            <n-tag v-if="executionResult" :type="executionResult.startsWith('执行错误') ? 'error' : 'success'">
              {{ executionResult.startsWith('执行错误') ? '执行失败' : '执行成功' }}
            </n-tag>
          </template>

          <div class="result-container">
            <n-scrollbar v-if="executionResult" style="max-height: 500px">
              <n-code
                :code="executionResult"
                :language="executionResult.startsWith('执行错误') ? 'text' : 'json'"
                show-line-numbers
              />
            </n-scrollbar>

            <n-empty v-else description="运行代码查看结果" style="margin-top: 100px">
              <template #icon>
                <n-icon size="48" :depth="3">
                  <PlayOutline />
                </n-icon>
              </template>
            </n-empty>
          </div>
        </n-card>
      </div>
    </div>

    <!-- 功能特性展示 -->
    <div class="features-section">
      <n-card title="编辑器特性">
        <n-grid :cols="4" :x-gap="16" :y-gap="16">
          <n-gi>
            <div class="feature-item">
              <n-icon size="24" color="var(--success-color)">
                <CodeOutline />
              </n-icon>
              <h4>语法高亮</h4>
              <p>完整的 JavaScript 语法高亮支持</p>
            </div>
          </n-gi>

          <n-gi>
            <div class="feature-item">
              <n-icon size="24" color="var(--info-color)">
                <ColorPaletteOutline />
              </n-icon>
              <h4>主题切换</h4>
              <p>支持明暗主题自动切换</p>
            </div>
          </n-gi>

          <n-gi>
            <div class="feature-item">
              <n-icon size="24" color="var(--warning-color)">
                <RefreshOutline />
              </n-icon>
              <h4>代码模板</h4>
              <p>内置多种常用代码模板</p>
            </div>
          </n-gi>

          <n-gi>
            <div class="feature-item">
              <n-icon size="24" color="var(--error-color)">
                <PlayOutline />
              </n-icon>
              <h4>实时执行</h4>
              <p>支持代码实时运行和结果展示</p>
            </div>
          </n-gi>
        </n-grid>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.script-editor-demo {
  min-height: 100vh;
  background: var(--body-color);
}

/* 页面头部 */
.demo-header {
  background: var(--card-color);
  border-bottom: 1px solid var(--border-color);
  padding: 24px 32px;
  margin-bottom: 24px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-text h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.2;
}

.title-text p {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: var(--text-color-2);
  line-height: 1.4;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 主内容区域 */
.demo-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 32px;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  margin-bottom: 32px;
}

.editor-section {
  min-height: 600px;
}

.result-section {
  position: sticky;
  top: 24px;
  height: fit-content;
}

/* 编辑器头部 */
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.editor-container {
  margin: 16px 0;
}

/* 编辑器底部 */
.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

/* 结果容器 */
.result-container {
  min-height: 300px;
  display: flex;
  flex-direction: column;
}

/* 功能特性 */
.features-section {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 32px 32px;
}

.feature-item {
  text-align: center;
  padding: 24px 16px;
  border-radius: var(--border-radius);
  background: var(--card-color);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  height: 100%;
}

.feature-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 16px var(--box-shadow-color);
  transform: translateY(-2px);
}

.feature-item h4 {
  margin: 12px 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.feature-item p {
  margin: 0;
  font-size: 14px;
  color: var(--text-color-2);
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .demo-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .result-section {
    position: static;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .demo-header {
    padding: 20px 24px;
  }

  .demo-content,
  .features-section {
    padding: 0 24px;
  }
}

@media (max-width: 768px) {
  .demo-header {
    padding: 16px 20px;
  }

  .demo-content,
  .features-section {
    padding: 0 20px;
  }

  .title-text h1 {
    font-size: 24px;
  }

  .editor-footer {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .features-section :deep(.n-grid) {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 480px) {
  .title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .editor-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .features-section :deep(.n-grid) {
    grid-template-columns: 1fr !important;
  }
}

/* 暗色主题优化 */
[data-theme='dark'] .feature-item {
  background: rgba(255, 255, 255, 0.05);
}

[data-theme='dark'] .feature-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* 动画效果 */
.script-editor-demo * {
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

/* 卡片阴影优化 */
.demo-content .n-card,
.features-section .n-card {
  box-shadow: 0 2px 8px var(--box-shadow-color);
}

.demo-content .n-card:hover {
  box-shadow: 0 4px 16px var(--box-shadow-color);
}

/* 统计数字样式优化 */
.editor-footer :deep(.n-statistic-value) {
  font-weight: 600;
  color: var(--primary-color);
}

.editor-footer :deep(.n-statistic-label) {
  color: var(--text-color-2);
  font-size: 12px;
}
</style>
