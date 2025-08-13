<!--
  配置驱动的动态数据源重构方案测试页面
  路径：/test/config-driven-data-source
-->

<template>
  <div class="test-page">
    <ConfigDrivenDataSourceTest />
  </div>
</template>

<script setup lang="ts">
/**
 * 配置驱动的动态数据源重构方案测试页面
 */

import ConfigDrivenDataSourceTest from '@/card2.1/components/ConfigDrivenDataSourceTest.vue'

// 页面元信息
defineOptions({
  name: 'ConfigDrivenDataSourceTestPage'
})
</script>

<route lang="yaml">
meta:
  title: 配置驱动数据源测试
  i18nKey: route.config_driven_data_source_test
  hideInMenu: false
  order: 99
  icon: mdi:database-cog
  localIcon: test
</route>

<style scoped>
.test-page {
  width: 100%;
  height: 100%;
  overflow: auto;
}
</style>
