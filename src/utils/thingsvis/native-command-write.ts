import { createCommandSubmitter, parseTableSubmit } from '@/service/api/device-command-rows'
import type { DeviceCommandNativeClient } from '@/service/api/device-command-native-transport'
import type { DeviceNativeClient } from '@/service/api/device-native-transport'
import type { ThingModelNativeClient } from '@/service/api/thingmodel-native-transport'

interface Dependencies {
  devices: Pick<DeviceNativeClient, 'readTemplateBinding'>
  models: Pick<ThingModelNativeClient, 'version'>
  commands: Pick<DeviceCommandNativeClient, 'submit'>
  newKey(): string
}

/** A chart's accepted write is not an observed attribute value or a device ACK. */
export function createNativeChartCommandWriter(deps: Dependencies) {
  const submitter = createCommandSubmitter({
    send: (id, body, key) => deps.commands.submit(id, body, key),
    newKey: deps.newKey
  })
  return async (deviceId: string, identifier: string, value: string) => {
    const { binding } = await deps.devices.readTemplateBinding(deviceId)
    const model = binding.modelBinding
    if (binding.deviceId !== deviceId || !model) throw new Error('设备尚未绑定固定物模型命令')
    const snapshot = await deps.models.version(model.modelId, model.publishedRevision)
    if (
      snapshot.modelID !== model.modelId ||
      snapshot.snapshotID !== model.snapshotId ||
      snapshot.publishedRevision !== model.publishedRevision
    ) {
      throw new Error('设备物模型快照不匹配')
    }
    if (!snapshot.model.fields.some(field => field.kind === 'COMMAND' && field.identifier === identifier)) {
      throw new Error('该字段不是设备固定物模型中声明的命令')
    }
    const receipt = await submitter.submit(
      deviceId,
      model.snapshotId,
      parseTableSubmit({ identify: identifier, value })
    )
    const failed = ['failed', 'timed_out', 'expired', 'cancelled', 'unknown'].includes(receipt.state)
    return {
      success: !failed,
      accepted: true,
      status: receipt.state,
      executionId: receipt.id,
      state: receipt.state,
      ...(failed ? { error: receipt.reason || `Command ${receipt.state}` } : {})
    }
  }
}
