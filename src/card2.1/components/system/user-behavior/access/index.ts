import { defineAsyncComponent } from 'vue';

/**
 * @description 访问用户组件
 * @description.en-US Access User Component
 * @author wbh
 * @date 2024-07-31
 * @version 2.1
 */
export default {
  /**
   * 组件的唯一标识符。
   * 自动注册系统将使用此 `type` 在 `category-definition.ts` 中查找其分类。
   */
  type: 'access',

  /**
   * 组件在UI中显示的名称。
   */
  name: '访问用户',

  /**
   * 组件的图标
   */
  icon: 'account',

  /**
   * 异步加载的Vue组件。
   * 使用 defineAsyncComponent 来包装动态导入，以实现异步加载。
   */
  component: defineAsyncComponent({
    loader: () => import('./component.vue'),
    // 在组件加载时显示的加载组件
    loadingComponent: 'div', // 之后可以替换为更复杂的加载组件
    // 加载失败时显示的组件
    // errorComponent: ErrorComponent,
    // 显示加载组件前的延迟时间，单位ms
    delay: 200,
    // 如果提供了超时时间，并且加载在超时后仍未完成，
    // 将显示错误组件。默认值：Infinity。
    // timeout: 3000
  }),

  /**
   * 组件在组件库中的预览图。
   */
  poster: {
    src: new URL('./access.png', import.meta.url).href,
    width: 400,
    height: 200,
  },

  /**
   * 组件的默认样式。
   */
  style: {
    width: 400,
    height: 200,
  },

  /**
   * 定义组件所需的权限。
   * 可选值为: 'SYS_ADMIN', 'TENANT_ADMIN', 'TENANT_USER', '不限'。
   * 默认为 '不限'，表示所有用户均可访问。
   */
  permission: '不限',

  /**
   * 定义组件是否默认注册。
   * 设置为 `false` 将阻止该组件被自动注册。
   */
  isRegistered: true,
};