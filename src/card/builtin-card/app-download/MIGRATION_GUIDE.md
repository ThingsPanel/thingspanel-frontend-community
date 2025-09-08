# App Download 组件迁移指南

## 📋 组件概述

### 基本信息
- **组件ID**: `app-download`
- **组件名称**: 应用下载卡片
- **文件路径**: `src/card/builtin-card/app-download/`
- **组件类型**: 静态展示组件
- **当前状态**: ⚠️ 功能简单，需要增强

### 功能描述
展示移动应用的下载信息，包含二维码扫描和应用商店链接。提供用户下载移动端应用的入口，支持iOS和Android平台。

## 🔧 技术分析

### 使用的资源文件
```typescript
// 静态图片资源
import download_app from './download_app.png'      // 下载二维码
import app_store from './placeholder-app-store.png' // App Store图标
import google_pla from './placeholder-google-play.png' // Google Play图标
```

### 技术依赖
- **Vue 3**: Composition API, `<script setup>`
- **静态资源**: PNG图片文件
- **样式**: Tailwind CSS / UnoCSS 工具类
- **国际化**: `$t()` 翻译函数

### 组件结构
```vue
<template>
  <div class="container">
    <div class="title">{{ title }}</div>
    <div class="content">
      <img class="qr-code" /> <!-- 二维码 -->
      <div class="store-links">
        <img class="app-store-icon" /> <!-- App Store -->
        <img class="google-play-icon" /> <!-- Google Play -->
      </div>
    </div>
    <div class="description">{{ description }}</div>
  </div>
</template>
```

## ❌ 存在问题

### 功能缺失问题
1. **缺少实际链接**:
   ```vue
   <!-- ❌ 问题: 图片只是显示，没有实际点击功能 -->
   <img :src="app_store" alt="App Store" class="h-10 cursor-pointer" />
   
   <!-- ✅ 建议: 添加实际链接 -->
   <a :href="appStoreUrl" target="_blank">
     <img :src="app_store" alt="App Store" />
   </a>
   ```

2. **占位图片**:
   ```typescript
   // ❌ 问题: 使用placeholder图片，不是真实的应用商店图标
   import app_store from './placeholder-app-store.png'
   
   // ✅ 建议: 使用真实的应用商店图标或SVG
   import { AppleOutline, LogoGooglePlaystore } from '@vicons/ionicons5'
   ```

### 代码质量问题
1. **国际化使用方式**:
   ```typescript
   // ❌ 问题: 直接导入$t而非使用hook
   import { $t } from '@/locales'
   
   // ✅ 建议: 使用Vue 3推荐的hook方式
   import { useI18n } from 'vue-i18n'
   const { t } = useI18n()
   ```

2. **静态配置**:
   ```vue
   <!-- ❌ 问题: 所有内容都是硬编码，无法配置 -->
   <img :src="download_app" alt="QR Code" class="w-24 h-24" />
   
   <!-- ✅ 建议: 支持配置化 -->
   <img :src="config.qrCodeUrl" :alt="t('appDownload.qrCodeAlt')" />
   ```

3. **可访问性不足**:
   ```vue
   <!-- ❌ 问题: 缺少语义化和可访问性支持 -->
   <div class="flex flex-col space-y-2">
   
   <!-- ✅ 建议: 改进语义化 -->
   <nav class="download-links" role="navigation" aria-label="App download links">
   ```

### 用户体验问题
1. **缺少下载统计**: 无法跟踪用户点击和下载情况
2. **缺少平台检测**: 不能根据用户平台显示对应的下载选项
3. **缺少二维码生成**: 二维码是静态图片，无法动态更新
4. **响应式问题**: 在小屏幕上显示可能不佳

## 🔄 迁移建议

### 迁移策略: 独立组件增强
**建议将 `app-download` 重构为符合 Card 2.1 "三文件架构" 的 `AppPromotion` 独立组件，进行功能增强和用户体验优化。**

#### 原因分析
1. **功能独特**: 应用下载功能具有特定的业务场景，适合作为独立组件。
2. **可配置需求**: 不同项目的下载链接和二维码不同，需要高度可配置。
3. **扩展空间**: 可以发展为完整的应用推广组件，集成统计、平台检测等高级功能。
4. **架构统一**: 遵循 Card 2.1 规范，便于维护和系统集成。

