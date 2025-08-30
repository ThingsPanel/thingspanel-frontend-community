<!--
简单脚本编辑器 CodeMirror 6 重构版本测试页面
-->
<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import { useThemeStore } from '@/store/modules/theme'

// 动态导入组件以防止初始化问题
const SimpleScriptEditor = defineAsyncComponent(() => import('@/core/script-engine/components/SimpleScriptEditor.vue'))

// 主题系统集成
const themeStore = useThemeStore()

// 测试数据
const scriptCode = ref(`// 默认JavaScript代码
return {
  value: Math.random() * 100,
  timestamp: Date.now(),
  message: 'Hello CodeMirror 6!'
}`)

const scriptCode2 = ref('')

// 测试配置
const editorHeight = ref('300px')
const showTemplates = ref(true)
const templateCategory = ref('')

const categoryOptions = [
  { label: '不限制', value: '' },
  { label: '数据生成', value: 'data-generation' },
  { label: '数据处理', value: 'data-processing' },
  { label: '数据合并', value: 'data-merger' }
]

/**
 * 切换主题进行测试
 */
const toggleTheme = () => {
  themeStore.toggleDarkMode()
}

/**
 * 格式化代码
 */
const formatCode = () => {
  try {
    // 简单的代码格式化
    const formatted = scriptCode.value.replace(/;\s*}/g, ';\n}').replace(/{\s*/g, '{\n  ').replace(/,\s*/g, ',\n  ')
    scriptCode.value = formatted
  } catch (error) {
    console.error('代码格式化失败:', error)
  }
}

/**
 * 清空编辑器
 */
const clearEditor = () => {
  scriptCode.value = ''
}

/**
 * 执行脚本代码（测试用）
 */
const executeScript = () => {
  try {
    // 创建函数并执行
    const func = new Function(scriptCode.value)
    const result = func()
    console.log('脚本执行结果:', result)
    window.$message?.success(`脚本执行成功，结果已输出到控制台`)
  } catch (error) {
    console.error('脚本执行失败:', error)
    window.$message?.error(`脚本执行失败: ${error.message}`)
  }
}

// 计算属性显示当前主题
const currentTheme = computed(() => (themeStore.darkMode ? '深色模式' : '浅色模式'))

// 代码长度统计
const codeStats = computed(() => ({
  lines: scriptCode.value.split('\n').length,
  characters: scriptCode.value.length,
  words: scriptCode.value
    .trim()
    .split(/\s+/)
    .filter(w => w).length
}))
</script>

<template>
  <div class="script-editor-test">
    <n-card title="SimpleScriptEditor CodeMirror 6 重构版本测试" class="mb-4">
      <!-- 控制面板 -->
      <n-space vertical>
        <n-space align="center">
          <n-text strong>测试控制:</n-text>
          <n-button type="info" @click="toggleTheme">切换主题 (当前: {{ currentTheme }})</n-button>
          <n-button type="success" @click="executeScript">执行脚本</n-button>
          <n-button @click="formatCode">格式化代码</n-button>
          <n-button type="warning" @click="clearEditor">清空编辑器</n-button>
        </n-space>

        <n-space align="center">
          <n-text>编辑器高度:</n-text>
          <n-input v-model:value="editorHeight" style="width: 120px" placeholder="如: 300px" />

          <n-text>显示模板:</n-text>
          <n-switch v-model:value="showTemplates" />

          <n-text>模板类别:</n-text>
          <n-select v-model:value="templateCategory" :options="categoryOptions" style="width: 150px" clearable />
        </n-space>
      </n-space>
    </n-card>

    <!-- 主编辑器测试 -->
    <n-card title="主要编辑器 - 带模板和自定义高度" class="mb-4">
      <SimpleScriptEditor
        v-model="scriptCode"
        :height="editorHeight"
        :show-templates="showTemplates"
        :template-category="templateCategory"
        placeholder="请输入JavaScript脚本代码..."
      />

      <!-- 代码统计信息 -->
      <n-space class="mt-2" align="center">
        <n-tag>行数: {{ codeStats.lines }}</n-tag>
        <n-tag>字符数: {{ codeStats.characters }}</n-tag>
        <n-tag>单词数: {{ codeStats.words }}</n-tag>
      </n-space>
    </n-card>

    <!-- 简化版编辑器测试 -->
    <n-card title="简化版编辑器 - 无模板" class="mb-4">
      <SimpleScriptEditor
        v-model="scriptCode2"
        :show-templates="false"
        height="150px"
        placeholder="无模板版本编辑器..."
      />
    </n-card>

    <!-- 主题测试区域 -->
    <n-card title="主题适配测试">
      <n-space vertical>
        <n-text>当前主题: {{ currentTheme }}</n-text>
        <n-text type="info">请测试明暗主题切换，验证编辑器颜色是否正确适配</n-text>
        <n-space>
          <n-tag :type="themeStore.darkMode ? 'info' : 'default'">
            深色主题: {{ themeStore.darkMode ? '已启用' : '未启用' }}
          </n-tag>
          <n-tag :type="!themeStore.darkMode ? 'success' : 'default'">
            浅色主题: {{ !themeStore.darkMode ? '已启用' : '未启用' }}
          </n-tag>
        </n-space>
      </n-space>
    </n-card>

    <!-- 代码输出区域 -->
    <n-card title="当前代码内容" class="mt-4">
      <n-code :code="scriptCode" language="javascript" />
    </n-card>
  </div>
</template>

<style scoped>
.script-editor-test {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
