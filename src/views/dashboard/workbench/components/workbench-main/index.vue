<script setup lang="ts">
import { $t } from '@/locales';
import { ShortcutsCard, TechnologyCard } from './components';

defineOptions({ name: 'DashboardWorkbenchMain' });

interface Technology {
  id: number;
  name: string;
  description: string;
  author: string;
  site: string;
  icon: string;
  iconColor?: string;
}

const technology: Technology[] = [
  {
    id: 0,
    name: 'Vue',
    description: '一套用于构建用户界面的渐进式框架',
    author: '尤雨溪 - Evan You',
    site: 'https://v3.cn.vuejs.org/',
    icon: 'logos:vue'
  },
  {
    id: 1,
    name: 'TypeScript',
    description: 'JavaScript类型的超集，它可以编译成纯JavaScript',
    author: '微软 - Microsoft',
    site: 'https://www.typescriptlang.org/',
    icon: 'logos:typescript-icon'
  },
  {
    id: 2,
    name: 'Vite',
    description: '下一代前端开发与构建工具',
    author: '尤雨溪 - Evan You',
    site: 'https://vitejs.cn/',
    icon: 'logos:vitejs'
  },
  {
    id: 3,
    name: 'NaiveUI',
    description: '一个 Vue 3 组件库',
    author: '图森未来 - TuSimple',
    site: 'https://www.naiveui.com/zh-CN/os-theme',
    icon: 'logos:naiveui'
  },
  {
    id: 4,
    name: 'UnoCSS',
    description: '下一代实用优先的CSS框架',
    author: 'Anthony Fu',
    site: 'https://uno.antfu.me/?s=',
    icon: 'logos:unocss'
  },
  {
    id: 5,
    name: 'Pinia',
    description: 'vue状态管理框架，支持vue2、vue3',
    author: 'Posva',
    site: 'https://pinia.esm.dev/',
    icon: 'noto:pineapple'
  }
];

interface Activity {
  id: number;
  content: string;
  time: string;
}

const activity: Activity[] = [
  {
    id: 4,
    content: 'Soybean 刚才把工作台页面随便写了一些，凑合能看了！',
    time: '2021-11-07 22:45:32'
  },
  {
    id: 3,
    content: 'Soybean 正在忙于为soybean-admin写项目说明文档！',
    time: '2021-11-03 20:33:31'
  },
  {
    id: 2,
    content: 'Soybean 准备为soybean-admin 1.0的发布做充分的准备工作！',
    time: '2021-10-31 22:43:12'
  },
  {
    id: 1,
    content: '@yanbowe 向soybean-admin提交了一个bug，多标签栏不会自适应。',
    time: '2021-10-27 10:24:54'
  },
  {
    id: 0,
    content: 'Soybean 在2021年5月28日创建了开源项目soybean-admin！',
    time: '2021-05-28 22:22:22'
  }
];

interface Shortcuts {
  id: number;
  label: string;
  icon: string;
  iconColor: string;
}

const shortcuts: Shortcuts[] = [
  {
    id: 0,
    label: '主控台',
    icon: 'mdi:desktop-mac-dashboard',
    iconColor: '#409eff'
  },
  {
    id: 1,
    label: '系统管理',
    icon: 'ic:outline-settings',
    iconColor: '#7238d1'
  },
  { id: 2, label: '权限管理', icon: 'mdi:family-tree', iconColor: '#f56c6c' },
  {
    id: 3,
    label: '组件',
    icon: 'fluent:app-store-24-filled',
    iconColor: '#19a2f1'
  },
  { id: 4, label: '表格', icon: 'mdi:table-large', iconColor: '#fab251' },
  { id: 5, label: '图表', icon: 'mdi:chart-areaspline', iconColor: '#8aca6b' }
];
</script>

<template>
  <NGrid :item-responsive="true" :x-gap="16" :y-gap="16">
    <NGridItem span="0:24 640:24 1024:16">
      <NSpace :vertical="true" :size="16">
        <NCard
          :title="$t('generate.project-main-tech-stack')"
          :bordered="false"
          size="small"
          class="rounded-8px shadow-sm"
        >
          <template #header-extra>
            <a class="text-primary" href="javascript:;">{{ $t('generate.more-tech-stack') }}</a>
          </template>
          <NGrid :item-responsive="true" responsive="screen" cols="m:2 l:3" :x-gap="8" :y-gap="8">
            <NGridItem v-for="item in technology" :key="item.id">
              <TechnologyCard v-bind="item" />
            </NGridItem>
          </NGrid>
        </NCard>
        <NCard :title="$t('generate.dynamic')" :bordered="false" size="small" class="rounded-8px shadow-sm">
          <template #header-extra>
            <a class="text-primary" href="javascript:;">{{ $t('generate.more-dynamics') }}</a>
          </template>
          <NList>
            <NListItem v-for="item in activity" :key="item.id">
              <template #prefix>
                <IconLocalAvatar class="text-48px" />
              </template>
              <NThing :title="item.content" :description="item.time" />
            </NListItem>
          </NList>
        </NCard>
      </NSpace>
    </NGridItem>
    <NGridItem span="0:24 640:24 1024:8">
      <NSpace :vertical="true" :size="16">
        <NCard :title="$t('generate.quick-operation')" :bordered="false" size="small" class="rounded-8px shadow-sm">
          <NGrid :item-responsive="true" responsive="screen" cols="m:2 l:3" :x-gap="8" :y-gap="8">
            <NGridItem v-for="item in shortcuts" :key="item.id">
              <ShortcutsCard v-bind="item" />
            </NGridItem>
          </NGrid>
        </NCard>
        <NCard :title="$t('generate.creativity')" :bordered="false" size="small" class="rounded-8px shadow-sm">
          <div class="h-380px flex-center">
            <IconLocalBanner class="text-400px text-primary sm:text-320px" />
          </div>
        </NCard>
      </NSpace>
    </NGridItem>
  </NGrid>
</template>

<style scoped></style>