#### 优化方向
1. **动态配置**: 支持配置下载链接、二维码、图标、布局等。
2. **平台检测**: 根据用户设备智能显示下载选项。
3. **统计功能**: 添加下载点击统计。
4. **二维码生成**: 支持动态生成二维码。
5. **三文件架构**: 严格遵循 Card 2.1 的 `index.vue`, `definition.ts`, `settingConfig.ts` 结构。

## 🚀 具体迁移步骤

### Phase 1: 创建 Card 2.1 `AppPromotion` 组件

#### 1.1 创建文件结构
在 `src/card2.1/components/` 目录下创建 `app-promotion` 文件夹，并包含以下文件：
```
app-promotion/
├── index.vue              # 主组件 (UI和交互)
├── definition.ts          # 组件定义 (元数据和注册)
├── settingConfig.ts       # 配置定义 (类型和设置UI)
├── setting.vue            # 设置界面 (使用AutoFormGenerator)
└── index.ts               # 统一导出
```

#### 1.2 `settingConfig.ts` - 配置定义
此文件负责定义组件的所有可配置项及其在设置面板中的展现方式。

```typescript
// src/card2.1/components/app-promotion/settingConfig.ts
import type { ComponentSettingConfig, CustomConfig } from '@/card2.1/types/setting-config'
import { createSetting, createCustomConfig, SettingControlType } from '@/card2.1/types/setting-config'

// 1. 定义平台对象的接口
export interface PlatformLink {
  name: string
  icon: string
  url: string
  enabled: boolean
}

// 2. 定义组件特有的 customize 接口
export interface AppPromotionCustomize {
  title: string
  description: string
  qrCode: {
    url: string
    size: number
    autoGenerate: boolean
  }
  platforms: PlatformLink[]
  layout: 'vertical' | 'horizontal' | 'compact'
  enableAnalytics: boolean
  autoDetectPlatform: boolean
}

// 3. 定义完整的设置配置
export const appPromotionSettingConfig: ComponentSettingConfig<AppPromotionCustomize> = {
  componentType: 'AppPromotion',
  settings: [
    // ... 内容设置 ...
    createSetting(SettingControlType.INPUT, '标题', 'customize.title', {
      group: '内容设置',
      defaultValue: '应用下载',
    }),
    createSetting(SettingControlType.TEXTAREA, '描述文本', 'customize.description', {
      group: '内容设置',
      defaultValue: '扫码下载或点击商店链接',
    }),
    // ... 二维码设置 ...
    createSetting(SettingControlType.INPUT, '下载链接', 'customize.qrCode.url', {
      group: '二维码设置',
      defaultValue: 'https://thingspanel.io/app/download',
    }),
    createSetting(SettingControlType.INPUT_NUMBER, '二维码尺寸', 'customize.qrCode.size', {
      group: '二维码设置',
      defaultValue: 120,
      min: 50,
      max: 300,
    }),
    createSetting(SettingControlType.SWITCH, '自动生成二维码', 'customize.qrCode.autoGenerate', {
      group: '二维码设置',
      defaultValue: true,
    }),
    // ... 平台设置 ...
    createSetting(SettingControlType.ARRAY, '支持平台', 'customize.platforms', {
        group: '平台设置',
        itemPrototype: {
            name: 'new platform',
            icon: 'logo-google-playstore',
            url: '',
            enabled: true,
        },
        columns: [
            { type: 'input', key: 'name', label: '平台名称' },
            { type: 'input', key: 'icon', label: '图标(Ionicon)' },
            { type: 'input', key: 'url', label: '下载链接' },
            { type: 'switch', key: 'enabled', label: '启用' },
        ]
    }),
    // ... 样式和行为设置 ...
    createSetting(SettingControlType.SELECT, '布局模式', 'customize.layout', {
      group: '样式和行为',
      options: [
        { label: '垂直布局', value: 'vertical' },
        { label: '水平布局', value: 'horizontal' },
        { label: '紧凑布局', value: 'compact' }
      ],
      defaultValue: 'vertical',
    }),
    createSetting(SettingControlType.SWITCH, '启用下载统计', 'customize.enableAnalytics', {
      group: '样式和行为',
      defaultValue: false,
    }),
    createSetting(SettingControlType.SWITCH, '自动检测设备平台', 'customize.autoDetectPlatform', {
      group: '样式和行为',
      defaultValue: true,
    }),
  ],
  // 4. 定义默认的 customConfig
  customConfig: createCustomConfig<AppPromotionCustomize>('AppPromotion', {
    title: '应用下载',
    description: '扫码下载或点击商店链接',
    qrCode: {
      url: 'https://thingspanel.io/app/download',
      size: 120,
      autoGenerate: true
    },
    platforms: [
      { name: 'iOS', icon: 'logo-apple', url: 'https://apps.apple.com/app/yourapp', enabled: true },
      { name: 'Android', icon: 'logo-google-playstore', url: 'https://play.google.com/store/apps/details?id=yourapp', enabled: true }
    ],
    layout: 'vertical',
    enableAnalytics: false,
    autoDetectPlatform: true
  })
}

// 5. 导出类型
export type AppPromotionConfig = CustomConfig<AppPromotionCustomize>
```

