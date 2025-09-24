import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';

/**
 * @description 离线设备数组件定义
 * @summary 显示当前离线的设备数量，支持实时监控
 */
export default {
  type: 'off-line',
  name: 'components.offLine', // 存储翻译键，而不是调用$t()
  description: '显示当前离线的设备数量',
  // 修复：SVG path `d` 属性包含非法的数字分隔（例如 `10-10 2`），导致浏览器解析错误。
  // 解决：替换为合法的 Material 图标路径，并保留红色状态圆点。
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/><circle cx="12" cy="12" r="3" fill="#ef4444"/></svg>',
  component,
  version: '2.1.0',
  tags: ['系统', '设备', '离线', '状态', '交互'],
  dataDriven: false, // 这是一个纯展示性组件，数据由内部 API 调用获取，而非外部数据源驱动
  interactionCapabilities: {
    // 声明组件支持点击事件
    supportedEvents: ['click'],
  },
  permission: '不限'
} as ComponentDefinition;