import { localStg } from '@/utils/storage'
import {
  createThingModelNativeClient,
  type ThingModelNativeClient,
} from './thingmodel-native-transport'

/** Native Encore v2 API. Idempotency keys are generated and retained by the caller. */
export const thingModelNative: ThingModelNativeClient = createThingModelNativeClient({
  fetch: (input, init) => globalThis.fetch(input, init),
  getToken: () => localStg.get('token') as string | undefined,
  getLanguage: () => localStg.get('lang') as string | undefined,
})

export { createThingModelNativeClient, createOperationKey } from './thingmodel-native-transport'
export { ThingModelNativeError } from './thingmodel-native-transport'
export type {
  Access,
  APIError,
  BooleanConstraint,
  CreateModelRequest,
  EnumBaseKind,
  EnumOption,
  FieldKind,
  I18nString,
  ModelCommandResult,
  ModelDetail,
  ModelDraft,
  ModelField,
  ModelFieldBase,
  ModelLifecycle,
  ModelResources,
  ModelSummary,
  NativeModelProfile,
  NativeClientOptions,
  NumericConstraint,
  ParameterDefinition,
  Parameters,
  PageModelSummary,
  PageVersionSummary,
  PublishModelRequest,
  ResourcesDocument,
  SnapshotDetail,
  ThingModelNativeClient,
  UpdateModelRequest,
  UpdateResourcesRequest,
  ValueConstraint,
  ValueKind,
  ValueType,
  VersionSummary,
  StringConstraint,
} from './thingmodel-native-transport'
