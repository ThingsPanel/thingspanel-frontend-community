import { defineAsyncComponent } from 'vue';
import type { ICardDefine } from '@/components/panel/card';
import poster from './poster.png';
export default {
  id: 'equipment',
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: 'equipment',
  color: '#444'
  // configForm: defineAsyncComponent(() => import('./card-config.vue'))
} as ICardDefine;
