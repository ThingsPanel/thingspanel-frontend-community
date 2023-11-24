<template>
    <el-drawer custom-class="drawer-config" :visible.sync="dialogVisible" v-bind="drawerSetting" v-on="drawerEvents">
        <template #title>
            <h2>{{ $t('VISUALIZATION.CONSOLE.COMPONENT_SETTING') }}</h2>
            <el-button size="small " type="border" @click="dialogVisible = false">{{ $t("SYSTEM_MANAGEMENT.CANCEL")
            }}</el-button>
            <el-button size="small" type="indigo" @click="handleSubmit">{{ $t('COMMON.SAVE') }}</el-button>
        </template>
        <div class="drawer-box">
            <el-tabs type="border-card" v-model="activeName" >
                <el-tab-pane class="data-pane" :label="$t('VISUALIZATION.CONSOLE.DATA_SOURCE')" name="data">
                    <el-form label-width="100px" label-position="left">
                        <!-- 项目列表 -->
                        <el-form-item :label="$t('VISUALIZATION.CONSOLE.PROJECT')">
                            <el-select v-model="formData.data.projectId" @change="handleProjectChange">
                                <el-option v-for="(item, index) in projectList" :key="index" :value="item.id"
                                    :label="item.name" />
                            </el-select>
                        </el-form-item>
                        <!-- 分组列表 -->
                        <el-form-item :label="$t('VISUALIZATION.CONSOLE.GROUP')">
                            <el-select v-model="formData.data.groupId" @change="handleGroupChange">
                                <el-option v-for="(item, index) in groupList" :key="index" :value="item.id"
                                    :label="item.name" />
                            </el-select>
                        </el-form-item>
                        <!-- 设备列表 -->
                        <el-form-item :label="$t('VISUALIZATION.CONSOLE.DEVICE')">
                            <el-cascader ref="deviceRef" v-model="formData.data.device"
                                :options="deviceList" clearable :props="{ checkStrictly: true, emitPath: false }"
                                @change="handleDeviceChange">
                                <template slot-scope="{ node, data }">
                                    <span>{{ data.label }}</span>
                                    <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
                                </template>
                            </el-cascader>
                        </el-form-item>
                        <!-- 物模型属性列表 -->
                        <el-form-item :label="$t('VISUALIZATION.CONSOLE.ATTRIBUTE')">
                            <el-select v-model="formData.data.properties" multiple>
                                <el-option v-for="(item, index) in propertyList" :key="index" :label="item.title"
                                    :value="item.name"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
                <el-tab-pane class="appearance-pane" :label="$t('VISUALIZATION.CONSOLE.APPEARANCE')" name="appearance" >
                    <el-form label-width="140px" label-position="left">
                        <el-form-item :label="$t('VISUALIZATION.CONSOLE.SHOW_TITLE')" >
                            <!-- <el-checkbox :disabled="true" v-model="formData.appearance.showTitle"></el-checkbox> -->
                            <el-switch v-model="formData.appearance.showTitle" disabled active-color="#13ce66" inactive-color="#8a8ea1"/>
                        </el-form-item>
                        <el-form-item :label="$t('VISUALIZATION.CONSOLE.TITLE')" v-if="formData.appearance.showTitle">
                            <el-input v-model="formData.appearance.name" ></el-input>
                        </el-form-item>
                        <el-form-item :label="$t('VISUALIZATION.CONSOLE.BACKGROUND_COLOR')">
                            <el-color-picker v-model="formData.appearance.backgroundColor"></el-color-picker>
                        </el-form-item>
                        <el-form-item :label="$t('VISUALIZATION.CONSOLE.TEXT_COLOR')">
                            <el-color-picker v-model="formData.appearance.color" disabled></el-color-picker>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
                <el-tab-pane v-if="data.controlType==='dashboard'" :label="$t('VISUALIZATION.CONSOLE.DASHBOARD')" disabled></el-tab-pane>
            </el-tabs>

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
            // ...commonData,
            activeName: "data",
            // 表单数据
            formData: {
                // 数据源
                data: {
                    projectId: "",
                    groupId: "",
                    device: "",
                    pluginId: "",
                    properties: "",
                },
                // 外观
                appearance: {
                    showTitle: true,
                    name: "",
                    backgroundColor: "#1f2a5d",
                    color: "#ffffff"
                },
                // 仪表盘
                dashboard: {
                }
            },
            // 项目列表
            projectList: [],
            // 分组列表
            groupList: [],
            // 设备列表
            deviceList: [],
            // 抽屉参数
            drawerSetting: {
                // 抽屉出现的方向
                direction: "rtl",
                // 抽屉的宽
                size: '40%',
                // 不显示关闭按钮
                showClose: false
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
        "formData.data.projectId": {
            async handler(projectId) {
                if (projectId) {
                    await this.getGroupList(projectId);
                }
            }, deep: true
        },
        "formData.data.groupId": {
            async handler(groupId) {
                if (groupId) {
                    await this.getDeviceList(groupId)
                }
            }, deep: true
        },
        "formData.data.device": {
            handler(device) {
                console.log("watch.device", device);
                if (device && typeof device === "string") {
                    this.getDevice(device);
                }
            },
            deep: true
        },
        "formData.data.pluginId": {
            handler(pluginId) {
                if (pluginId) {
                    this.getPropertyList(pluginId);
                }
            }
        },
    },
    mounted() {
        if (window.location.href.indexOf('/kanban/share') === -1){
            this.getProjectList();
        }
    },
    methods: {
        ...commonMethods,
        /**
         * @description: 初始化表单
         * @return {*}
         */
        initForm() {
            console.log("componentConfig.initForm", this.data);
            this.formData.appearance.name = this.data.name;
            this.formData.appearance.backgroundColor = this.data?.style?.backgroundColor || "#2d3d86";
            const id = this.data.device.deviceId;
            if (!id) return;
            getProjectGroup({ id })
                .then(({ data: result }) => {
                    if (result.code === 200) {
                        this.formData.data.projectId = result.data?.business_id || "";
                        this.formData.data.groupId = result.data?.asset_id || "";
                        this.formData.data.device = result.data?.device_id || "";
                        if (this.data.type === "switch") {
                            this.formData.data.properties = [this.data.series[0].mapping.attr.name];
                        } else {
                            this.formData.data.properties = this.data.mapping || "";
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
                this.formData.data.pluginId = result.data?.type || "";
                console.log("watch:pluginId", result.data, this.formData.data.pluginId);
            }
        },
        /**
         * @description: 获取插件物模型属性
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
            } catch (err) { }

        },
        /**
         * @description: 确认
         * @return {*}
         */
        handleSubmit() {
            this.validate((valid) => {
                if (valid) {
                    console.log("handleSubmit", this.data, this.formData);
                    const { device: deviceId, properties } = this.formData.data;
                    const { name, backgroundColor } = this.formData.appearance;
                    
                    const tmp = JSON.parse(JSON.stringify(this.data));
                    tmp.device = { deviceId };
                    tmp.name = name;
                    tmp.style = { backgroundColor };
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
                const { projectId, groupId, device, properties } = this.formData.data;
                if (!projectId) throw new Error("请选择项目");
                if (!groupId) throw new Error("请选择分组");
                if (!device || !device.length) throw new Error("请选择设备");
                if (this.data.controlType !== "control") {
                    if (!properties || !properties.length) {
                        throw new Error("请选择属性");
                    }
                }
                const { name } = this.formData.appearance;
                if (!name) throw new Error("标题不能为空");
                callback(true);
            } catch (err) {
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
    text-align: center;

    .el-drawer__header {
        border-bottom: 1px solid #344a9a;
        color: #ffffff !important;
        height: 120px;
    }

    .drawer-box {
        .el-tabs {
            background-color: #263d8b;

            .el-tabs__header {
                background-color: #263d8b;
                border-bottom: unset !important;
                margin-left: 20px;

            }

            .el-tabs__nav.is-top {
                background-color: #344a9a;
                border-radius: 50px;
            }

            .el-tabs__item {
                background-color: #344a9a;
                border-right-color: #344a9a;
                border-left-color: #344a9a;
                border-radius: 50px;
                height: 30px;
                line-height: 30px;
            }

            .el-tabs__item.is-active {
                background-color: #1e2d67;
                border-radius: 50px;
                border-right-color: #1e2d67;
                border-left-color: #1e2d67;
                //border-right-color: #263d8b;
                //border-left-color: #263d8b;
            }
        }

        .el-tabs--border-card {
            border: unset !important;
            box-shadow: unset !important;
        }

        .el-form {
            margin-top: 20px;
            margin-left: 40px;
            
            .el-select {
                width: calc(100% - 100px);
            }
            .el-cascader {
                width: calc(100% - 100px) ;
                padding-left:0;
            
            }
            .el-cascader .el-input {
                width: 100%;
                margin-left: 0px;
            }
        }

        .appearance-pane .el-form {
            .el-form-item__content {
                text-align: left;
            }
            .el-input {
                width: calc(100% - 100px);
            }
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