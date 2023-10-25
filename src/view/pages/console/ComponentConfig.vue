<template>
    <el-drawer custom-class="drawer-config" :visible.sync="dialogVisible" v-bind="drawerSetting" v-on="drawerEvents">
        <template #title>
            <h2>数据源设置</h2>
        </template>
        <div class="drawer-box">
            <el-form label-width="100px">
                <!-- 项目列表 -->
                <el-form-item label="项目">
                    <el-select v-model="formData.projectId" @change="handleProjectChange">
                        <el-option v-for="(item, index) in projectList" :key="index" :value="item.id"
                            :label="item.name" />
                    </el-select>
                </el-form-item>
                <!-- 分组列表 -->
                <el-form-item label="分组">
                    <el-select v-model="formData.groupId" @change="handleGroupChange">
                        <el-option v-for="(item, index) in groupList" :key="index" :value="item.id"
                            :label="item.name" />
                    </el-select>
                </el-form-item>
                <!-- 设备列表 -->
                <el-form-item label="设备">
                    <el-cascader style="width: 100%" ref="deviceRef" v-model="formData.device" :options="deviceList" clearable
                            :props="{ checkStrictly: true, emitPath: false }" @change="handleDeviceChange">
                            <template slot-scope="{ node, data }">
                                <span>{{ data.label }}</span>
                                <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
                            </template>
                        </el-cascader>
                </el-form-item>
                <!-- 物模型属性列表 -->
                <el-form-item label="属性">
                    <el-select v-model="formData.properties" multiple>
                        <el-option v-for="(item, index) in propertyList" :key="index" :label="item.title" :value="item.name"></el-option>
                    </el-select>
                </el-form-item>
            </el-form>
            <div class="footer" style="text-align: center;">
                <el-button size="small " class="buttStyle" @click="dialogVisible=false">{{ $t("SYSTEM_MANAGEMENT.CANCEL") }}</el-button>
                <el-button size="small" type="indigo" @click="handleSubmit">确认</el-button>
            </div>
        </div>
    </el-drawer>
</template>

<script>
import Common, { CommonProps, commonData, commonComputed, commonWatch, commonMethods } from "./Const.js";
import { getDeviceInfo, getProjectGroup } from "@/api/device.js";
import PluginAPI from "@/api/plugin.js";
import { message_error } from "@/utils/helpers";


export default {
    components: {},
    props: {
        ...CommonProps,
        data: {
            type: [Object, Array],
            default: () => ({})
        }
    },
    data() {
        return {
            ...commonData,
            // 抽屉参数
            drawerSetting: {
                // 抽屉出现的方向
                direction: "rtl",
                // 抽屉的宽
                size: '40%',
            },
            // 抽屉事件
            drawerEvents: {
                open: this.initForm
            },
            // 属性列表
            propertyList: []
        }
    },
    computed: {
        ...commonComputed
    },
    watch: {
        ...commonWatch,
        "formData.device": {
            handler(device) {
                console.log("watch.device", device);
                if (device && typeof device === "string") {
                    this.getDevice(device);
                }
            }
        },
        "formData.pluginId": {
            handler(pluginId) {
                if (pluginId) {
                    this.getPropertyList(pluginId);
                }
            }
        },
    },
    mounted() {
        this.getProjectList();
    },
    methods: {
        ...commonMethods,
        /**
         * @description: 初始化表单
         * @return {*}
         */        
        initForm() {
            const id = this.data.device.deviceId;
            if (!id) return;
            getProjectGroup({ id })
                .then(({ data: result }) => {
                    if (result.code === 200) {
                        this.formData.projectId = result.data?.business_id || "";
                        this.formData.groupId = result.data?.asset_id || "";
                        this.formData.device = result.data?.device_id || "";
                        if (this.data.type === "switch") {
                            console.log("initForm1", this.data.series[0].mapping.attr.name);
                            this.formData.properties = [this.data.series[0].mapping.attr.name];
                        } else {
                            this.formData.properties = this.data.mapping || "";
                        }
                    }
                })
        },
        /**
         * @description: 选择设备的回调
         * @param {*} v
         * @return {*}
         */        
         handleDeviceChange(v) {
            const deviceRef = this.$refs.deviceRef;
            const { data } = deviceRef.getCheckedNodes()[0];
            this.getPropertyList(data.pluginId);
        },
        /**
         * @description: 获取设备详情
         * @return {*}
         */        
        async getDevice(id) {
            if (!id) return;
            let { data: result } = await getDeviceInfo({ id })
            if (result.code === 200) {
                this.formData.pluginId = result.data?.type || "";
                console.log("watch:pluginId", result.data, this.formData.pluginId);
            }
        },
        /**
         * @description: 获取插件信息
         * @param {*} id
         * @return {*}
         */        
        async getPropertyList(id) {
            this.propertyList = [];
            if (!id) return;
            try {
                let { data: result } = await PluginAPI.page({ current_page: Common.DEFAULT_PAGE, per_page: Common.DEFAULT_LIMIT, id })
                if (result.code === 200) {
                    const chartData = result.data.data[0].chart_data;
                    const obj = JSON.parse(chartData);
                    console.log("getPropertyList.tsl", obj.tsl);
                    this.propertyList = obj.tsl.properties;

                }
            } catch(err) {}
            
        },
        /**
         * @description: 确认
         * @return {*}
         */        
        handleSubmit() {
            this.validate((valid) => {
                if (valid) {
                    console.log("handleSubmit", this.data, this.formData);
                    const { device: deviceId, properties } = this.formData;
                    const tmp = JSON.parse(JSON.stringify(this.data));
                    tmp.device = { deviceId };
                    // 绑定的物模型属性
                    tmp.dataSource = this.propertyList.filter(item => properties.indexOf(item.name) !== -1);
                    if (this.data.controlType === "control") {
                        // 组件是开关
                    } else {
                        // 其他组件
                        tmp.mapping = [...properties];
                    }
                    this.$emit("change", tmp);
                    this.dialogVisible = false;
                }
            })
        },
        /**
         * @description: 表单验证
         * @return {*}
         */        
        validate(callback) {
            try {
                const { projectId, groupId, device, properties } = this.formData;
                if (!projectId) throw new Error("请选择项目");
                if (!groupId) throw new Error("请选择分组");
                if (!device || !device.length) throw new Error("请选择设备");
                if (this.data.controlType !== "control") {
                    if (!properties || !properties.length) {
                        throw new Error("请选择属性");
                    }
                }
                callback(true);
            } catch(err) {
                message_error(err.message);
                callback(false);
            }
        }
    }
}
</script>
<style lang="scss" scoped>
::v-deep .drawer-config {
    background-color: #263d8b;
    color: #ffffff;
    text-align:center;
    .el-drawer__header {
        border-bottom: 1px solid #344a9a;
        color: #ffffff !important;
        height: 120px;
    }

    .drawer-box {
        padding: 20px;
        .el-select {
            width: calc(100% - 100px);
        }
        .el-cascader {
            width: calc(100% - 100px)!important;
        }
    }

    .footer {
        border-top: 2px solid #344a9a;
        position: absolute;
        height: 100px;
        bottom: 0;
        left: 0;
        right: 0;
        margin: 0;
        padding-top: 20px;
    }
}
</style>