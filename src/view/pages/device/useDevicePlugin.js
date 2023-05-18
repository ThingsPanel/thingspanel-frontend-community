import PluginAPI from "@/api/plugin";
import {device_update} from "@/api/device";
import {message_success} from "@/utils/helpers";
import StoreAPI from "@/api/store";

export default function useDevicePlugin() {
    let pluginList = null;

    
    /**
     * 获取插件树
     * @returns {Promise<null|Array>}
     */
    async function getPluginTree() {
        if (!pluginList) {
            let installList = [];
            const { data: res } = await PluginAPI.tree();
            if (res.code === 200) {
                installList = washInstallPlugin(res.data);
            } else {
                installList = [];
            }


            let storeList = [];
            const { data:storeRes } = await StoreAPI.list.device();
            if (storeRes.code === 0) {
                storeList = washStorePlugin(storeRes.data.list);
            } else {
                storeList = [];
            }

            // 合并数组
            pluginList = installList.concat(storeList);
            console.log("pluginList", pluginList)
        } 
        return pluginList;
    }

    /**
     * 已安装插件数据处理
     * @param {*} list 
     * @returns 
     */
    function washInstallPlugin(list) {
        let newList = [];
    
        list.forEach(item => {
            if (item.device_model) {
                item.device_model.forEach(child => {
                    newList.push({
                        id: child.id,
                        name: child.model_name,
                        type: child.model_type,
                        author: child.author,
                        status: "install"
                    });
                })
            }
        })
        return newList;
    }

 
    /**
     *  应用商店插件数据处理
     * @param {*} list 
     * @returns 
     */
    function washStorePlugin(list) {
        return list.map(item => {
            return {
                id: item.ID,
                name: item.pluginName,
                type: item.devicePluginType,
                author: item.pluginAuthor,
                status: "store"
            }
        })
    }

    /**
     * 绑定插件
     * @param {*} row 
     * @param {*} pluginId 
     */
    function bindPlugin(row, plugin, callback) {
        let data = { id: row.id, type: plugin.id }
        device_update(data)
            .then(({data}) => {
            if (data.code == 200) {
                message_success("绑定成功！")
                callback && callback();
            }
            })
            .catch(err => {})
    }

    return {
        getPluginTree,
        bindPlugin
    }
}