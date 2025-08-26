/**
 * 数据源配置表单类型定义统一导出
 * 提供所有配置表单相关的类型定义
 */

// HTTP配置相关类型
export type {
  HttpMethod,
  HttpBodyType,
  KeyValuePair,
  HttpHeadersConfig,
  HttpParamsConfig,
  HttpScriptConfig,
  HttpAdvancedConfig,
  HttpTestResult,
  HttpTestStatus,
  HttpDataSourceConfig,
  SystemApiDefinition,
  ApiListModalState,
  HttpConfigValidationResult,
  HttpUtilities,
  HttpConfigData,
  SystemApiItem,
  TestConnectionResponse,
  ValidationResult
} from './http-config'

// WebSocket配置相关类型
export type {
  WebSocketState,
  WebSocketMessageType,
  WebSocketAuthType,
  WebSocketAuthConfig,
  WebSocketReconnectConfig,
  WebSocketMessageFilter,
  WebSocketHeartbeatConfig,
  WebSocketConnectionInfo,
  WebSocketMessage,
  WebSocketBufferConfig,
  WebSocketDataSourceConfig,
  WebSocketTestResult,
  WebSocketTestStatus,
  WebSocketEventType,
  WebSocketEvent,
  WebSocketConfigValidationResult,
  WebSocketUtilities,
  WebSocketConfigData
} from './websocket-config'

// 原始数据相关类型
export type {
  RawDataItem,
  RawDataProcessingType,
  RawDataFilter,
  RawDataTransform,
  RawDataValidation,
  RawDataProcessingConfig,
  RawDataHistory,
  RawDataStatistics,
  RawDataListConfig,
  RawDataImportConfig,
  RawDataExportConfig,
  RawDataOperationResult,
  RawDataSearchConfig,
  RawDataPaginationConfig,
  RawDataSortConfig,
  RawDataColumnConfig,
  RawDataDisplayConfig
} from './raw-data'

// 最终处理相关类型
export type {
  FinalDataProcessingType,
  DataAggregationType,
  FinalDataTransform,
  FinalDataValidation,
  FinalDataOutput,
  FinalDataProcessingConfig,
  FinalDataHistory,
  FinalDataStatistics,
  FinalDataQualityCheck,
  DataQualityMetrics,
  DataLineageInfo,
  DataProcessingPipeline,
  DataProcessingStep,
  DataProcessingResult,
  DataProcessingError,
  DataProcessingStatus,
  FinalDataPreviewConfig,
  FinalDataExportConfig
} from './final-processing'

// 弹窗相关类型
export type {
  ModalType,
  ModalSize,
  ModalConfig,
  BaseModalProps,
  DataItemModalState,
  RawDataDetailModalState,
  FinalDataModalState,
  ApiListModalState as ModalApiListState,
  ConfirmModalState,
  ModalActionType,
  ModalEventData,
  ModalOperationResult,
  ModalValidationResult,
  ModalThemeConfig
} from './modal-types'

// 事件相关类型
export type {
  EventType,
  EventPriority,
  BaseEvent,
  ComponentEvent,
  DataEvent,
  ValidationEvent,
  UIEvent,
  SystemEvent,
  EventHandler,
  EventSubscription,
  EventBus,
  EventConfig,
  EventError,
  EventMetrics,
  EventFilter,
  EventTransform
} from './event-types'

// 验证器相关类型
export type {
  ValidatorType,
  ValidationSeverity,
  BaseValidator,
  FieldValidator,
  FormValidator,
  DataValidator,
  ValidationRule,
  ValidationContext,
  ValidationError,
  ValidationResult as ValidatorValidationResult,
  ValidationConfig,
  ValidatorFactory,
  ValidatorRegistry,
  CustomValidator,
  AsyncValidator,
  ConditionalValidator
} from './validator-types'

// 表单接口相关类型
export type {
  FormFieldType,
  FormFieldConfig,
  FormSectionConfig,
  FormLayoutType,
  FormConfig,
  FormState,
  FormError,
  FormSubmissionResult,
  FormValidationMode,
  FormThemeConfig,
  FormEventType,
  FormEventData,
  FormHook,
  FormPlugin,
  FormExtension
} from './form-interfaces'
