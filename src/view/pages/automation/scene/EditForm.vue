<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-03 14:04:59
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-10 19:30:09
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\scene\EditForm.vue
 * @Description: 场景编辑表单
-->
<template>
    <el-dialog :title="formData.id ? '编辑' : '新增'" class="el-dark-dialog" :close-on-click-modal="false"
        :visible.sync="dialogVisible" height="60%" top="10vh" custom-class="edit-dialog">

        <el-form label-position="left" label-width="85px">
            <!-- 场景标题 -->
            <el-form-item :label="$t('AUTOMATION.SCENE_TITLE')" required>
                <el-input ref="nameRef" v-model="formData.scenario_name"></el-input>
            </el-form-item>

            <!-- 场景描述 -->
            <el-form-item :label="$t('AUTOMATION.SCENE_DESCRIPTION')">
                <el-input v-model="formData.scenario_description"></el-input>
            </el-form-item>

            <el-form-item :label="$t('')" required>
                <div style="display: flex;margin-bottom: 10px" v-for="(action, index) in actions" :key="index">

                    <el-select :no-data-text="$t('COMMON.SELECT_NO_DATA')" ref="actionTypeRef"
                        style="width: 130px;margin-right:20px" :placeholder="$t('AUTOMATION.PLACEHOLDER.ACTION_TYPE')"
                        v-model="action.type" :disabled="actions.length > (index + 1)">
                        <el-option v-for="(item, index) in action.typeOptions" :key="index" :label="item.label"
                            :value="item.value"></el-option>
                    </el-select>

                    <!-- 操作设备 -->
                    <CommandDevice ref="commandRef" style="width:100%" v-if="action.type === 'device'"
                        :data="action.commands" @change="v => handleCommandChange(action, v)" />


                    <!-- 触发联动规则 -->
                    <SceneSelector ref="sceneRef" style="width:100%" v-if="action.type === 'scene'" :data="action.scenes"
                        @change="v => handleSceneChange(action, v)" />

                    <!-- 告警通知 -->
                    <AlarmNotification ref="alarmRef" style="width:100%" v-if="action.type === 'alarm'" :data="action.alarm"
                        @change="v => handleAlarmChange(action, v)" />
                    <!-- <el-button v-if="action.type=='device'" type="danger" size="mini">{{ $t('AUTOMATION.DELETE') }}</el-button> -->

                    <div style="margin-left:20px;">
                        <el-button style="height:40px" type="danger" size="small" :v-if="actions.length > 0"
                            @click="handleDeleteAction(action)">{{ $t('AUTOMATION.DELETE') }}</el-button>
                    </div>

                </div>
                <el-button type="border" size="mini" :disabled="actions.length > 2" @click="handleAddAction">{{
                    $t('AUTOMATION.ADD_ACTION_TYPE') }}</el-button>
            </el-form-item>


            <div class="text-right">
                <el-button size="medium" type="cancel" @click="handleSubmit">{{ $t('AUTOMATION.SAVE') }}</el-button>
            </div>
        </el-form>
    </el-dialog>
</template>
  
<script>
import CommandDevice from "./action/CommandDevice";
import SceneSelector from "./action/SceneSelector";
import AlarmNotification from "./action/AlarmNotification";
import Auto from "@/api/automation_1.0"
import { message_success, message_error, typeConvert } from '@/utils/helpers';
import i18n from "@/core/plugins/vue-i18n"

