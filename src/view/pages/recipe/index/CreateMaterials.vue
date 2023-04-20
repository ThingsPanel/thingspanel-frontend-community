<template>
    <div>
      <el-dialog class="el-dark-dialog" :title="$t('POTTYPE.POTTYPE_ADD.CREATEPOT')" :visible.sync="dialogVisible" width="30%"
                 :before-close="handleClose" :close-on-click-modal="false">
        <el-form label-position="top" :model="formData" :rules="formRules" class="el-dark-input">
          <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_MATERIAL.MATERIAL')" prop="name">
            <el-input v-model="formData.Material"></el-input>
          </el-form-item>
          <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_MATERIAL.DOSAGE')" prop="name">
            <el-input v-model="formData.Dosage"></el-input>
          </el-form-item>
          <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_MATERIAL.UNIT')" prop="name">
            <el-input v-model="formData.Unit"></el-input>
          </el-form-item>
        </el-form>
  
        <span slot="footer" class="dialog-footer">
        <el-button type="save" @click="handleSubmit">{{ $t('POTTYPE.POTTYPE_ADD.CONFIRM') }}</el-button>
      </span>
      </el-dialog>
    </div>
  </template>
  
  <script>
  
  const required = true;
  export default {
    name: "CreateMeterials",
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
          name: "",
          serial_number: "",
          protocol_type: "",
          auth_type: "",
          plugin: "",
          describe: ""
        },
        dialogVisible: false
      }
    },
    watch: {
      visible: {
        handler(newValue) {
          if (newValue) {
            this.formData = JSON.parse(JSON.stringify(this.data));
            this.dialogVisible = newValue;
          }
        }
      }
    },
    methods: {
      handleSubmit() {
        
      },
     
      handleClose() {
        this.dialogVisible = false;
        this.$emit("update:visible", false)
      }
    }
  }
  </script>
  
  <style scoped lang="scss">
  
  ::v-deep .el-form--label-left {
    .el-form-item {
      display: inline-flex!important;
    }
  }
  </style>