<template>
    <div>
        <!-- 添加组件对话框 start -->
        <el-dialog class="el-dark-dialog" title="添加组件" width="996px" custom-class="edit-dialog" :visible.sync="dialogVisible"
            :close-on-click-modal="false" @close="resetForm()">
            <el-form class="console-create-form el-dark-input" label-position="left" label-width="80px" ref="createFormRef"
                :model="formData" :rules="formRules">
                <div class="create-select">
                    <el-select v-model="formData.projectId">
                        <el-option v-for="(item, index) in projectList" :key="index" :value="item.id"
                            :label="item.name" />
                    </el-select>
                    <el-select v-model="formData.groupId">
                        <el-option v-for="(item, index) in groupList" :key="index" :value="item.id"
                            :label="item.name" />
                    </el-select>
                    <el-cascader ref="deviceRef" v-model="formData.device" :options="deviceList" clearable
                            :props="{ checkStrictly: true, emitPath: false }" @change="handleDeviceChange">
                            <template slot-scope="{ node, data }">
                                <span>{{ data.label }}</span>
                                <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
                            </template>
                        </el-cascader>
                </div>
              
                <grid-layout class="grid-box" :layout.sync="optionsData" :col-num="colNum" :row-height="30"
                    :is-draggable="false" :is-resizable="false" :is-mirrored="false" :vertical-compact="true"
                    :margin="[10, 10]" :use-css-transforms="true">

                    <grid-item class="grid-item" v-for="(option, index) in optionsData" :key="option['id'] + index"
                        :x="option.x" :y="option.y" :w="option.w" :h="option.h" :i="option.i">

                        <e-charts class="component-item" :ref="'component_' + option.i" :key="option['id']" mode="edit"
                            :show-header="true" v-if="option.controlType == 'dashboard' && !option.type" :option="option"
                            :value="option.value" :select.sync="option.select">
                            <el-checkbox v-model="option.select"></el-checkbox>
                        </e-charts>

                        <curve class="component-item" :ref="'component_' + option.i" :key="option['id']" :show-header="true"
                            mode="edit" v-if="option.controlType == 'history'" :option="option" :value="option.value"
                            :select.sync="option.select">
                            <el-checkbox v-model="option.select"></el-checkbox>
                        </curve>

                        <status class="component-item" :ref="'component_' + option.i" :key="option['id']"
                            mode="edit" :show-header="true" v-if="option.controlType == 'dashboard' && option.type == 'status'"
                            :option="option"  :select.sync="option.select">
                            <el-checkbox v-model="option.select"></el-checkbox>
                        </status>

                        <device-status class="component-item" :ref="'component_' + option.i" :key="option['id']"
                            mode="edit" :show-header="true" v-if="option.controlType == 'dashboard' && option.type == 'deviceStatus'"
                            :option="option" :value="option.value" :select.sync="option.select">
                            <el-checkbox v-model="option.select"></el-checkbox>
                        </device-status>

                        <signal-status class="component-item" :ref="'component_' + option.i" :key="option['id']"
                            mode="edit" :show-header="true" :status="deviceStatus" v-if="option.type == 'signalStatus'" :option="option"
                            :device="device" :value="option.value"  :select.sync="option.select">
                            <el-checkbox v-model="option.select"></el-checkbox>
                        </signal-status>

                        <text-info class="component-item" :ref="'component_' + option.i" :key="option['id']"
                            mode="edit" :show-header="true" :status="deviceStatus" v-if="option.type == 'textInfo'" :option="option"
                            :device="device" :value="option.value"  :select.sync="option.select">
                            <el-checkbox v-model="option.select"></el-checkbox>
                        </text-info>
                        <control class="component-item" :ref="'component_' + option.i" :key="option['id']"
                            mode="edit" :show-header="true" v-if="option.controlType == 'control'" :option="option"
                            :select.sync="option.select" :disabled="true">
                            <el-checkbox v-model="option.select"></el-checkbox>
                        </control>

                        <video-component class="component-item" style="min-width: 200px;min-height: 200px"
                            mode="edit" :ref="'component_' + option.i" :key="option['id']" :show-header="true" 
                            v-if="option.controlType == 'video'" :option="option" :select.sync="option.select">
                            <el-checkbox v-model="option.select"></el-checkbox>
                        </video-component>

                    </grid-item>
                </grid-layout>
            </el-form>
            <div class="dialog-footer">
                <el-button type="primary" @click="handleSubmit">创建</el-button>
            </div>
        </el-dialog>
        <!-- 添加组件对话框 end -->
    </div>