const actionTypeOptions = [
    { label: i18n.t('AUTOMATION.OPERATING_DEVICE'), value: "device" },
    { label: "触发联动规则", value: "scene" },
    { label: i18n.t('AUTOMATION.TRIGGER_ALARM'), value: "alarm" },
];
export default {
    name: "EditForm",
    components: { CommandDevice, SceneSelector, AlarmNotification },
    props: {
        id: {
            type: [String],
            default: ""
        },
        visible: {
            type: [Boolean],
            default: false
        }
    },
    data() {
        return {
            formData: {
                scenario_name: "",
                scenario_description: ""
            },
            actions: [
                { type: "", typeOptions: actionTypeOptions, disabled: false }
            ]
        }
    },
    computed: {
        dialogVisible: {
            get() {
                return this.visible;
            },
            set(val) {
                this.$emit("update:visible", val);
            }
        }
    },
    watch: {
        visible: {
            handler(newValue) {
                if (newValue) {
                    if (this.id) {
                        // 编辑
                        this.getSceneDetail(this.id);

                    } else {
                        // 新增
                        this.formData = {
                            scenario_name: "",
                            scenario_description: ""
                        };
                        this.actions = [];
                        this.setActionTypeOptions();
                    }
                } else {
                    this.formData = {};
                }
            }
        }
    },
    methods: {
        /**
         * @description: 初始化执行动作类型下拉列表
         * @return {*}
         */
        setActionTypeOptions() {
            let list = JSON.parse(JSON.stringify(actionTypeOptions));
            this.actions.forEach(action => {
                if (action.type) {
                    action.typeOptions = JSON.parse(JSON.stringify(list));
                    let index = list.findIndex(item => item.value == action.type);
                    list.splice(index, 1);
                }
            })
        },
        /**
         * @description: 新增一个执行动作
         * @return {*}
         */
        handleAddAction() {
            let result = this.actions.every(item => item.type != "");
            if (!result) {
                message_error(this.$t('AUTOMATION.ERROR.ACTION_TYPE'));
                return;
            }
            // 已选动作
            let list = this.actions.map(item => item.type);
            // 剔除已选动作
            let arr = actionTypeOptions.filter(type => !list.some(item => item == type.value));
            this.actions.push({ type: "", typeOptions: arr, disabled: false })
        },
        /**
         * @description: 删除动作
         * @param {*} action
         * @return {*}
         */
        handleDeleteAction(action) {
            this.actions = this.actions.filter(item => item != action)
            this.setActionTypeOptions();
        },
        /**
         * @description: 新增一行命令
         * @return {*}
         */
        handleAddCommand() {
            this.formData.commands.push({ data: {} });
        },
        /**
         * @description: 保存
         * @return {*}
         */
        handleSubmit() {
            if (!this.validate()) {
                return;
            }
            // 
            let params = JSON.parse(JSON.stringify(this.formData));
            params.scenario_actions = [];
            // 操作设备
            this.actions.commands = this.actions.commands ? 
                this.actions.commands :
                this.actions.find(item => item.type === "device")?.commands || null;
            this.actions.commands && this.actions.commands.forEach(cmd => {
                let { name, type, mode, operator } = cmd.state
                let instruct = {};
                let device_model = "1";
                if (mode === "command") {
                    device_model = "2";
                    instruct.method = cmd.state.name;
                    instruct.params = cmd.state.params;
                } else {
                    device_model = "1";
                    instruct[name] = typeConvert(operator.value, type);
                }
                params.scenario_actions.push({
                    action_type: "1",
                    device_id: cmd.deviceId,
                    device_model,
                    instruct: JSON.stringify(instruct),
                    remark: ""
                })
            })
            // 场景
            this.actions.scenes = this.actions.scenes ?  
                this.actions.scenes : 
                this.actions.find(item => item.type === "scene");
            this.actions.scenes && this.actions.scenes.forEach(scene => {
                let instruct = { automation_id: scene.id, switch: scene.switch }
                params.scenario_actions.push({
                    action_type: "2",
                    device_id: "",
                    device_model: "",
                    instruct: JSON.stringify(instruct),
                    remark: ""
                })
            })

            this.actions.alarm = this.actions.alarm ?  
                this.actions.alarm : 
                this.actions.find(item => item.type === "alarm");
            if (this.actions.alarm) {
               const alarm = this.actions.alarm;
                params.scenario_actions.push({
                    action_type: "3",
                    device_id: "",
                    device_model: "",
                    instruct: "",
                    remark: "",
                    warning_strategy: {
                        id: alarm.id || "",
                        warning_strategy_name: "",
                        warning_level: alarm.warningLevel,
                        repeat_count: alarm.repeatTimes,
                        inform_way: alarm.notification
                    }
                })
            }

            if (!this.formData.id) {
                Auto.Scene.add(params)
                    .then(({ data }) => {
                        if (data.code === 200) {
                            this.dialogVisible = false;
                            this.$emit("submit");
                            message_success("新增成功!");
                        }
                    })
            } else {
                Auto.Scene.edit(params)
                    .then(({ data }) => {
                        if (data.code === 200) {
                            this.dialogVisible = false;
                            this.$emit("submit");
                            message_success("编辑成功!");
                        }
                    })
            }
        },
        /**
         * @description: 改变指定行
         * @param {*} action
         * @param {*} v
         * @return {*}
         */
        handleCommandChange(action, v) {
            let index = this.actions.findIndex(item => item == action);
            if (index === -1) return;
            let tmp = JSON.parse(JSON.stringify(this.actions[index]));
            tmp.commands = JSON.parse(JSON.stringify(v));
            this.actions.splice(index, 1, tmp);
            action.commands = v;
            this.actions.commands = v;

        },
        handleSceneChange(action, v) {
            // let tmp = JSON.parse(JSON.stringify(this.actions[index]));
            // console.log("handleSceneChange", tmp)
            // tmp.scenes = JSON.parse(JSON.stringify(v));
            // this.actions.splice(index, 1, tmp);
            this.actions.scenes = v;
        },
        handleAlarmChange(action, v) {
            this.actions.alarm = v;
        },
        /**
         * @description: 删除指定行
         * @param {*} command
         * @param {*} v
         * @return {*}
         */
        handleDeleteCommand(command) {
            let index = this.formData.commands.findIndex(item => item == command);
            this.formData.commands.splice(index, 1);
        },
        getSceneDetail(id) {
            Auto.Scene.get({ id })
                .then(({ data }) => {
                    if (data.code === 200) {
                        let result = data?.data || "{}";
                        if (result !== "{}") {
                            let tmp = JSON.parse(JSON.stringify(result));
                            // tmp.commands = commands;
                            tmp.commands = this.getCommands(tmp)
                            tmp.scenes = this.getScenes(tmp);
                            tmp.alarm = this.getAlarm(tmp)
                            this.formData = tmp;
                            this.actions = [];
                            tmp.commands.length && this.actions.push({ type: "device", commands: tmp.commands })
                            tmp.scenes.length && this.actions.push({ type: "scene", scenes: tmp.scenes })
                            tmp.alarm && this.actions.push({ type: "alarm", alarm: tmp.alarm })

                            this.setActionTypeOptions();
                        }
                    }
                })
        },
        getCommands(v) {
            let cmds = v?.scenario_actions.filter(item => item.action_type === "1") || [];
            let commands = cmds.map(cmd => {
                let p = JSON.parse(cmd.instruct);
                let name = Object.keys(p)[0];
                let value = p[name];
                let state = {};
                let stateJSON = "";
                if (cmd.device_model === "1") {
                    // 属性
                    state = {
                        name,
                        mode: "property",
                        operator: {
                            symbol: "",
                            value,
                        }
                    }
                    stateJSON = JSON.stringify(state);

                } else if (cmd.device_model === "2") {
                    // 命令

                    state = {
                        name: p.method || "",
                        mode: "command",
                        params: p.params || ""
                    }
                    stateJSON = JSON.stringify(state);
                } else if (cmd.device_model === "3") {
                    state = {
                        name: "custom",
                        mode: "custom",
                        params: JSON.parse(cmd.instruct)
                    }
                    stateJSON = JSON.stringify(state);

                }

                return {
                    // data: {
                    projectId: cmd.business_id,
                    groupId: cmd.asset_id,
                    device: cmd.device_id,
                    deviceId: cmd.device_id,
                    state,
                    stateJSON: JSON.stringify(state)
                    // }
                }
            })
            return commands;
        },
        getScenes(v) {
            let scenes = v?.scenario_actions.filter(item => item.action_type === "2") || [];
            return scenes.map(scene => {
                let instruct = JSON.parse(scene.instruct)
                return {
                    id: instruct.automation_id,
                    switch: instruct.switch
                }
            })

        },
        getAlarm(v) {
            let alarm = v?.scenario_actions.find(item => item.action_type === "3")?.warning_strategy || "";
            if (!alarm) return null;
            return {
                id: alarm.id,
                warningLevel: alarm.warning_level,
                repeatTimes: alarm.repeat_count,
                notification: alarm.inform_way
            }
        },
        validate() {
            if (!this.formData.scenario_name || this.formData.scenario_name === "") {
                this.$refs.nameRef.focus();
                message_error(this.$t('AUTOMATION.SCENE_NAME'));
                return false;
            }
            for (let i = 0; i < this.actions.length; i++) {
                const action = this.actions[i];
                if (action.type === "device" && !this.$refs.commandRef[0].validate()) {
                    return false;
                }
                if (action.type === "scene" && !this.$refs.sceneRef[0].validate()) {
                    return false;
                }
                if (action.type === "alarm" && !this.$refs.alarmRef[0].validate()) {
                    return false;
                }
            }
            
            // for (let i = 0; i < this.$refs.deviceTypeRef.length; i++) {
            //     const ref = this.$refs.deviceTypeRef[i];
            //     if (!ref.validate()) return false;
            // }
            // if (!this.$refs.sceneRef[0].validate()) {
            //     return false;
            // }
            return true;
        }
    }
}
</script>
  
<style lang="scss" scoped>
::v-deep .edit-dialog {
    width: 60%!important;
    min-width: 1147px!important;
  }
</style>