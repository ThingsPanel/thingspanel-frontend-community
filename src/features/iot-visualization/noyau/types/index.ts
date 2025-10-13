/**
 * Noyau (核心引擎) 类型系统统一导出
 */

// 画布核心类型
export type {
  Position,
  Size,
  Transform,
  NodeStyle,
  ICanvasNode,
  INodeInteraction,
  InteractionEvent,
  IInteractionResponse,
  InteractionAction,
  RenderTree,
  Viewport,
  CanvasConfig,
  SelectionState,
  HistoryRecord,
  CanvasState,
  CreateNodeOptions,
  UpdateNodeOptions
} from './canvas.types'

// 数据源类型
export type {
  DataSourceType,
  HttpMethod,
  BaseDataSourceConfig,
  StaticDataSourceConfig,
  HttpDataSourceConfig,
  WebSocketDataSourceConfig,
  ScriptDataSourceConfig,
  DeviceApiDataSourceConfig,
  DataSourceConfig,
  IDataSourceInstance,
  DataSourceStatus,
  DataChangeCallback,
  DataTransformer,
  TransformContext,
  IDataSourceProvider,
  ValidationResult,
  DataSourceExecutorConfig,
  NodeDataBinding,
  DataUpdateEvent
} from './data.types'

// 交互系统类型
export type {
  IInteractionActionHandler,
  InteractionContext,
  IInteractionResponseConfig,
  ActionMetadata,
  ActionCategory,
  ActionParamDefinition,
  NodeInteractionConfig,
  IInteractionDefinition,
  IInteractionEngine,
  InteractionExecutionResult,
  InteractionEventListener,
  IConditionEvaluator,
  ConditionContext,
  NavigateToUrlParams,
  UpdateComponentDataParams,
  ChangeVisibilityParams,
  ChangeColorParams,
  TriggerAnimationParams,
  ShowNotificationParams,
  EmitEventParams,
  ModalParams
} from './interaction.types'