#### 1.3 `definition.ts` - 组件定义
此文件负责定义组件的元数据，并将其注册到系统中。

```typescript
// src/card2.1/components/app-promotion/definition.ts
import type { ComponentDefinition } from '@/card2.1/core/types'
import { componentRegistry } from '@/card2.1/core/component-registry'
import AppPromotionVue from './index.vue'
import AppPromotionSetting from './setting.vue'
import { appPromotionSettingConfig } from './settingConfig'

const definition: ComponentDefinition = {
  type: 'AppPromotion',
  name: '应用推广',
  description: '展示应用下载信息和二维码的推广组件。',
  category: 'marketing',
  component: AppPromotionVue,
  configComponent: AppPromotionSetting,
  defaultConfig: appPromotionSettingConfig.customConfig,
  defaultLayout: {
    gridstack: { w: 3, h: 4, minW: 2, minH: 3 },
  },
  features: {
    configurable: true,
    interactive: true,
    themeable: true,
    responsive: true,
  },
  // 该组件为纯静态展示和配置，不需要数据源
  dataSources: [],
}

// 注册组件和设置
componentRegistry.registerComponent(definition)
componentRegistry.registerSettingConfig(appPromotionSettingConfig)

export default definition
```

#### 1.4 `index.vue` - 组件实现
这是组件的 UI 实现，与原始迁移指南中的 `AppPromotion.vue` 内容基本一致，但 props 定义需要更新以匹配 `settingConfig.ts`。

