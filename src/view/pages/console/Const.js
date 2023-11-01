/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-10-24 09:04:17
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-10-31 17:24:55
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\console\Const.js
 * @Description: 
 */
import { business_index } from "@/api/business.js"
import { device_group_drop } from "@/api/asset.js"
import { getDeviceTree } from "@/api/device";



/**
 * 列表默认条数
 */
const DEFAULT_LIMIT = 9999;
/**
 * 默认当前页
 */
const DEFAULT_PAGE = 1;

/**
 * 看板默认设置
 */
export const DEFAULT_SETTING_DATA = {
    background: "#28367a"
};


export const CommonProps = {
    visible: {
        type: [Boolean],
        default: false
    }
}

export const commonData = {
    // 表单数据
    formData: {
        projectId: "",
        groupId: "",
        device: [],
        // 插件id
        pluginId: ""
    },
    // 项目列表
    projectList: [],
    // 分组列表
    groupList: [],
    // 设备列表
    deviceList: [],
}

export const commonComputed = {
    dialogVisible: {
        get() { return this.visible },
        set(visible) { this.$emit("update:visible", visible) }
    }
}

export const commonWatch = {
    "formData.projectId": {
        async handler(projectId) {
            if (projectId) {
                await this.getGroupList(projectId);
                this.optionsData && (this.optionsData = []);
            }
        }, deep: true
    },
    "formData.groupId": {
        async handler(groupId) {
            if (groupId) {
                await this.getDeviceList(groupId)
                this.optionsData && (this.optionsData = []);
            }
        }, deep: true
    }
}

export const commonMethods = {
    /**
         * @description: 获取项目列表
         * @return {*}
         */        
    async getProjectList() {
        let { data: result } = await business_index({ limit: DEFAULT_LIMIT, page: DEFAULT_PAGE })
        if (result.code === 200) {
            this.projectList = result.data.data || [];
        }
    },
    /**
         * @description: 获取分组列表
         * @param {*} projectId
         * @return {*}
         */        
    async getGroupList(projectId) {
        let {data: result} = await device_group_drop({ business_id: projectId })
        if (result.code === 200) {
            this.groupList = result?.data.map(item => ({ name: item.device_group, id: item.id })) || [];
            // this.formData.device = [];
        }
    },
    /**
     * @description: 获取设备列表
     * @param {*} groupId
     * @return {*}
     */        
    async getDeviceList(groupId) {
        const params = { current_page: DEFAULT_PAGE, per_page: DEFAULT_LIMIT, asset_id: groupId }
        let { data: result } = await getDeviceTree(params);
        if (result.code == 200) {
            let arr = result.data?.data || [];
            this.deviceList = arr.map(item => {
                if (item.children && item.children.length > 0) {
                    item.children = item.children.map(child => {
                        return {
                            label: child.device_name, value: child.device, pluginId: child.type
                        };
                    });
                } else {
                    item.children = undefined;
                }
                return {
                    label: item.device_name, value: item.device, pluginId: item.type, children: item.children
                };
            });
        }
    },
    handleProjectChange(v) {
        this.formData.groupId = "";
    },
    handleGroupChange(v) {
        this.formData.device = "";
    }
}

export default {
    DEFAULT_LIMIT, DEFAULT_PAGE
}