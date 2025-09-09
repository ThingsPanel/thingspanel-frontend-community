# ThingsPanel 项目开发强制规则

**🚨 CRITICAL: 以下规则必须严格遵守，违反将导致代码不被接受**

## 规则1：UI组件强制使用Naive UI
**MUST** 优先使用 Naive UI 组件，**NEVER** 创建重复的自定义组件

```vue
<!-- ✅ 正确做法 -->
<n-button type="primary">{{ $t('common.confirm') }}</n-button>
<n-input v-model:value="inputValue" />
<n-data-table :data="tableData" :columns="columns" />

<!-- ❌ 绝对禁止 -->
<button class="custom-btn">确认</button>
<input class="my-input" />
<table class="custom-table">...</table>
```

**检查清单**：
- [ ] 是否有对应的 Naive UI 组件？
- [ ] 如果有，**必须**使用 Naive UI 版本
- [ ] 如果没有，才允许自定义实现

## 规则2：主题系统强制集成
当**无法使用** Naive UI 时，**MUST** 集成主题系统

```vue
<script setup lang="ts">
// 强制导入主题store
import { useThemeStore } from '@/store/modules/theme'
const themeStore = useThemeStore()
</script>

<template>
  <div class="custom-component">内容</div>
</template>

<style scoped>
.custom-component {
  /* 强制使用CSS变量，禁止硬编码颜色 */
  color: var(--text-color);
  background: var(--card-color);
  border: 1px solid var(--border-color);
  
  /* ❌ 绝对禁止硬编码颜色 */
  /* color: #333; background: #fff; */
}
</style>
```

## 规则3：国际化强制实施
**ALL** TypeScript 和 Vue 代码中的用户可见文本**MUST**使用国际化

**国际化文件路径**: `/src/locales/langs/`

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <!-- ✅ 正确：使用国际化 -->
  <n-button>{{ $t('common.save') }}</n-button>
  <span>{{ $t('device.status.online') }}</span>
  
  <!-- ❌ 绝对禁止硬编码文本 -->
  <!-- <n-button>保存</n-button> -->
  <!-- <span>在线</span> -->
</template>
```

**检查流程**：
1. 检查 `/src/locales/langs/zh-cn/` 中是否已有对应翻译
2. 如果没有，**必须**先添加翻译键值对
3. 使用 `$t('key')` 或 `t('key')` 替代硬编码文本

## 规则4：中文注释强制要求
**ALL** 代码**MUST**包含中文注释，特别是：

```typescript
/**
 * 设备状态管理器
 * 负责处理设备的在线/离线状态检测和更新
 */
export class DeviceStatusManager {
  // 设备连接超时时间（毫秒）
  private readonly CONNECTION_TIMEOUT = 5000
  
  /**
   * 检查设备连接状态
   * @param deviceId 设备ID
   * @returns Promise<boolean> 设备是否在线
   */
  async checkDeviceStatus(deviceId: string): Promise<boolean> {
    // 发送心跳包检测设备状态
    const response = await this.sendHeartbeat(deviceId)
    return response.success
  }
}
```

**强制注释点**：
- [ ] 类/接口定义必须有中文说明
- [ ] 复杂方法必须有中文注释
- [ ] 关键业务逻辑必须有行内注释
- [ ] 常量/配置项必须说明用途

## 规则5：中文优先交流
**回复和交流尽可能使用中文**，除非：
- 涉及技术术语需要保持英文准确性
- 代码示例中的标识符（变量名、函数名等）
- 已有的英文API或库名称

---

## 🔍 自检清单（每次提交前必检）

- [ ] 是否优先使用了 Naive UI 组件？
- [ ] 自定义样式是否集成了主题系统？
- [ ] 所有用户可见文本是否使用了国际化？
- [ ] 代码是否包含足够的中文注释？
- [ ] 回复是否使用中文进行说明？

## 🚨 违规后果

- **自动检查**: `pnpm quality-check` 将检测这些违规行为
- **代码审查**: 违规代码将被拒绝合并
- **重构要求**: 必须按规则重新编写违规代码

