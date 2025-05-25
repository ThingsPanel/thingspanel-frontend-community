# ListPage 组件使用文档

## 概述

`ListPage` 是一个高度可定制的列表页面布局组件，旨在统一项目中列表页面的UI和交互体验，同时提供足够的灵活性来满足不同场景的需求。

## 特性

- 🔍 **智能搜索区域**：根据插槽内容自动显示/隐藏搜索区域
- 🎛️ **灵活的头部操作**：支持自定义左侧和右侧操作区域
- 👁️ **多视图切换**：支持卡片、列表、地图等多种视图模式
- 🔄 **内置刷新功能**：提供统一的刷新交互
- 📱 **响应式设计**：适配不同屏幕尺寸
- 🎨 **高度可定制**：通过插槽系统实现灵活的内容定制

## 基础用法

```vue
<template>
  <list-page>
    <!-- 搜索表单 -->
    <template #search-form-content>
      <n-form inline>
        <n-form-item label="名称">
          <n-input v-model:value="searchForm.name" placeholder="请输入名称" />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="searchForm.status" :options="statusOptions" />
        </n-form-item>
      </n-form>
    </template>

    <!-- 列表视图 -->
    <template #list-view>
      <n-data-table :columns="columns" :data="data" />
    </template>

    <!-- 分页 -->
    <template #footer>
      <n-pagination v-model:page="pagination.page" :page-count="pagination.pageCount" />
    </template>
  </list-page>
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `addButtonText` | `string \| (() => string)` | `''` | 新建按钮文本，支持函数形式 |
| `addButtonI18nKey` | `string` | `'card.addButton'` | 新建按钮国际化key |
| `initialView` | `string` | `''` | 初始视图类型 |
| `availableViews` | `ViewItem[]` | `[card, list, map]` | 可用的视图类型配置 |
| `showQueryButton` | `boolean` | `true` | 是否显示查询按钮 |
| `showResetButton` | `boolean` | `true` | 是否显示重置按钮 |

### ViewItem 接口

```typescript
interface ViewItem {
  key: string;        // 视图标识
  icon: any;          // 视图图标组件
  label?: string;     // 视图标签（国际化key）
}
```

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `query` | `filterData: Record<string, any>` | 查询事件 |
| `reset` | - | 重置事件 |
| `add-new` | - | 新建事件 |
| `view-change` | `{ viewType: string }` | 视图切换事件 |
| `refresh` | - | 刷新事件 |

### 插槽

#### 搜索区域插槽

| 插槽名 | 说明 |
|--------|------|
| `search-form-content` | 搜索表单内容 |

#### 头部操作插槽

| 插槽名 | 说明 |
|--------|------|
| `header-left` | 完全自定义左侧头部内容 |
| `add-button` | 自定义新建按钮（在默认左侧布局内） |
| `header-right` | 完全自定义右侧头部内容 |

#### 视图内容插槽

| 插槽名 | 说明 |
|--------|------|
| `card-view` | 卡片视图内容 |
| `list-view` | 列表视图内容 |
| `map-view` | 地图视图内容 |

#### 其他插槽

| 插槽名 | 说明 |
|--------|------|
| `footer` | 底部内容（通常用于分页） |

## 使用场景

### 1. 基础列表页面

```vue
<template>
  <list-page @query="handleQuery" @reset="handleReset" @add-new="handleAddNew">
    <template #search-form-content>
      <n-form ref="searchFormRef" inline :model="searchForm">
        <n-form-item label="名称" path="name">
          <n-input v-model:value="searchForm.name" placeholder="请输入名称" />
        </n-form-item>
      </n-form>
    </template>

    <template #list-view>
      <n-data-table :columns="columns" :data="data" :loading="loading" />
    </template>

    <template #footer>
      <n-pagination
        v-model:page="pagination.page"
        :page-count="pagination.pageCount"
        @update:page="handlePageChange"
      />
    </template>
  </list-page>
</template>
```

### 2. 多视图切换

```vue
<template>
  <list-page
    initial-view="card"
    @view-change="handleViewChange"
  >
    <template #search-form-content>
      <!-- 搜索表单 -->
    </template>

    <!-- 卡片视图 -->
    <template #card-view>
      <div class="card-grid">
        <div v-for="item in data" :key="item.id" class="card-item">
          <!-- 卡片内容 -->
        </div>
      </div>
    </template>

    <!-- 列表视图 -->
    <template #list-view>
      <n-data-table :columns="columns" :data="data" />
    </template>

    <!-- 地图视图 -->
    <template #map-view>
      <div class="map-container">
        <!-- 地图组件 -->
      </div>
    </template>
  </list-page>
