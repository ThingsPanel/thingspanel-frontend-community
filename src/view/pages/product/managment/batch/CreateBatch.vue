<template>
  <el-dialog class="el-dark-dialog" :title="$t('COMMON.CREATEPRODUCT')" :visible.sync="dialogVisible" width="30%"
             :before-close="handleClose" :close-on-click-modal="false">
    <el-form label-position="top" :model="formData" :rules="formRules">

      <el-form-item :label="$t('COMMON.PRODUCT')"  prop="product_id">
        <el-select style="width: 100%" v-model="formData.product_name" disabled >
          <el-option v-for="item in productOptions" :key="item.value" :label="item.label"
                     :value="item.value"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item :label="$t('COMMON.BATCHNUMBER')" prop="batch_number">
        <el-input v-model="formData.batch_number"></el-input>
      </el-form-item>

      <el-form-item :label="$t('COMMON.ACCESSADDRESS')" prop="access_address">
        <el-input v-model="formData.access_address"></el-input>
      </el-form-item>

      <el-form-item :label="$t('COMMON.NUMBEREQIPMENT')" prop="device_number">
        <el-input-number v-model="formData.device_number"></el-input-number>
      </el-form-item>

      <el-form-item :label="$t('COMMON.BATCHDESCRIPTION')">
        <el-input v-model="formData.describe"></el-input>
      </el-form-item>

    </el-form>

    <span slot="footer" class="dialog-footer">
    <el-button type="cancel" @click="handleClose">{{ $t('COMMON.CANCEL') }}</el-button>
    <el-button type="save" @click="handleSubmit">{{ $t('COMMON.CONFIRM') }}</el-button>
  </span>
  </el-dialog>
</template>

<script>
/*
-ID
*批号  "batch_number": "BATCH002",
*产品ID（用户在产品下啦列表中选择）   "product_id": "bed165d9-8e68-d3f3-63a6-3005da6c5595",
*设备数量  "device_number": 10,
-生成标志（0-未生成，1-已生成）  "generate_flag": "",
批次描述   "describle": ""
-创建日期
 */
import ProductAPI from "@/api/product.js"
import {message_success} from "@/utils/helpers";
import i18n from "@/core/plugins/vue-i18n.js"

const required = true;
export default {
  name: "CreateBatch",
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
        batch_number: "",
        product_id: "",
        access_address: "",
        device_number: 0,
        generate_flag: "",
        describle: ""
      },
      formRules: {
        batch_number: [{required, message:  i18n.t('COMMON.PLACEHOLDER45')}],
        product_id: [{required, message: i18n.t('COMMON.PLACEHOLDER46')}],
        access_address: [{required, message: i18n.t('COMMON.PLACEHOLDER47')}],
        device_number: [{required, message:  i18n.t('COMMON.PLACEHOLDER48'), type: 'number'}]
      },
      dialogVisible: false,
      productOptions: [

      ],
    }
  },
  watch: {
    visible: {
      handler(newValue) {
        if (newValue) {
          this.formData = JSON.parse(JSON.stringify(this.data));
          if (!this.formData.device_number)  this.formData.device_number = 0;
          this.dialogVisible = newValue;
        }
      }
    }
  },
  methods: {
    handleSubmit() {
      if (!this.formData.id) {
        // add
        this.formData.plugin = "{}"
        ProductAPI.batchAdd(this.formData)
            .then(({ data }) => {
              if (data.code ==200) {
                this.$emit("submit")
                message_success("批次添加成功！")
                this.handleClose();
              }
            })
      } else {
        // edit
      }
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