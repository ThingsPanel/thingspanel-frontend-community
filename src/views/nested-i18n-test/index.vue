<template>
  <div class="nested-i18n-test-container">
    <h1>嵌套翻译测试页面</h1>
    
    <!-- 语言切换 -->
    <div class="language-switcher">
      <button :class="{ active: currentLang === 'zh-CN' }" @click="switchLanguage('zh-CN')">
        中文
      </button>
      <button :class="{ active: currentLang === 'en-US' }" @click="switchLanguage('en-US')">
        English
      </button>
    </div>

    <!-- 二级嵌套测试 -->
    <div class="test-section">
      <h2>二级嵌套测试</h2>
      <div class="test-item">
        <span class="label">page.home.title:</span>
        <span class="value">{{ $t('page.home.title') }}</span>
      </div>
      <div class="test-item">
        <span class="label">page.home.greeting:</span>
        <span class="value">{{ $t('page.home.greeting') }}</span>
      </div>
      <div class="test-item">
        <span class="label">page.about.title:</span>
        <span class="value">{{ $t('page.about.title') }}</span>
      </div>
    </div>

    <!-- 三级嵌套测试 -->
    <div class="test-section">
      <h2>三级嵌套测试</h2>
      <div class="test-item">
        <span class="label">deep.level.one.title:</span>
        <span class="value">{{ $t('deep.level.one.title') }}</span>
      </div>
      <div class="test-item">
        <span class="label">deep.level.one.content:</span>
        <span class="value">{{ $t('deep.level.one.content') }}</span>
      </div>
      <div class="test-item">
        <span class="label">deep.level.two.title:</span>
        <span class="value">{{ $t('deep.level.two.title') }}</span>
      </div>
      <div class="test-item">
        <span class="label">deep.level.two.content:</span>
        <span class="value">{{ $t('deep.level.two.content') }}</span>
      </div>
    </div>

    <!-- 四级嵌套测试 -->
    <div class="test-section">
      <h2>四级嵌套测试</h2>
      <div class="test-item">
        <span class="label">very.deep.nested.level.title:</span>
        <span class="value">{{ $t('very.deep.nested.level.title') }}</span>
      </div>
      <div class="test-item">
        <span class="label">very.deep.nested.level.content:</span>
        <span class="value">{{ $t('very.deep.nested.level.content') }}</span>
      </div>
      <div class="test-item">
        <span class="label">very.deep.nested.level.description:</span>
        <span class="value">{{ $t('very.deep.nested.level.description') }}</span>
      </div>
    </div>

    <!-- 五级嵌套测试 -->
    <div class="test-section">
      <h2>五级嵌套测试</h2>
      <div class="test-item">
        <span class="label">ultra.deep.nested.level.test.title:</span>
        <span class="value">{{ $t('ultra.deep.nested.level.test.title') }}</span>
      </div>
      <div class="test-item">
        <span class="label">ultra.deep.nested.level.test.message:</span>
        <span class="value">{{ $t('ultra.deep.nested.level.test.message') }}</span>
      </div>
    </div>

    <!-- 动态测试 -->
    <div class="test-section">
      <h2>动态翻译测试</h2>
      <div class="dynamic-test">
        <input 
          v-model="testKey" 
          placeholder="输入翻译键，如: deep.level.one.title"
          class="test-input"
        />
        <div class="test-result">
          <span class="label">结果:</span>
          <span class="value">{{ $t(testKey) }}</span>
        </div>
      </div>
    </div>

    <!-- 调试信息 -->
    <div class="debug-section">
      <h2>调试信息</h2>
      <div class="debug-item">
        <span class="label">当前语言:</span>
        <span class="value">{{ currentLang }}</span>
      </div>
      <div class="debug-item">
        <span class="label">可用语言:</span>
        <span class="value">{{ availableLocales.join(', ') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n2, setLang, getCurrentLang } from '@/locales2/useI18n2'

// 使用国际化
const { $t, availableLocales } = useI18n2()

// 当前语言
const currentLang = computed(() => getCurrentLang())

// 测试键
const testKey = ref('deep.level.one.title')

// 切换语言
const switchLanguage = (lang) => {
  setLang(lang)
}
</script>

<style scoped>
.nested-i18n-test-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

h2 {
  color: #555;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.language-switcher {
  text-align: center;
  margin-bottom: 30px;
}

.language-switcher button {
  margin: 0 10px;
  padding: 10px 20px;
  border: 2px solid #007bff;
  background: white;
  color: #007bff;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.language-switcher button:hover {
  background: #007bff;
  color: white;
}

.language-switcher button.active {
  background: #007bff;
  color: white;
}

.test-section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
}

.test-item {
  display: flex;
  margin-bottom: 15px;
  padding: 10px;
  background: white;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.label {
  font-weight: bold;
  color: #666;
  min-width: 300px;
  margin-right: 20px;
}

.value {
  color: #333;
  flex: 1;
  word-break: break-all;
}

.dynamic-test {
  padding: 20px;
  background: white;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.test-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 14px;
}

.test-result {
  display: flex;
  padding: 10px;
  background: #f0f8ff;
  border-radius: 4px;
}

.debug-section {
  margin-top: 40px;
  padding: 20px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
}

.debug-item {
  display: flex;
  margin-bottom: 10px;
}

.debug-item .label {
  min-width: 150px;
}

@media (max-width: 768px) {
  .test-item {
    flex-direction: column;
  }
  
  .label {
    min-width: auto;
    margin-right: 0;
    margin-bottom: 5px;
  }
}
</style>