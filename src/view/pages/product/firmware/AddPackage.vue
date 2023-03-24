<template>
    <div class="firmware-create">
        <el-dialog class="el-dark-dialog" :title="$t('PRODUCT_MANAGEMENT.PRODUCT_LIST.PRODUCT_LIST_ADD.CREATEPRODUCT')"
            :visible.sync="dialogVisible" width="30%" :before-close="() => dialogVisible=false" :close-on-click-modal="false">
            <el-form ref="firmwareCreateForm" :rules="rules" label-position="left" :model="form"
                label-width="150px">

                <!-- 升级包名称 -->
                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PACKAGE_NAME')"
                    prop="package_name" required>
                    <el-input v-model="form.package_name"></el-input>
                </el-form-item>

                <!-- 归属产品 -->
                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.BELONGINGPRODUCT')"
                    prop="product_id">
                    <el-select v-model="form.product_id">
                        <el-option v-for="(product, index) in productList" :key="index"
                            :label="product.name" :value="product.id"></el-option>
                    </el-select>
                </el-form-item>

                <!-- 升级包模块 -->
                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PACKAGE_MODULE')"
                    prop="package_module">
                    <el-input v-model="form.package_module"></el-input>
                </el-form-item>

                <!-- 升级包版本号 -->
                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PACKAGE_VERSION')"
                    prop="package_version">
                    <el-input v-model="form.package_version"></el-input>
                </el-form-item>

                <!-- 签名方式 -->
                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.SIGNTYPE')" prop="signature_algorithm">
                    <el-select v-model="form.signature_algorithm">
                        <el-option label="MD5" value="MD5"></el-option>
                        <el-option label="SHA256" value="SHA256"></el-option>
                    </el-select>
                </el-form-item>

                <!-- 上传升级包 -->
                <el-form-item label="上传升级包" required prop="package_url">
                    <el-upload
                        class="upload-demo"
                        :action="uploadUrl"
                        :headers="headers"
                        :data="{ type: 'upgradePackage'}"
                        :file-list="fileList"
                        :on-success="onUploadSuccess"
                        >
                        <el-button size="small" type="primary">点击上传</el-button>
                    </el-upload>
                </el-form-item>


                <!-- 描述 -->
                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.DESCRIPTION')"
                    prop="description">
                    <el-input type="textarea" v-model="form.description"></el-input>
                </el-form-item>

                <!-- 其他配置 -->
                <el-form-item :label="'其他配置'">
                    <el-row v-for="(config, index) in form.additional_info" :key="index">
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
                    <el-button type="border" @click="dialogVisible=false">{{$t('COMMON.CANCEL') }}</el-button>
                    <el-button type="primary"  @click="handleSubmit">{{$t('COMMON.CONFIRM') }}</el-button>
                </div>
                
            </el-form>
        </el-dialog>
    </div>
</template>
    
<script>
import moment from "moment";
import i18n from "@/core/plugins/vue-i18n.js";
import ProductAPI from "@/api/product";
import OTAAPI from "@/api/ota";
import JwtService from "@/core/services/jwt.service";
import { message_success } from '../../../../utils/helpers';

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
            product_id: "",
            package_name: "",
            package_version: "",
            package_url: "",
            package_module: "",
            signature_algorithm: "",
            description: "",
            additional_info: [
                {}
            ]
        },
        uploadUrl: OTAAPI.uploadUrl,
        fileList: [],
        headers: { Authorization: "Bearer " + JwtService.getToken() },
        productList: [],
        rules: {
            product_id: [
                { required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER1') }
            ],
            package_name: [
                { required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER2') }
            ],
            package_module: [
                { required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER2') }
            ],
            package_version: [
                { required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER3') }
            ],
            sign: [
                { required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER4') }
            ]
        }
    }),
    mounted() {
        this.getProductList();
    },
    methods: {
        /**
         * @description: 产品下拉列表
         * @return {*}
         */        
        getProductList() {
            const params = { current_page: 1, per_page: 9999 }
            console.log("getProductList", params);

            ProductAPI.page(params)
                .then(({ data: result }) => {
                    if (result.code === 200) {
                        this.productList = result.data?.data || [];
                        console.log("getProductList", this.productList);

                    }
                })
        },
        handleSubmit() {
            console.log("handleSubmit", this.form)
            this.$refs.firmwareCreateForm.validate((valid) => {
                if (valid) {
                    let formData = JSON.parse(JSON.stringify(this.form))
                    formData.created_at = moment().format("YYYY-MM-DD HH:mm:ss")
                    OTAAPI.add(formData)
                        .then(({ data: result }) => {
                            console.log("handleSubmit", result)
                            if (result.code === 200) {
                                this.dialogVisible = false;
                                message_success("添加成功!")
                                this.$emit("submit");

                            }
                        })

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
        },
        onUploadSuccess(response, file, fileList) {
            if (response.code === 200) {
                this.form.package_url = response.data;
                this.form.package_path = response.data;
            }
            console.log("onUploadSuccess", response, file, fileList);
            console.log("onUploadSuccess.form", this.form);
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