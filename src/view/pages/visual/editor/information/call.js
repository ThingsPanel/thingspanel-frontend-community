import PluginAPI from "@/api/plugin"

/**
 * 通过 项目/分组/设备 获得设备的插件id
 * @param casOptions
 * @param v
 * @returns {Promise<unknown>}
 */
const getPluginIdFromCasOptions = (casOptions, v) => {
    return new Promise((resolve, reject) => {
        if (v.length < 3) return null;
        casOptions.forEach(business => {
            // 从项目里找级联菜单的一级节点
            if (business.business_id == v[0]) {
                if (!business.children) reject(null);
                business.children.forEach(group => {
                    // 从分组里找二级节点
                    if (group.group_id == v[1]) {
                        if (!group.children) resolve(null);
                        group.children.forEach(device => {
                            if (device.device_id == v[2]) {
                                console.log("找到3级节点", device.plugin_id)
                                resolve(device.plugin_id)
                            } else {
                                resolve(null);
                            }
                        })
                    } else {
                        resolve(null);
                    }
                })
            }
        })
    })

}

/**
 * 通过 插件Id 获得插件的物模型
 * @param pluginId
 * @returns {Promise<unknown>|null}
 */
const getPluginTSLByPluginId = (pluginId) => {
    if (!pluginId) return null;
    return new Promise((resolve, reject) => {
        PluginAPI.page({ id: pluginId, current_page: 1, per_page: 10 })
            .then(({ data }) => {
                if (data.code == 200 || data.code == "200") {
                    let jsonData = data.data.data.length > 0 ? data.data.data[0] : "{}"
                    let jsonObj = JSON.parse(jsonData.chart_data);
                    let { tsl } = jsonObj;
                    resolve(tsl.properties);
                } else {
                    resolve(null)
                }
            })
            .catch(() => reject(null))
    })
}
export default { getPluginIdFromCasOptions, getPluginTSLByPluginId }
