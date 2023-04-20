/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-07 08:50:47
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-07 10:21:33
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\device-watch\device-detail\useTree.js
 * @Description:
 */
import { getDeviceTree } from "@/api/device";
import PluginAPI from "@/api/plugin"
import { device_group_drop } from "@/api/asset";

import { ref } from "@vue/composition-api/dist/vue-composition-api";

export default function useTree(projectId) {


    /**
     * 1. 初始化时在树组件中显示业务下的所有设备分组
     * 2. 点击设备分组后加载该分组下的所有设备
     */
    let pluginData = ref([])
    let groupId = "";

    function loadNode(node, resolve) {
        // 默认加载一级节点
        if (node.level == 0) {
            device_group_drop({ business_id: projectId })
                .then(({ data }) => {
                    let arr = data.data.map(item => { return { label: item.device_group, id: item.id } })
                    return resolve(arr);
                })
        }

        // 点击了一级分类，加载二级节点
        if (node.level == 1) {
            groupId = node.data.id;

            let data = { current_page: 1, per_page: 9999, asset_id: groupId }
            getDeviceTree(data)
                .then(({ data }) => {
                    if (data.code == 200) {
                        if (!data.data.data) {
                            return resolve([])
                        }
                        let arr = data.data.data.map(item => {
                            item.label = item.device_name;
                            if (!item.children) {
                                item.leaf = true;
                            }
                            return item;
                        })
                        return resolve(arr);
                    }
                })

        }

        if (node.level == 2) {
            if (node.data.children) {
                let arr = node.data.children.map(item => {
                    item.id = item.device;
                    item.label = item.device_name;
                    item.leaf = true;
                    return item;
                })
                return resolve(arr);
            }
        }

    }

    let pluginOptions = ref([]);
    let pluginTsl = ref([]);
    let device = ref({})

    /**
     * 点击设备显示插件图表
     * @param node
     */
    function nodeClick(node) {
        device.value = node;
        if (node.leaf && node.device && node.type) {
            let param = { "current_page": 1, "per_page": 10, "id": node.type }
            PluginAPI.page(param)
                .then(({ data }) => {
                    if (data.code == 200 && data.data && data.data.data && data.data.data.length > 0) {
                        let plugin = JSON.parse(data.data.data[0].chart_data);
                        pluginOptions.value = JSON.parse(JSON.stringify(plugin.chart));
                        pluginTsl.value = JSON.parse(JSON.stringify(plugin.tsl.properties));
                    } else {
                        pluginOptions.value = [];
                    }
                })
        } else {
            // 分组
            const groupId = node.id;
            console.log("nodeClick", node)
            pluginOptions.value = [];
        }
    }



    /**
     * @description: 通过插件Id获取插件
     * @return {*}
     */
    getPluginById: (pluginId) => {
        const param = { "current_page": 1, "per_page": 10, "id": pluginId }
        return new Promise((resolve, reject) => {
            PluginAPI.page(param)
                .then(({ data }) => {
                    if (data.code == 200 && data.data && data.data.data && data.data.data.length > 0) {
                        let plugin = JSON.parse(data.data.data[0].chart_data);
                        let pluginOptions = JSON.parse(JSON.stringify(plugin.chart));
                        let pluginTsl = JSON.parse(JSON.stringify(plugin.tsl.properties));
                        resolve({ pluginOptions, pluginTsl })
                    } else {
                        resolve({})
                    }
                })
        })

    }

    return {
        pluginData, loadNode,
        pluginOptions, pluginTsl, device, nodeClick
    }

}