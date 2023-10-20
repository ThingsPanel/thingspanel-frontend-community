<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-10-13 09:35:09
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-10-20 13:40:01
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\console\Setting.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div>
        <!-- 看板设置对话框 start -->
        <el-dialog class="el-dark-dialog" width="600px" title="看板配置" custom-class="edit-dialog" :visible.sync="dialogVisible"
            :close-on-click-modal="false">
            <el-form class="console-setting-form el-dark-input" label-position="left" label-width="120px"
                ref="settingFormRef" :model="formData" :rules="formRules">

            <el-form-item label="看板编号" prop="template_code">
                {{ data.code }}
            </el-form-item>

            <el-form-item label="看板名称" prop="name">
                <el-input v-model="formData.name"></el-input>
            </el-form-item>

            <el-form-item label="看板背景颜色">
                <el-color-picker v-model="formData.configObj.background"></el-color-picker>
            </el-form-item>
            <el-row>
                <el-checkbox :disabled="true" v-model="formData.configObj.dragable">组件是否可拖拽</el-checkbox>
            </el-row>
            <el-row>
                <el-checkbox :disabled="true" v-model="formData.configObj.resizable">组件是否可调整大小</el-checkbox>
            </el-row>
            <el-row>
                <el-checkbox :disabled="true" v-model="formData.configObj.showTools">是否显示组件工具栏</el-checkbox>
            </el-row>
            <el-row>
                <el-checkbox :disabled="true" v-model="formData.configObj.editTitle">是否可编辑组件标题（双击标题编辑）</el-checkbox>
            </el-row>

            </el-form>
            <div class="dialog-footer">
                <el-button type="cancel" @click="dialogVisible=false">取消</el-button>
                <el-button type="primary" @click="handleSubmit">确定</el-button>
            </div>
        </el-dialog>
        <!-- 看板设置对话框 end -->
    </div>
</template>

<script>
import ConsoleAPI from "@/api/console.js";
import { message_success } from "@/utils/helpers.js";
const initConfigObj = {
    background: "", dragable: true, resizable: true, showTools: true, editTitle: true
}
export default {
    components: {},
    props: {
        visible: {
            type: [Boolean],
            default: false
        },
        data: {
            type: [Object],
            default: () => ({})
        }
    },
    computed: {
        dialogVisible: {
            get() { return this.visible },
            set(val) { this.$emit("update:visible", val) }
        },
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
        }
    },
    watch: {
        dialogVisible: {
            handler(visible) {
                // 打开对话框时初始化表单
                visible && this.initForm();
            }, immediate: true
        }
    },
    methods: {
        /**
         * @description: 初始化表单
         * @return {*}
         */        
        initForm() {
            console.log("Setting.initForm.data", this.data);
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
            console.log("setting", this.formData);
            this.formData.config = JSON.stringify(this.formData.configObj);
            ConsoleAPI.edit(this.formData)
                .then(({ data: result }) => {
                    console.log(result);
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