```vue
<!-- src/card2.1/components/app-promotion/index.vue -->
<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import QRCode from 'qrcode'
import type { AppPromotionConfig } from './settingConfig'

interface Props {
  customConfig?: AppPromotionConfig
}

const props = withDefaults(defineProps<Props>(), {
  customConfig: undefined,
})

const emit = defineEmits<{
  (e: 'downloadClick', platform: string, url: string): void
}>()

const { t } = useI18n()

// 从 customConfig 中获取配置
const config = computed(() => props.customConfig?.customize)

const qrCodeDataUrl = ref('')
const currentPlatform = ref('')

const detectPlatform = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(userAgent)) return 'iOS'
  if (/android/.test(userAgent)) return 'Android'
  return ''
}

const visiblePlatforms = computed(() => {
  if (!config.value) return []
  let platforms = config.value.platforms.filter(p => p.enabled)
  if (config.value.autoDetectPlatform && currentPlatform.value) {
    platforms = platforms.sort(p => p.name === currentPlatform.value ? -1 : 1)
  }
  return platforms
})

const generateQRCode = async () => {
  if (!config.value?.qrCode.autoGenerate || !config.value?.qrCode.url) return
  try {
    qrCodeDataUrl.value = await QRCode.toDataURL(config.value.qrCode.url, {
      width: config.value.qrCode.size,
      margin: 1,
    })
  } catch (error) {
    console.error('生成二维码失败:', error)
  }
}

const handleDownloadClick = (platform: any, event: Event) => {
  event.preventDefault()
  if (config.value?.enableAnalytics) {
    console.log(`下载点击统计: ${platform.name}`)
  }
  window.open(platform.url, '_blank', 'noopener,noreferrer')
  emit('downloadClick', platform.name, platform.url)
}

onMounted(() => {
  currentPlatform.value = detectPlatform()
  generateQRCode()
})
</script>

<template>
  <div v-if="config" class="app-promotion-card" :class="`layout-${config.layout}`">
    <div class="header">
      <h3 class="title">{{ t(config.title) }}</h3>
    </div>
    <div class="content">
      <div v-if="config.qrCode.url" class="qr-section">
        <div class="qr-container">
          <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="QR Code" class="qr-image" />
          <div v-else class="qr-placeholder"><n-spin size="small" /></div>
        </div>
        <div class="qr-tip">{{ t('appPromotion.scanTip') }}</div>
      </div>
      <div class="platforms-section">
        <div class="platforms-title">{{ t('appPromotion.downloadFrom') }}</div>
        <div class="platforms-list">
          <a
            v-for="platform in visiblePlatforms"
            :key="platform.name"
            :href="platform.url"
            class="platform-link"
            :class="{ 'primary-platform': platform.name === currentPlatform }"
            @click="handleDownloadClick(platform, $event)"
          >
            <n-icon size="24" class="platform-icon"><component :is="platform.icon" /></n-icon>
            <span class="platform-name">{{ platform.name }}</span>
            <n-tag v-if="platform.name === currentPlatform" size="small" type="primary" class="recommend-tag">
              {{ t('appPromotion.recommended') }}
            </n-tag>
          </a>
        </div>
      </div>
    </div>
    <div v-if="config.description" class="footer">
      <p class="description">{{ t(config.description) }}</p>
    </div>
  </div>
</template>

<style scoped>
/* 样式与原迁移指南保持一致，此处省略... */
.app-promotion-card { padding: 20px; height: 100%; display: flex; flex-direction: column; background: var(--card-color); border-radius: var(--border-radius); border: 1px solid var(--border-color); }
.header { margin-bottom: 16px; }
.title { font-size: 18px; font-weight: 600; color: var(--text-color); margin: 0 0 8px 0; }
.content { flex: 1; display: flex; gap: 20px; }
.layout-vertical .content { flex-direction: column; align-items: center; }
.layout-horizontal .content { flex-direction: row; align-items: flex-start; }
.qr-section { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.qr-container { padding: 8px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
.qr-image { display: block; border-radius: 4px; }
.qr-placeholder { width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; border: 2px dashed var(--border-color); border-radius: 4px; }
.qr-tip { font-size: 12px; color: var(--text-color-2); text-align: center; }
.platforms-section { flex: 1; }
.platforms-title { font-size: 14px; font-weight: 500; color: var(--text-color); margin-bottom: 12px; }
.platforms-list { display: flex; flex-direction: column; gap: 8px; }
.platform-link { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); text-decoration: none; color: var(--text-color); background: var(--body-color); transition: all 0.2s; position: relative; }
.platform-link:hover { border-color: var(--primary-color); background: var(--primary-color-hover); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
.primary-platform { border-color: var(--primary-color); background: var(--primary-color-pressed); }
.platform-icon { color: var(--text-color); }
.platform-name { font-weight: 500; flex: 1; }
.recommend-tag { position: absolute; top: -6px; right: 8px; }
.footer { margin-top: 16px; text-align: center; }
.description { font-size: 13px; color: var(--text-color-2); margin: 0; }
</style>
```

#### 1.5 `setting.vue` - 设置界面
此文件使用 `AutoFormGenerator` 自动生成设置面板。

