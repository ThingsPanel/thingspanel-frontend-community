import { defineAsyncComponent } from 'vue'
import type { ICardDefine } from '@/components/panel/card' // 导入正确的类型
import { $t } from '@/locales' // 导入 $t
import poster from './image.png' // 假设 poster 图片存在或稍后添加

export default {
  id: 'recently-visited', // 使用小写连字符 ID
  type: 'builtin', // 添加 type
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: $t('card.recentlyVisited.title'), // 使用 $t
  description: $t('card.recentlyVisited.description'), // 使用 $t
  preset: {
    iCardViewDefault: {
      w: 3,
      h: 2,
      minH: 2,
      minW: 2
    }
  }
} as ICardDefine
