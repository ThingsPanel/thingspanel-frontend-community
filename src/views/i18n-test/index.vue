<template>
  <div>
    <h2>国际化测试页面</h2>
    <div>
      <button @click="setLang('zh-CN')">中文</button>
      <button @click="setLang('en-US')">English</button>
    </div>
    <div style="margin-top: 20px;">
      <p>{{ t('button.submit') }}</p>
      <p>{{ t('home') }}</p>
      <p>{{ t('page.home.greeting', { userName: '测试用户' }) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n2 } from '@/locales2/useI18n2'

const { t, setLang } = useI18n2()
</script> 