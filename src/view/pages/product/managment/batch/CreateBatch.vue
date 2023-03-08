<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-01-31 16:45:45
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-08 15:18:52
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\product\managment\batch\CreateBatch.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <el-dialog class="el-dark-dialog" title="创建批次" :visible.sync="dialogVisible" width="400px"
             :before-close="handleClose" :close-on-click-modal="false">
    <el-form :inline="false" label-position="left" label-width="80px" :model="formData" :rules="formRules">

      <el-row>
        <el-form-item label="批次号" prop="batch_number">
          <el-input v-model="formData.batch_number"></el-input>
        </el-form-item>
      </el-row>
      

      <el-row>
        <el-form-item label="数量" prop="number">
          <el-input-number v-model="formData.number"></el-input-number>
        </el-form-item>
      </el-row>
      
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button type="save" @click="handleSubmit">创建批次</el-button>
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
        number: 0,
      },
      formRules: {
        batch_number: [{required, message:  i18n.t('PRODUCT_MANAGEMENT.BATCH_LIST.PLACEHOLDER1')}],
        number: [{required, message:  i18n.t('PRODUCT_MANAGEMENT.BATCH_LIST.PLACEHOLDER4'), type: 'number'}]
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
          this.dialogVisible = newValue;
        }
      }
    }
  },
  methods: {
    handleSubmit() {
      if (!this.formData.id) {
        // add
        
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