<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-22 10:21:07
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-28 09:52:55
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\alarm\AlarmProcess.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->

<template>
    <el-dialog :title="'处理'" class="el-dark-dialog" :visible.sync="dialogVisible" width="600px" top="10vh">
        <el-form class="el-dark-input" label-position="left" label-width="85px">
            <el-form-item label="处理说明">
                <el-input type="textarea" :rows="3" placeholder="请输入处理说明" 
                    v-model="formData.processing_instructions"></el-input>
            </el-form-item>

            <div class="text-right">
                <el-button size="medium" type="border" @click="handleSubmit">确定</el-button>
            </div>
        </el-form>
    </el-dialog>
</template>
    
<script>
export default {
    name: "AlarmDetail",
    props: {
        data: {
            type: [Object, Array],
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
                rows: "",
                processing_instructions: ""
            }
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
                    this.initFormData();
                }
            }
        }
    },
    methods: {
        initFormData() {
            console.log("initFormData", this.data)
            if (Object.prototype.toString.call(this.data) === '[object Array]') {
                this.formData.id = this.data.map(item => item.id) || [];
            } else {
                this.formData.id = this.data.id || "";
            }
        },
        handleSubmit() {
            this.$emit("change", this.formData);
            this.handleCancel();
        },
        handleCancel() {
            this.dialogVisible = false;
        }
    }
}
</script>
    
<style scoped></style>