<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-10-13 09:35:09
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-10-18 15:19:33
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\console\Setting.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div>
        <!-- 看板设置对话框 start -->
        <el-dialog class="el-dark-dialog" width="800px" title="看板配置" custom-class="edit-dialog" :visible.sync="dialogVisible"
            :close-on-click-modal="false">
            <el-form class="console-setting-form el-dark-input" label-position="left" label-width="120px"
                ref="settingFormRef" :model="formData" :rules="formRules">

            <el-form-item label="看板编号">
                {{ data.code }}
            </el-form-item>

            <el-form-item label="看板名称">
                <el-input v-model="formData.name"></el-input>
            </el-form-item>

            <el-form-item label="看板背景颜色">
                <el-input v-model="formData.console_name"></el-input>

            </el-form-item>
            <el-row>
                <el-checkbox v-model="formData.dragable">组件是否可拖拽</el-checkbox>
            </el-row>
            <el-row>
                <el-checkbox v-model="formData.showTools">是否显示组件工具栏</el-checkbox>
            </el-row>
            <el-row>
                <el-checkbox v-model="formData.editTitle">是否可编辑组件标题</el-checkbox>
            </el-row>

            </el-form>
            <div class="dialog-footer">
                <el-button type="primary" @click="handleSubmit">确定</el-button>
            </div>
        </el-dialog>
        <!-- 看板设置对话框 end -->
    </div>
</template>

<script>
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
        }
    },
    data() {
        return {
            // 表单数据
            formData: {
                template_code: "123456"
            },
            // 表单验证
            formRules: {},
        }
    },
    methods: {
        handleSubmit() {

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