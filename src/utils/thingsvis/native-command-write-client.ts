import { deviceNative } from '@/service/api/device-native'
import { thingModelNative } from '@/service/api/thingmodel-native'
import { deviceCommandNative } from '@/service/api/device-command-native'
import { newIdempotencyKey } from '@/service/api/device-write-attempt'
import { createNativeChartCommandWriter } from './native-command-write'

/** One writer per chart host retains unknown-outcome retry keys across clicks. */
export function nativeChartCommandWriter() {
  return createNativeChartCommandWriter({
    devices: deviceNative,
    models: thingModelNative,
    commands: deviceCommandNative,
    newKey: newIdempotencyKey
  })
}
