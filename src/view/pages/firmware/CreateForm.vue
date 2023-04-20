<template>
<div class="firmware-create">
  <el-form
      ref="firmwareCreateForm"
      :rules="rules"
      label-position="left"
      :model="form"
      :hide-required-asterisk="true"
      label-width="150px">
    <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.BELONGINGPRODUCT')" prop="product">
      <el-select v-model="form.product">
        <el-option label="手推车" value="手推车"></el-option>
        <el-option label="井盖" value="井盖"></el-option>
        <el-option label="行李拖斗" value="行李拖斗"></el-option>
      </el-select>
    </el-form-item>

    <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.FIRMWARENAME')" prop="firmware_name">
      <el-input v-model="form.firmware_name"></el-input>
    </el-form-item>

    <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.VERSION')" prop="firmware_version">
      <el-input v-model="form.firmware_version"></el-input>
    </el-form-item>

    <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.SIGNTYPE')" prop="signature">
      <el-radio v-model="form.signature" label="MD5">MD5</el-radio>
      <el-radio v-model="form.signature" label="SHA256">SHA256</el-radio>
    </el-form-item>

    <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.SIGN')" prop="sign_value">
      <el-input v-model="form.sign_value"></el-input>
    </el-form-item>

    <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.UPLOAD')">
      <el-upload
          class="upload-demo"
          drag
          action="https://jsonplaceholder.typicode.com/posts/"
          multiple>
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">{{ $t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.TIP1') }}<em>{{ $t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.TIP2') }}</em></div>
      </el-upload>
    </el-form-item>

    <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.DESCRIPTION')" prop="description">
      <el-input type="textarea" v-model="form.description"></el-input>
    </el-form-item>

    <el-button type="primary" class="w-100" @click="onSubmit">{{ $t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.SUBMIT') }}</el-button>
  </el-form>
</div>
</template>

<script>
import moment from "moment";
import i18n from "@/core/plugins/vue-i18n.js"
export default {
  name: "CreateForm",
  data: () => ({
    form: {
      product: "",
      firmware_name: "",
      firmware_version: "",
      signature: "",
      sign_value: "",
      description: "",
    },
    rules: {
      product:[
        {required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER1')}
      ],
      firmware_name:[
        {required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER2')}
      ],
      firmware_version:[
        {required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER3')}
      ],
      signature: [
        {required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER4')}
      ],
      sign_value: [
        {required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER5')}
      ],
      description: [
        {required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER6')}
      ]
    }
  }),
  methods:{
    onSubmit(){
      this.$refs.firmwareCreateForm.validate((valid)=>{
        if(valid) {
          let formData = JSON.parse(JSON.stringify(this.form))
          formData.created_at = moment().format("YYYY-MM-DD HH:mm:ss")
          this.$emit("submit", formData)

          setTimeout(()=>{
            this.$refs.firmwareCreateForm.resetFields()
          }, 500)
        }
      })
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