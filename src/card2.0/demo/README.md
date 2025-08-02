# Card 2.0 Demo

这是 Card 2.0 架构的演示目录。

## 文件说明

- `index.vue` - Vue 3 组件演示页面，展示 Card 2.0 架构的设计理念和特性
- `README.md` - 本说明文件

## 使用方式

这是一个标准的 Vue 3 组件，可以通过以下方式使用：

1. 在路由中注册该组件
2. 或者在其他 Vue 组件中直接导入使用

```vue
<template>
  <Card2Demo />
</template>

<script setup>
import Card2Demo from '@/card2.0/demo/index.vue'
</script>
```

## 注意事项

- 这是一个 Vue 3 Composition API 组件
- 使用了 Naive UI 组件库和 Iconify 图标
- 实际的 Card 2.0 组件正在开发中
- 完成后将直接集成到 ThingsPanel 的主项目中

## 集成计划

Card 2.0 架构将按照以下步骤集成到主项目：

1. ✅ 主题系统适配
2. ✅ 类型系统统一
3. 🔄 组件迁移（进行中）
4. ⏳ 渲染器集成
5. ⏳ 数据系统迁移
6. ⏳ 测试和优化

完成后，此演示页面将被移除或转换为文档页面。