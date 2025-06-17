<template>
  <div class="i18n-test-page">
    <!-- 页面标题 -->
    <div class="header">
      <h1>{{ $t('test.title') }}</h1>
      <p>{{ $t('test.currentLang', { lang: currentLang }) }}</p>
    </div>

    <!-- 语言切换 -->
    <div class="language-switcher">
      <h3>{{ $t('test.switchLang') }}</h3>
      <div class="button-group">
        <button 
          :class="{ active: currentLang === 'zh-CN' }"
          class="lang-btn"
          @click="switchLanguage('zh-CN')"
        >
          中文
        </button>
        <button 
          :class="{ active: currentLang === 'en-US' }"
          class="lang-btn"
          @click="switchLanguage('en-US')"
        >
          English
        </button>
      </div>
    </div>

    <!-- 基础翻译测试 -->
    <div class="test-section">
      <h3>基础翻译测试 / Basic Translation Test</h3>
      <div class="test-grid">
        <div class="test-item">
          <label>home:</label>
          <span>{{ $t('home') }}</span>
        </div>
        <div class="test-item">
          <label>about:</label>
          <span>{{ $t('about') }}</span>
        </div>
        <div class="test-item">
          <label>login:</label>
          <span>{{ $t('login') }}</span>
        </div>
        <div class="test-item">
          <label>logout:</label>
          <span>{{ $t('logout') }}</span>
        </div>
      </div>
    </div>

    <!-- 按钮翻译测试 -->
    <div class="test-section">
      <h3>按钮翻译测试 / Button Translation Test</h3>
      <div class="button-showcase">
        <button class="demo-btn">{{ $t('button.submit') }}</button>
        <button class="demo-btn">{{ $t('button.cancel') }}</button>
        <button class="demo-btn">{{ $t('button.confirm') }}</button>
        <button class="demo-btn">{{ $t('button.delete') }}</button>
        <button class="demo-btn">{{ $t('button.edit') }}</button>
        <button class="demo-btn">{{ $t('button.save') }}</button>
      </div>
    </div>

    <!-- 嵌套键值测试 -->
    <div class="test-section">
      <h3>嵌套键值测试 / Nested Key Test</h3>
      <div class="test-grid">
        <div class="test-item">
          <label>page.home.title:</label>
          <span>{{ $t('page.home.title') }}</span>
        </div>
        <div class="test-item">
          <label>page.about.title:</label>
          <span>{{ $t('page.about.title') }}</span>
        </div>
        <div class="test-item">
          <label>page.login.title:</label>
          <span>{{ $t('page.login.title') }}</span>
        </div>
        <div class="test-item">
          <label>menu.dashboard:</label>
          <span>{{ $t('menu.dashboard') }}</span>
        </div>
      </div>
    </div>

    <!-- 参数插值测试 -->
    <div class="test-section">
      <h3>参数插值测试 / Parameter Interpolation Test</h3>
      <div class="interpolation-tests">
        <div class="test-item">
          <label>问候语 / Greeting:</label>
          <p class="greeting">{{ $t('page.home.greeting', { userName: testUserName }) }}</p>
        </div>
        <div class="test-item">
          <label>自定义问候 / Custom Greeting:</label>
          <p class="greeting">{{ $t('test.greeting', { name: testUserName }) }}</p>
        </div>
        <div class="test-item">
          <label>表单验证 / Form Validation:</label>
          <p>{{ $t('form.minLength', { min: 6 }) }}</p>
          <p>{{ $t('form.maxLength', { max: 20 }) }}</p>
        </div>
      </div>
    </div>

    <!-- 功能特性展示 -->
    <div class="test-section">
      <h3>{{ $t('test.features') }}</h3>
      <ul class="feature-list">
        <li>✅ {{ $t('test.feature1') }}</li>
        <li>✅ {{ $t('test.feature2') }}</li>
        <li>✅ {{ $t('test.feature3') }}</li>
        <li>✅ {{ $t('test.feature4') }}</li>
      </ul>
    </div>

    <!-- 状态信息 -->
    <div class="test-section">
      <h3>状态信息 / Status Information</h3>
      <div class="status-grid">
        <div class="status-item success">
          <span class="icon">✅</span>
          <span>{{ $t('success') }}</span>
        </div>
        <div class="status-item error">
          <span class="icon">❌</span>
          <span>{{ $t('error') }}</span>
        </div>
        <div class="status-item warning">
          <span class="icon">⚠️</span>
          <span>{{ $t('warning') }}</span>
        </div>
        <div class="status-item info">
          <span class="icon">ℹ️</span>
          <span>{{ $t('info') }}</span>
        </div>
      </div>
    </div>

    <!-- 实时测试区域 -->
    <div class="test-section">
      <h3>实时测试 / Live Test</h3>
      <div class="live-test">
        <input 
          v-model="customKey" 
          placeholder="输入翻译键 / Enter translation key"
          class="test-input"
        />
        <div class="test-result">
          <strong>结果 / Result:</strong> {{ $t(customKey) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { $t, useI18n2, getCurrentLang } from '@/locales2'

// 使用国际化Hook
const { setLang } = useI18n2()

// 响应式数据
const testUserName = ref('张三 / John')
const customKey = ref('home')

// 计算属性
const currentLang = computed(() => getCurrentLang())

// 方法
const switchLanguage = (lang: 'zh-CN' | 'en-US') => {
  setLang(lang)
}
</script>

<style scoped>
.i18n-test-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.header h1 {
  margin: 0 0 10px 0;
  font-size: 2.5em;
}

.header p {
  margin: 0;
  opacity: 0.9;
  font-size: 1.1em;
}

.language-switcher {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 15px;
}

.lang-btn {
  padding: 12px 24px;
  border: 2px solid #007bff;
  background: white;
  color: #007bff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.lang-btn:hover {
  background: #007bff;
  color: white;
  transform: translateY(-2px);
}

.lang-btn.active {
  background: #007bff;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: white;
}

.test-section h3 {
  margin: 0 0 20px 0;
  color: #495057;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.test-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.test-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.test-item label {
  font-weight: 600;
  color: #6c757d;
  min-width: 150px;
  margin-right: 15px;
}

.test-item span {
  color: #495057;
  font-weight: 500;
}

.button-showcase {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.demo-btn {
  padding: 10px 20px;
  border: 1px solid #dee2e6;
  background: #f8f9fa;
  color: #495057;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.demo-btn:hover {
  background: #e9ecef;
  transform: translateY(-1px);
}

.interpolation-tests .test-item {
  flex-direction: column;
  align-items: flex-start;
}

.greeting {
  margin: 8px 0 0 0;
  font-size: 1.1em;
  color: #28a745;
  font-weight: 500;
}

.feature-list {
  list-style: none;
  padding: 0;
}

.feature-list li {
  padding: 8px 0;
  font-size: 1.1em;
  color: #495057;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.status-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  font-weight: 500;
}

.status-item .icon {
  margin-right: 10px;
  font-size: 1.2em;
}

.status-item.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-item.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-item.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-item.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.live-test {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.test-input {
  padding: 12px;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.test-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.test-result {
  padding: 15px;
  background: #e9ecef;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
}

@media (max-width: 768px) {
  .i18n-test-page {
    padding: 10px;
  }
  
  .test-grid {
    grid-template-columns: 1fr;
  }
  
  .button-group {
    flex-direction: column;
    align-items: center;
  }
  
  .lang-btn {
    width: 200px;
  }
}
</style>