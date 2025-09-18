import type { ComponentPreset } from '@/card2.1/core/types';

/**
 * @description 预设配置
 * @summary 定义了 `access` 组件的一个默认实例，可以直接在编辑器中拖拽使用。
 */
export default [
  {
    id: 'access.default',
    title: '默认访问量卡片',
    description: '一个标准的访问量统计卡片，展示系统的总访问次数。'
    // props: {}, // 由于组件没有可配置的 props，此项为空
    // interaction: {}, // 可以在此预设交互行为，例如点击后跳转到特定页面
    // layout: { w: 2, h: 2 }, // 可以预设组件在画布中的默认大小
  },
] as ComponentPreset[];