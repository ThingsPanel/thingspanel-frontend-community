<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-28 13:49:38
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-28 14:55:14
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\product\managment\batch\pre-registration\AddDevice.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <el-dialog class="el-dark-dialog" title="添加设备" :visible.sync="dialogVisible" width="400px" :before-close="handleClose"
        :close-on-click-modal="false">
        <el-form :inline="false" label-position="left" label-width="80px" ref="formRef" :model="formData" :rules="formRules">
            <el-row>
                <el-form-item label="项目" prop="projectId" required>
                    <!-- 遍历项目列表 -->
                    <el-select filterable v-model="formData.projectId" @change="handleChangeProject">
                        <el-option v-for="item in projectList" :key="item.id" :label="item.name" :value="item.id"></el-option>
                    </el-select>
                </el-form-item>
            </el-row>

            <el-row>
                <el-form-item label="分组" prop="groupId">
                    <!-- 遍历分组 -->
                    <el-select filterable v-model="formData.groupId" required>
                        <el-option v-for="item in groupList" :key="item.id" :label="item.device_group" :value="item.id"></el-option>    
                    </el-select>
                </el-form-item>
            </el-row>

            <el-row>
                <el-form-item label="设备名" prop="deviceName" required>
                    <!-- 设备名 -->
                    <el-input v-model="formData.deviceName" placeholder="请输入设备名"></el-input>
                </el-form-item>
            </el-row>
        </el-form>

        <span slot="footer" class="dialog-footer text-center">
            <el-button type="save" @click="handleSubmit">保存</el-button>
        </span>
    </el-dialog>
</template>

<script>
import { business_index } from "@/api/business.js";
import { device_group_drop } from "@/api/asset.js";
import ProductAPI from "@/api/product.js";
export default {
    props: {
        visible: {
            type: [Boolean],
            default: false
        },
        data: {
            type: [Object],
            default: () => { return {} }
        }
    },
    data() {
        return {
            formData: {
                projectId: "",
                groupId: "", 
                deviceName: ""
            },
            formRules: {
                projectId: [{ required: true, message: "请选择项目" }],
                groupId: [{ required: true, message: "请选择分组"}],
                deviceName: [{ required: true, message: "请输入设备名"}]
            },
            // 项目列表
            projectList: [],
            // 分组列表
            groupList: [],
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
        visible(val) {
            if (val) {
                this.initForm();
            }
        }
    },
    methods: {
        initForm() {
            this.formData = JSON.parse(JSON.stringify(this.data));
            console.log("initForm", this.formData);
            // 初始化项目列表
            const params = { page: 1,limit: 100 }
            business_index(params)
                .then(({ data: result }) => {
                    if (result.code === 200) {
                        this.projectList = result.data?.data || [];
                    }
                });
        },
        handleChangeProject(projectId) {
            // 选择项目后, 获取项目下的分组列表
            console.log( "handleChangeProject",   projectId)
            device_group_drop({ business_id: projectId })
                .then(({ data: result }) => {
                    console.log("asset_index", result);
                    this.groupList = result.data || [];
                });
        },
        handleSubmit() {
            this.$refs["formRef"].validate((valid) => {
                if (valid) {
                    const params = {
                        activation_code: this.formData.id,
                        name: this.formData.deviceName,
                        access_id: this.formData.groupId
                    }
                    ProductAPI.generateDevice(params)
                        .then(({ data: result }) => {
                            if (result.code === 200) {
                                this.$message.success("激活成功");
                                this.dialogVisible = false;
                                this.$emit("submit");
                            }
                        })
                }
            });
        },
        handleClose() {
            this.dialogVisible = false;
        }
    }
}
</script>
<style lang="scss" scoped></style>