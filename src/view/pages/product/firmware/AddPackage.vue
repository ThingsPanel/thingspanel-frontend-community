<template>
    <div class="firmware-create">
        <el-dialog class="el-dark-dialog" :title="$t('PRODUCT_MANAGEMENT.PRODUCT_LIST.PRODUCT_LIST_ADD.CREATEPRODUCT')"
            :visible.sync="dialogVisible" width="30%" :before-close="() => dialogVisible=false" :close-on-click-modal="false">
            <el-form ref="firmwareCreateForm" :rules="rules" label-position="left" :model="form"
                :hide-required-asterisk="true" label-width="150px">

                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PACKAGE_NAME')"
                    prop="firmware_name" required>
                    <el-input v-model="form.firmware_name"></el-input>
                </el-form-item>

                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.BELONGINGPRODUCT')"
                    prop="product">
                    <el-select v-model="form.product">
                        <el-option label="手推车" value="手推车"></el-option>
                        <el-option label="井盖" value="井盖"></el-option>
                        <el-option label="行李拖斗" value="行李拖斗"></el-option>
                    </el-select>
                </el-form-item>

                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PACKAGE_MODULE')"
                    prop="firmware_name">
                    <el-input v-model="form.firmware_name"></el-input>
                </el-form-item>

                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PACKAGE_VERSION')"
                    prop="firmware_version">
                    <el-input v-model="form.firmware_version"></el-input>
                </el-form-item>

                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.SIGNTYPE')" prop="signature">
                    <el-select :value="form.signature">
                        <el-option label="MD5" value="MD5"></el-option>
                        <el-option label="SHA256" value="SHA256"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.UPLOAD')">
                    <el-upload
                        class="upload-demo"
                        action="https://jsonplaceholder.typicode.com/posts/"
                        multiple
                        :limit="3"
                        >
                        <el-button size="small" type="primary">点击上传</el-button>
                    </el-upload>
                </el-form-item>


                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.DESCRIPTION')"
                    prop="description">
                    <el-input type="textarea" v-model="form.description"></el-input>
                </el-form-item>


                <el-form-item :label="'其他配置'">
                    <el-row v-for="(config, index) in form.configs" :key="index">
                        <el-col :span="7" style="margin-right:10px">
                            <el-input placeholder="key" v-model="config.key"></el-input>
                        </el-col>
                        <el-col :span="7" style="margin-right:10px">
                            <el-input placeholder="value" v-model="config.value"></el-input>
                        </el-col>
                        <el-col :span="6"  :offset="2">
                            <el-button type="border" v-if="index===0" @click="handleAddConfig">增加一行</el-button>
                            <el-button type="danger" v-else @click="handleDeleteConfig(config)">删除</el-button>
                        </el-col>
                    </el-row>
                </el-form-item>

                <div class="text-right">
                    <el-button type="border"  @click="onSubmit">{{$t('COMMON.CONFIRM') }}</el-button>
                    <el-button type="primary" @click="dialogVisible=false">{{$t('COMMON.CANCEL') }}</el-button>
                </div>
                
            </el-form>
        </el-dialog>
    </div>
</template>
    
<script>
import moment from "moment";
import i18n from "@/core/plugins/vue-i18n.js"
export default {
    name: "AddPackage",
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
    data: () => ({
        form: {
            product: "",
            firmware_name: "",
            firmware_version: "",
            signature: "",
            sign_value: "",
            description: "",
            configs: [
                {}
            ]
        },
        rules: {
            product: [
                { required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER1') }
            ],
            firmware_name: [
                { required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER2') }
            ],
            firmware_version: [
                { required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER3') }
            ],
            signature: [
                { required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER4') }
            ],
            sign_value: [
                { required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER5') }
            ],
            description: [
                { required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER6') }
            ]
        }
    }),
    methods: {
        onSubmit() {
            this.$refs.firmwareCreateForm.validate((valid) => {
                if (valid) {
                    let formData = JSON.parse(JSON.stringify(this.form))
                    formData.created_at = moment().format("YYYY-MM-DD HH:mm:ss")
                    this.$emit("submit", formData)

                    setTimeout(() => {
                        this.$refs.firmwareCreateForm.resetFields()
                    }, 500)
                }
            })
        },
        handleAddConfig() {
            this.form.configs.push({})
        },
        handleDeleteConfig(config) {
            const index = this.form.configs.findIndex(item => item === config);
            console.log(index);
        }
    }
}
</script>
    
<style lang="scss">
//.firmware-create{
//  .el-form-item__label{
//    color: #fff;
//  }
//
//  .el-upload-dragger{
//    background-color: rgba(22, 30, 67, 0.5) !important;
//  }
//
//  textarea{
//    background-color: rgba(22, 30, 67, 0.5) !important;
//    color: #b3b7c1 !important;
//  }
//
//  .el-radio__label{
//    color: #b3b7c1 !important;
//  }
//}
</style>