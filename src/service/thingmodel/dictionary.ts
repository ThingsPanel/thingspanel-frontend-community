import type { MetaItemKey } from './types'
import { thingmodelClient } from './client'

export const dictionaryApi = {
  listMetaItemKeys: async () => {
    const resp = await thingmodelClient.get<{ items?: MetaItemKey[] }>('/api/meta-item-keys')
    return resp.items || []
  }
}