```vue
<!-- src/card2.1/components/app-promotion/setting.vue -->
<template>
  <div class="app-promotion-setting">
    <AutoFormGenerator
      :setting-config="appPromotionSettingConfig"
      :model-value="localConfig"
      @update:model-value="handleConfigChange"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import AutoFormGenerator from '@/card2.1/components/common/AutoFormGenerator.vue'
import { appPromotionSettingConfig } from './settingConfig'
import type { AppPromotionConfig } from './settingConfig'

const props = defineProps<{ modelValue?: AppPromotionConfig }>()
const emit = defineEmits<{ (e: 'update:modelValue', config: AppPromotionConfig): void }>()

const localConfig = reactive(props.modelValue || appPromotionSettingConfig.customConfig)

watch(() => props.modelValue, (newValue) => {
  if (newValue) Object.assign(localConfig, newValue)
}, { deep: true })

const handleConfigChange = (newConfig: AppPromotionConfig) => {
  emit('update:modelValue', newConfig)
}
</script>

<style scoped>
.app-promotion-setting { padding: 16px; }
</style>
```

#### 1.6 `index.ts` - 统一导出

```typescript
// src/card2.1/components/app-promotion/index.ts
export { default } from './definition'
export * from './settingConfig'
```

### Phase 2: 创建预设配置
创建一个预设，方便用户快速使用。

```typescript
// src/card2.1/presets/thingspanel-app-download.ts
import type { ComponentPreset } from '@/card2.1/core/types'
import { appPromotionSettingConfig } from '@/card2.1/components/app-promotion'

export const thingspanelAppPreset: ComponentPreset = {
  id: 'thingspanel-app-download',
  name: 'ThingsPanel应用下载',
  description: '展示ThingsPanel移动应用的下载信息',
  type: 'AppPromotion',
  
  // 直接引用 settingConfig 中的默认配置，并按需覆盖
  config: {
    ...appPromotionSettingConfig.customConfig,
    customize: {
        ...appPromotionSettingConfig.customConfig.customize,
        title: 'card.appDownload.title',
        description: 'card.appDownload.scanOrClick',
        qrCode: {
            url: 'https://thingspanel.io/app/download',
            size: 120,
            autoGenerate: true
        },
        platforms: [
            { name: 'iOS', icon: 'logo-apple', url: 'https://apps.apple.com/app/thingspanel', enabled: true },
            { name: 'Android', icon: 'logo-google-playstore', url: 'https://play.google.com/store/apps/details?id=io.thingspanel.app', enabled: true },
            { name: 'APK', icon: 'download-outline', url: 'https://github.com/ThingsPanel/thingspanel-app/releases/latest', enabled: true }
        ],
        enableAnalytics: true,
    }
  },
  
  defaultLayout: {
    gridstack: { w: 3, h: 4 }
  }
}
```

## ✅ 迁移验证清单

### 功能验证清单
- [ ] **三文件架构**: 确认 `index.vue`, `definition.ts`, `settingConfig.ts` 结构正确。
- [ ] **组件注册**: 组件在 Card 2.1 组件库中可见。
- [ ] **设置面板**: 设置面板能正确显示并修改所有配置项。
- [ ] **二维码生成**: 动态生成二维码，支持自定义链接。
- [ ] **平台检测**: 自动检测用户设备并推荐对应平台。
- [ ] **下载链接**: 点击平台图标正确跳转到下载页面。
- [ ] **响应式**: 在不同屏幕尺寸下布局合适。
- [ ] **主题适配**: 支持明暗主题切换。
- [ ] **国际化**: 所有文本支持多语言切换。

## 📚 相关资源

### 依赖库
```bash
# 需要安装的依赖
npm install qrcode
npm install @types/qrcode --save-dev
```

### 国际化配置
```typescript
// 需要添加的翻译键
const translations = {
  'card.appDownload.title': '应用下载',
  'card.appDownload.scanOrClick': '扫码下载或点击商店链接',
  'appPromotion.scanTip': '使用手机扫码下载',
  'appPromotion.downloadFrom': '下载渠道',
  'appPromotion.recommended': '推荐',
}
```

## 🎯 预期收益

迁移到 Card 2.1 架构后，`AppPromotion` 组件将获得：
- **架构一致性**: 与系统其他组件保持统一，降低维护成本。
- **高度可配置**: 通过设置面板轻松定制所有内容。
- **功能可扩展**: 易于增加新功能，如下载统计、A/B测试等。
- **更好的开发体验**: 类型安全和职责分离，提升开发效率和代码质量。