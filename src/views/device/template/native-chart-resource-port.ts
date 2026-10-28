import type { ResourcesDocument } from '@/service/api/thingmodel-native'

export type NativeChartKind = 'web' | 'app'
export type NativeChartResourceKey = 'webChartConfig' | 'appChartConfig'
export interface NativeChartUpdateOptions {
  openedRevision: number
  conflictKey: NativeChartResourceKey
  openedValue: unknown
}
export interface NativeChartResourcesPort {
  load(): Promise<{ resources: ResourcesDocument; revision: number }>
  update(mutator: (resources: ResourcesDocument) => ResourcesDocument, options?: NativeChartUpdateOptions): Promise<{ resources: ResourcesDocument; revision: number }>
}
