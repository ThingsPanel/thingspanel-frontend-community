<template>
  <div>
    <el-dialog class="el-dark-dialog" :title="$t('COMMON.CREATEPRODUCT')" :visible.sync="dialogVisible" width="30%"
               :before-close="handleClose" :close-on-click-modal="false">
      <el-form label-position="top" :model="formData" :rules="formRules">
        <el-form-item :label="$t('COMMON.PRODUCTNAME')" prop="name">
          <el-input v-model="formData.name"></el-input>
        </el-form-item>

        <el-form-item :label="$t('COMMON.PRODUCTNUMBER')" prop="serial_number">
          <el-input v-model="formData.serial_number"></el-input>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('COMMON.PROTOCOLTYPE1')" prop="protocol_type">
              <el-select style="width: 100%" v-model="formData.protocol_type" :placeholder="$t('COMMON.PLACEHOLDER42')">
                <el-option v-for="item in protocolOptions" :key="item.value" :label="item.label"
                           :value="item.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item :label="$t('COMMON.AUTHENTICATION')" prop="auth_type">
              <el-select style="width: 100%" v-model="formData.auth_type" :placeholder="$t('COMMON.PLACEHOLDER43')">
                <el-option v-for="item in authOptions" :key="item.value" :label="item.label"
                           :value="item.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="$t('COMMON.TITLE32')">
          <el-input v-model="formData.plugin" @click.native="handleBindPlugin">

          </el-input>
        </el-form-item>

        <el-form-item :label="$t('COMMON.PRODUCTDESCRIPTION')">
          <el-input v-model="formData.describe"></el-input>
        </el-form-item>

      </el-form>

      <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose">{{ $t('COMMON.CANCEL') }}</el-button>
      <el-button type="primary" @click="handleSubmit">{{ $t('COMMON.CONFIRM') }}</el-button>
    </span>
    </el-dialog>
    <plugin-binding-form :dialog-visible.sync="pluginDialogVisible" @submit="handleBindPluginSubmit"></plugin-binding-form>
  </div>
</template>

<script>

import ProductAPI from "@/api/product.js"
import {message_success} from "@/utils/helpers";
import PluginBindingForm from "./PluginBindingForm";
import i18n from "@/core/plugins/vue-i18n.js"

  const required = true;
export default {
  name: "CreateProduct",
  components: { PluginBindingForm },
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
      formRules: {
        name: [{required, message: i18n.t('COMMON.PLACEHOLDER6')}],
        serial_number: [{required, message: i18n.t('COMMON.PLACEHOLDER41')}],
        protocol_type: [{required, message: i18n.t('COMMON.PLACEHOLDER42')}],
        auth_type: [{required, message: i18n.t('COMMON.PLACEHOLDER42')}],
      },
      dialogVisible: false,
      protocolOptions: [
        { value: "mqtt", label: "mqtt" },
        { value: "MQTT", label: i18n.t("COMMON.MQTTPROTOCOL") },
      ],
      authOptions: [
        { value: "1", label: "AccessToken " },
        { value: "2", label: "MQTTBasic" },
      ],
      pluginList: [],
      pluginDialogVisible: false
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
        this.formData.plugin = "{}"
        ProductAPI.add(this.formData)
          .then(({ data }) => {
            if (data.code ==200) {
              this.$emit("submit")
              message_success("产品添加成功！")
              this.handleClose();
            }
          })
      } else {
        // edit
        console.log("edit")
      }
    },
    handleBindPlugin(item) {
      this.pluginDialogVisible = true;
    },
    handleBindPluginSubmit(pluginId) {
      console.log("handleBindPluginSubmit", pluginId)
      this.formData.plugin = pluginId;
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