</template>
```

### 3. 自定义头部操作

```vue
<template>
  <list-page>
    <!-- 完全自定义左侧 -->
    <template #header-left>
      <n-space>
        <n-button type="primary" @click="handleBatchImport">
          <template #icon><n-icon><upload-icon /></n-icon></template>
          批量导入
        </n-button>
        <n-button type="success" @click="handleAddNew">
          <template #icon><n-icon><plus-icon /></n-icon></template>
          新建项目
        </n-button>
      </n-space>
    </template>

    <!-- 自定义右侧 -->
    <template #header-right>
      <n-space>
        <n-button @click="handleExport">
          <template #icon><n-icon><download-icon /></n-icon></template>
          导出
        </n-button>
        <n-button @click="handleSettings">
          <template #icon><n-icon><settings-icon /></n-icon></template>
          设置
        </n-button>
        <n-button @click="handleRefresh">
          <template #icon><n-icon><refresh-icon /></n-icon></template>
          刷新
        </n-button>
      </n-space>
    </template>

    <template #list-view>
      <!-- 列表内容 -->
    </template>
  </list-page>
</template>
```

### 4. 简洁模式（无搜索区域）

```vue
<template>
  <list-page
    :show-query-button="false"
    :show-reset-button="false"
  >
    <!-- 不提供 search-form-content 插槽，搜索区域将被隐藏 -->

    <template #list-view>
      <n-data-table :columns="columns" :data="data" />
    </template>
  </list-page>
</template>
```

### 5. 只自定义新建按钮

```vue
<template>
  <list-page>
    <template #add-button>
      <n-dropdown :options="addOptions" @select="handleAddSelect">
        <n-button type="primary">
          <template #icon><n-icon><plus-icon /></n-icon></template>
          新建
          <template #suffix><n-icon><chevron-down-icon /></n-icon></template>
        </n-button>
      </n-dropdown>
    </template>

    <template #list-view>
      <!-- 列表内容 -->
    </template>
  </list-page>
</template>
```

## 事件处理示例

```vue
<script setup>
import { ref } from 'vue';

const searchForm = ref({
  name: '',
  status: null
});

const data = ref([]);
const loading = ref(false);

// 查询事件
const handleQuery = (filterData) => {
  console.log('查询参数:', searchForm.value);
  loadData();
};

// 重置事件
const handleReset = () => {
  searchForm.value = {
    name: '',
    status: null
  };
  loadData();
};

// 新建事件
const handleAddNew = () => {
  // 跳转到新建页面或打开新建弹窗
  console.log('新建操作');
};

// 视图切换事件
const handleViewChange = ({ viewType }) => {
  console.log('切换到视图:', viewType);
  // 可以根据视图类型调整数据加载方式
};

// 刷新事件
const handleRefresh = () => {
  loadData();
};

const loadData = async () => {
  loading.value = true;
  try {
    // 加载数据逻辑
    // const result = await api.getData(searchForm.value);
    // data.value = result.data;
  } finally {
    loading.value = false;
  }
};
</script>
```

## 样式定制

组件提供了以下CSS类名供样式定制：

```scss
.advanced-list-layout {
  // 主容器

  .search {
    // 搜索区域

    .search-form-content {
      // 搜索表单内容区域
    }

    .search-button {
      // 搜索按钮区域
    }
  }

  .list-content {
    // 内容区域

    .list-content-header {
      // 头部区域

      .list-content-header-left {
        // 左侧操作区域
      }

      .list-content-header-right {
        // 右侧操作区域
      }
    }

    .list-content-body {
      // 主体内容区域

      .view-wrapper {
        // 视图包装器
      }
    }
  }
}

.list-content-footer {
  // 底部区域
}
```

## 注意事项

1. **搜索区域显示逻辑**：只有当存在 `search-form-content` 插槽或者 `showQueryButton`/`showResetButton` 为 true 时，搜索区域才会显示。

2. **视图切换**：视图切换器只有在存在多个视图对应的插槽时才会显示。

3. **事件处理**：查询和重置事件需要父组件自行处理表单数据的收集和清空。

4. **插槽优先级**：`header-left` 插槽会完全替换默认的新建按钮，如果只想自定义新建按钮，请使用 `add-button` 插槽。

5. **国际化**：组件内置了国际化支持，确保项目中已正确配置国际化。

## 更新日志

### v1.1.0
- ✨ 新增搜索区域智能显示功能
- ✨ 新增头部操作区域插槽化
- ✨ 新增 `add-button` 插槽支持
- 🐛 修复视图切换时的样式问题
- 📝 完善使用文档和示例
