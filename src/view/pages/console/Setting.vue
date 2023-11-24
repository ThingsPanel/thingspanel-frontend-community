<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-10-13 09:35:09
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-10-27 16:18:42
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\console\Setting.vue
 * @Description: 
-->
<template>
    <div>
        <!-- 看板设置对话框 start -->
        <el-dialog class="el-dark-dialog" :visible.sync="dialogVisible" v-bind="dialogSetting" v-on="dialogEvents" :title="$t('VISUALIZATION.CONSOLE.CONSOLE_SETTING')">
            <el-form class="console-setting-form el-dark-input" label-position="left" label-width="140px"
                ref="settingFormRef" :model="formData" :rules="formRules">

            <el-form-item :label="$t('VISUALIZATION.CONSOLE.CONSOLE_ID')" prop="template_code">
                {{ data.code }}
            </el-form-item>

            <el-form-item :label="$t('VISUALIZATION.CONSOLE.CONSOLE_NAME')" prop="name">
                <el-input v-model="formData.name"></el-input>
            </el-form-item>

            <el-form-item :label="$t('VISUALIZATION.CONSOLE.BACKGROUND_COLOR')">
                <el-color-picker v-model="formData.configObj.background"></el-color-picker>
            </el-form-item>
            <el-row>
                <el-checkbox :disabled="true" v-model="formData.configObj.dragable">{{ $t('VISUALIZATION.CONSOLE.WHETHER_COMPONENT_CAN_BE_DRAGGED') }}</el-checkbox>
            </el-row>
            <el-row>
                <el-checkbox :disabled="true" v-model="formData.configObj.resizable">{{ $t('VISUALIZATION.CONSOLE.WHETHER_COMPONENT_CAN_BE_RESIZED') }}</el-checkbox>
            </el-row>
            <el-row>
                <el-checkbox :disabled="true" v-model="formData.configObj.showTools">{{ $t('VISUALIZATION.CONSOLE.WHETHER_DISPLAY_COMPONENT_TOOLBAR') }}</el-checkbox>
            </el-row>
            <el-row>
                <el-checkbox :disabled="true" v-model="formData.configObj.editTitle">{{ $t('VISUALIZATION.CONSOLE.WHETHER_COMPONENT_TITLE_CAN_BE_EDITED__DOUBLE_CLICK') }}</el-checkbox>
            </el-row>

            </el-form>
            <div class="dialog-footer">
                <el-button type="cancel" @click="dialogVisible=false">{{ $t('COMMON.CANCEL') }}</el-button>
                <el-button type="primary" @click="handleSubmit">{{ $t('COMMON.SAVE') }}</el-button>
            </div>
        </el-dialog>
        <!-- 看板设置对话框 end -->
    </div>
</template>

<script>
import { CommonProps, commonComputed } from "./Const.js";
import ConsoleAPI from "@/api/console.js";
import { message_success } from "@/utils/helpers.js";
const initConfigObj = {
    background: "#1f2a5d", dragable: true, resizable: true, showTools: true, editTitle: true
}
export default {
    components: {},
    props: {
        ...CommonProps,
        data: {
            type: [Object],
            default: () => ({})
        }
    },
    computed: {
        ...commonComputed
    },
    data() {
        return {
            // 表单数据
            formData: {
                name: "",
                code: "",
                configObj: { ...initConfigObj }
            },
            // 表单验证
            formRules: {},
            // 对话框设置
            dialogSetting: {
                // 对话框宽度
                width: "600px",
                // 标题
                title: "看板配置",
                // 自定义class
                customClass: "edit-dialog",
                // 是否可以通过点击 modal 关闭 Dialog
                closeOnClickModal: false
            },
            // 对话框事件
            dialogEvents: {
                // Dialog 打开的回调
                open: this.initForm
            }
        }
    },
    methods: {
        /**
         * @description: 初始化表单
         * @return {*}
         */        
        initForm() {
            let { config } = this.data;
            let configObj;
            if (config && config !== "{}") {
                configObj = JSON.parse(config);
            } else {
                configObj = { ...initConfigObj };
            }
            this.formData = { ...this.data, configObj };
            console.log("Setting.initForm.data", this.formData);

        },
        /**
         * @description: 提交表单数据
         * @return {*}
         */        
        handleSubmit() {
            this.formData.config = JSON.stringify(this.formData.configObj);
            ConsoleAPI.edit(this.formData)
                .then(({ data: result }) => {
                    if (result.code === 200) {
                        message_success("保存成功");
                        this.dialogVisible = false;
                        this.$emit("update:data", { ...this.formData })
                    }
                })
        }
    }
}
</script>
<style lang="scss" scoped>
.console-setting-form {
    margin: 40px 100px;
    
    .el-row {
        line-height: 40px;
        margin: 10px 0;
    }
    
}
.dialog-footer {
    text-align: center;
}
</style>