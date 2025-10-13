<template>
  <div class="category-test">
    <h1>分类系统测试</h1>
    <n-button @click="testComponentTree">测试 getComponentTree()</n-button>
    
    <div v-if="componentTree">
      <h2>分类统计结果</h2>
      <n-data-table :columns="columns" :data="categoryStats" />
      
      <h2>详细组件列表</h2>
      <n-data-table :columns="detailColumns" :data="componentDetails" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NDataTable } from 'naive-ui'
import { getComponentTree } from '@/card2.1/index'

const componentTree = ref<any>(null)
const categoryStats = ref<any[]>([])
const componentDetails = ref<any[]>([])

const columns = [
  { title: '分类', key: 'category' },
  { title: '组件数量', key: 'count' }
]

const detailColumns = [
  { title: '组件名称', key: 'name' },
  { title: '主分类', key: 'mainCategory' },
  { title: '子分类', key: 'subCategory' },
  { title: '完整路径', key: 'path' }
]

const testComponentTree = async () => {
  try {
    componentTree.value = getComponentTree()
    
    // 统计分类
    const stats: Record<string, number> = {}
    const details: any[] = []
    
    // 正确遍历 components 数组
    componentTree.value.components.forEach((component: any) => {
      const category = `${component.mainCategory}/${component.subCategory}`
      stats[category] = (stats[category] || 0) + 1
      
      details.push({
        name: component.name,
        mainCategory: component.mainCategory,
        subCategory: component.subCategory,
        type: component.type
      })
    })
    
    categoryStats.value = Object.entries(stats).map(([category, count]) => ({
      category,
      count
    }))
    
    componentDetails.value = details
    
    console.log('分类系统测试结果:', componentTree.value)
  } catch (error) {
    console.error('测试失败:', error)
  }
}
</script>

<style scoped>
.category-test {
  padding: 20px;
}
</style>