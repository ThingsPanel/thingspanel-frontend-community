interface Window {
  /** NProgress instance */
  NProgress?: import('nprogress').NProgress;
  /** Loading bar instance */
  $loadingBar?: import('naive-ui').LoadingBarProviderInst;
  /** Dialog instance */
  $dialog?: import('naive-ui').DialogProviderInst;
  /** Message instance */
  $message?: import('naive-ui').MessageProviderInst;
  /** Notification instance */
  $notification?: import('naive-ui').NotificationProviderInst;
}

interface ViewTransition {
  ready: Promise<void>;
}

interface Document {
  startViewTransition?: (callback: () => Promise<void> | void) => ViewTransition;
}
type OptionTypes = {
  label: string;
  value: any;
};
interface ImportMeta {
  readonly env: Env.ImportMeta;
}

declare namespace Common2 {
  /** 策略模式 [状态, 为true时执行的回调函数] */
  type StrategyAction = [boolean, () => void];

  /** 选项数据 */
  type OptionWithKey<K> = { value: K; label: string };
}

/** Build time of the project */
declare const BUILD_TIME: string;

declare interface Window {
  NMessage: any;
}

declare module 'moving-numbers-vue3';
