import { defineAsyncComponent } from 'vue';
import type { ICardDefine } from '@/components/panel/card';
import poster from './poster.png';
export default {
  id: 'demo',
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: 'demo',
  configForm: defineAsyncComponent(() => import('./card-config.vue'))
} as ICardDefine;
