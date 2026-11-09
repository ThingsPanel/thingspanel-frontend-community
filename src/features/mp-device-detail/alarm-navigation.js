// Derived from ThingsPanel/app 74e0509; mini-program H5 owns this copy.
// 设备告警列表返回的是联动 ID，告警编辑器需要动作目标中的告警配置 ID。
export function getAlarmTargetIds(scene) {
  return [
    ...new Set(
      (scene?.actions || [])
        .filter((action) => String(action.action_type) === '30' && action.action_target)
        .map((action) => action.action_target)
    )
  ]
}

export async function loadLinkedAlarmRules(sceneId, request) {
  const scene = await request('scene_automations/detail/' + encodeURIComponent(sceneId))
  const ids = getAlarmTargetIds(scene)
  if (!ids.length) throw new Error('该联动未关联告警配置')
  const found = new Map()
  for (let page = 1; ; page++) {
    const data = await request('alarm/config', { page, page_size: 100 })
    const list = data?.list || []
    list.forEach((rule) => {
      if (ids.includes(rule.id)) found.set(rule.id, rule)
    })
    if (found.size === ids.length || !list.length || page * 100 >= Number(data.total)) break
  }
  if (found.size !== ids.length) throw new Error('关联的告警配置不存在或无权访问')
  return ids.map((id) => found.get(id))
}
