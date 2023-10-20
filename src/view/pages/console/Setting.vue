<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-10-13 09:35:09
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-10-20 09:14:10
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
                <el-color-picker :disabled="true" v-model="formData.configData.background"></el-color-picker>
            </el-form-item>
            <el-row>
                <el-checkbox :disabled="true" v-model="formData.configData.dragable">组件是否可拖拽</el-checkbox>
            </el-row>
            <el-row>
                <el-checkbox :disabled="true" v-model="formData.configData.showTools">是否显示组件工具栏</el-checkbox>
            </el-row>
            <el-row>
                <el-checkbox :disabled="true" v-model="formData.configData.editTitle">是否可编辑组件标题</el-checkbox>
            </el-row>

            </el-form>
            <div class="dialog-footer">
                <el-button type="primary" @click="handleSubmit">确定</el-button>
                <el-button type="cancel" @click="dialogVisible=false">取消</el-button>
            </div>
        </el-dialog>
        <!-- 看板设置对话框 end -->
    </div>
</template>

<script>
import ConsoleAPI from "@/api/console.js";
import { message_success } from "@/utils/helpers.js";
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
            formData: {
                name: "",
                code: "",
                config: {
                    background: "",
                    dragable: true,
                    showTools: true,
                    editTitle: true
                }
            },
            // 表单验证
            formRules: {},
        }
    },
    watch: {
        data: {
            handler(newValue) {
                if (newValue) {
                    let { id, name, code, config } = this.data;
                    this.formData = { id, name, code, 
                        configData: {
                            background: "",
                            dragable: true,
                            showTools: true,
                            editTitle: true
                        }
                    };
                }
            }
        }
    },
    methods: {
        handleSubmit() {
            console.log("setting", this.formData);
            // this.formData.config = JSON.stringify(this.formData.configData);
            delete this.formData.code;
            ConsoleAPI.edit(this.formData)
                .then(({ data: result }) => {
                    console.log(result);
                    if (result.code === 200) {
                        message_success("保存成功");
                        this.dialogVisible = false;
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