</template>

<script>
import { GridLayout, GridItem } from "vue-grid-layout";
import ECharts from "./components/Echarts"
import Curve from "./components/Curve";
import Control from "./components/Control";
import Status from "./components/Status"
import SignalStatus from "./components/SignalStatus"
import DeviceStatus from "./components/DeviceStatus"
import TextInfo from "./components/TextInfo"
import VideoComponent from "./components/Video";
import { business_index } from "@/api/business.js"
import { device_group_drop } from "@/api/asset.js"
import { getDeviceTree } from "@/api/device";
import PluginAPI from "@/api/plugin.js"
import { message_error, getRandomString } from "@/utils/helpers";
export default {
    components: { GridLayout, GridItem, ECharts, Curve, Control, Status, DeviceStatus, VideoComponent },
    props: {
        visible: {
            type: [Boolean],
            default: false
        },
        data: {
            type: [Object, Array],
            default: () => ({})
        }
    },
    computed: {
        dialogVisible: {
            get() { return this.visible },
            set(val) { this.$emit("update:visible", val) }
        }
    },
    data() {
        return {
            // 表单数据
            formData: {
                projectId: "",
                groupId: "",
                device: []
            },
            // 表单验证
            formRules: {},
            // 项目列表
            projectList: [],
            // 分组列表
            groupList: [],
            // 设备列表
            deviceList: [],
            // 插件数据
            pluginData: {},
            // 图表数据
            optionsData: [],
            // grid-layout的列数
            colNum: 24,
        }
    },
    watch: {
        "formData.projectId": {
            handler(projectId) {
                if (projectId) {
                    this.getGroupList(projectId);
                    this.formData.groupId = "";
                    this.optionsData = [];
                }
            }, deep: true
        },
        "formData.groupId": {
            handler(groupId) {
                if (groupId) {
                    this.getDeviceList(groupId)
                    this.formData.device = [];
                    this.optionsData = [];
                }
            }, deep: true
        }
    },
    mounted() {
        console.log("addComponent.model", this.model)
        this.getProjectList();
    },
    methods: {
        /**
         * @description: 提交
         * @return {*}
         */        
        handleSubmit() {
            this.validate(valid => {
                if (valid) {
                    this.dialogVisible = false;
                    console.log("handleSubmit.formData", this.formData);
                    // 1. 返回select为true的图表options
                    // 2. 把图表绑定的物模型添加到图表options对象中
                    // 3. 把设备id和对应的图表id添加到dataSource中
                    let options = JSON.parse(JSON.stringify(this.optionsData.filter(item => item.select)));
                    let dataSource = [];
                    // 输出插件信息
                    const { tsl } = this.pluginData;
                    options.forEach(item => {
                        item.uId = getRandomString(12);
                        if (typeof item.mapping === "string") {
                            let p = tsl.properties.find(p => p.name === item.mapping);
                            item.dataSrouce = [p];
                        } else if (typeof item.mapping === "object") {
                            let ps = [];
                            item.mapping.forEach(m => {
                                let p = tsl.properties.find(p => p.name === m);
                                ps.push(p);
                            });
                            item.dataSource = ps;
                            // let p = tsl.properties.
                        }
                        
                    })
                    console.log("handleSubmit.pluginData", tsl.properties);
                    console.log("handleSubmit.optionsData", options);
                    this.$emit("change", JSON.parse(JSON.stringify(options)), this.formData.device);
                    this.resetForm();
                }
            })
        },
        /**
         * @description: 获取项目列表
         * @return {*}
         */        
        getProjectList() {
            business_index({ limit: 10, page: 1 })
                .then(({ data: result }) => {
                    if (result.code === 200) {
                        console.log("getProjectList", result.data.data)
                        this.projectList = result.data.data || [];
                    }
                })
        },
        /**
         * @description: 获取分组列表
         * @param {*} projectId
         * @return {*}
         */        
        async getGroupList(projectId) {
            let { data: result } = await device_group_drop({ business_id: projectId });
            if (result.code === 200) {
                this.groupList = result?.data.map(item => ({ name: item.device_group, id: item.id })) || [];
                this.formData.device = [];
                console.log("getGroupList", this.groupList)
            }
        },
        /**
         * @description: 获取设备列表
         * @param {*} groupId
         * @return {*}
         */        
        async getDeviceList(groupId) {
            const params = { current_page: 1, per_page: 9999, asset_id: groupId }
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
        /**
         * @description: 选择设备的回调
         * @param {*} v
         * @return {*}
         */        
        handleDeviceChange(v) {
            const deviceRef = this.$refs.deviceRef;
            const { data } = deviceRef.getCheckedNodes()[0];
            console.log("handleDeviceChange", v, data)
            this.getPluginData(data.pluginId);
        },
        /**
         * 通过插件id获取插件数据
         * @param pluginId
         */
        async getPluginData(pId) {
            let { data: result } = await PluginAPI.page({ "current_page": 1, "per_page": 10, "id": pId })
            if (result.code == 200) {
                const data = result.data.data[0];
                const jsonObj = JSON.parse(data?.chart_data || "{}");
                this.pluginData = JSON.parse(JSON.stringify(jsonObj));
                console.log("getPluginData", jsonObj);
                // this.pluginName = data.model_name;
                // this.tslData = jsonObj.tsl || {}
                let chartData = jsonObj.chart || [];
                this.optionsData = this.getDefaultLayout(chartData, 4);
            }
        },
        /**
         * 获取默认布局
         * @param options
         * @param col
         * @returns {*}
         */
        getDefaultLayout(options, col) {
            // 每个元素的宽占几列
            let colW = this.colNum / col;
            // 每个元素的高占几行
            let rowH = colW;
            // 列数，行数
            let colI = 0, rowI = 0;
            for (let i = 0; i < options.length; i++) {
                if (colI == col) {
                    // 如果超过4列则换行
                    rowI++;
                    colI = 0;
                }
                options[i].w = colW;
                options[i].h = rowH;
                options[i].x = colI * colW;
                options[i].y = rowI * rowH;
                options[i].i = i;
                options[i].select = true;  // 图表默认选中
                colI++;
            }
            return options;
        },
        /**
         * 表单验证
         * @param callback
         * @returns 
         */
        validate(callback) {
            try {
                if (!this.formData.projectId) throw new Error("请选择项目");
                if (!this.formData.groupId) throw new Error("请选择分组");
                if (!this.formData.device || !this.formData.device.length) throw new Error("请选择设备");
                if (this.optionsData.every(item => !item.select)) throw new Error("至少选择一个图表");
                callback(true);
            } catch(err) {
                message_error(err.message);
                callback(false);
            }
        },
        /**
         * 清空表单
         * @returns 
         */
        resetForm() {
            this.formData = {
                projectId: "",
                groupId: "",
                device: []
            }
            this.groupList = [];
            this.deviceList = [];
            this.optionsData = [];
        }
    }
}
</script>
<style lang="scss" scoped>
.edit-dialog {
    width: 996px!important;
    .create-select {
        display: flex;
        padding: 0;
        .el-select {
            margin-right: 10px;
        }
        .el-cascader {
            line-height: unset;
        }
    }
    .dialog-footer {
        text-align: center;
    }
}
.grid-box {
    width: 100%;
    height: 100%;
    min-height: 225px;
    margin-top: 20px;
}

.component-item {
    width: 100%;
    height: 100%;
    //position: absolute;
    top: 0;
    left: 0;
}
</style>