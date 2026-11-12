import { beforeEach, expect, it, vi } from 'vitest'
vi.mock('@/service/api/device', () => ({ deviceConfigEdit: vi.fn() }))
vi.mock('@/service/api/thingmodel-native', () => ({ thingModelNative: {} }))
import { deviceConfigEdit } from '@/service/api/device'
import { saveNativeThingModelBinding } from '@/service/api/native-template-binding'
beforeEach(() => vi.clearAllMocks())
it('explicit binding retains all four fields and the caller CAS revision', async () => {
  vi.mocked(deviceConfigEdit).mockResolvedValue({ error: true } as any)
  const result = await saveNativeThingModelBinding(
    { id: 'A', native_binding_revision: 7 },
    { modelID: 'm', snapshotID: 's', publishedRevision: 3 }
  )
  expect(deviceConfigEdit).toHaveBeenCalledOnce()
  expect(deviceConfigEdit).toHaveBeenCalledWith({
    id: 'A',
    native_thing_model_id: 'm',
    native_thing_model_snapshot_id: 's',
    native_thing_model_revision: 3,
    native_binding_revision: 7
  })
  expect(result.error).toBe(true)
})
it('explicit unbind sends blank binding with CAS, not a normal metadata update', async () => {
  await saveNativeThingModelBinding({ id: 'A', native_binding_revision: 8 }, null)
  expect(deviceConfigEdit).toHaveBeenCalledOnce()
  expect(deviceConfigEdit).toHaveBeenCalledWith({
    id: 'A',
    native_thing_model_id: '',
    native_thing_model_snapshot_id: '',
    native_thing_model_revision: 0,
    native_binding_revision: 8
  })
})
