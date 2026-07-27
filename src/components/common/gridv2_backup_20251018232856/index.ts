/**
 * gridv2 模块入口
 * - 独立于 common/grid，便于隔离实验性/适配层组件
 * - 暴露 GridV2 组件与必要类型（类型仍复用 gridLayoutPlusTypes）
 */
export { default as GridV2 } from './GridV2.vue'
export type {
  GridLayoutPlusProps,
  GridLayoutPlusEmits,
  GridLayoutPlusItem,
  GridLayoutPlusConfig
} from '@/components/common/grid/gridLayoutPlusTypes'
