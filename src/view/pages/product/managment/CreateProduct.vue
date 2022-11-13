<template>
  <div>
    <el-dialog class="el-dark-dialog" title="创建产品" :visible.sync="dialogVisible" width="30%"
               :before-close="handleClose" :close-on-click-modal="false">
      <el-form label-position="top" :model="formData" :rules="formRules">
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="formData.name"></el-input>
        </el-form-item>

        <el-form-item label="产品编号" prop="serial_number">
          <el-input v-model="formData.serial_number"></el-input>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="协议类型" prop="protocol_type">
              <el-select style="width: 100%" v-model="formData.protocol_type">
                <el-option v-for="item in protocolOptions" :key="item.value" :label="item.label"
                           :value="item.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="认证方式" prop="auth_type">
              <el-select style="width: 100%" v-model="formData.auth_type">
                <el-option v-for="item in authOptions" :key="item.value" :label="item.label"
                           :value="item.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="设备插件">
          <el-input v-model="formData.plugin" @click.native="handleBindPlugin">

          </el-input>
        </el-form-item>

        <el-form-item label="产品描述">
          <el-input v-model="formData.describe"></el-input>
        </el-form-item>

      </el-form>

      <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取 消</el-button>
      <el-button type="primary" @click="handleSubmit">确 定</el-button>
    </span>
    </el-dialog>
    <plugin-binding-form :dialog-visible.sync="pluginDialogVisible" @submit="handleBindPluginSubmit"></plugin-binding-form>
  </div>
</template>

<script>
  /*
    *产品名称
    *产品编号
    *协议类型（mqtt-MQTT协议）
    *认证方式 1-AccessToken 2-MQTTBasic
    *设备插件（用户选择，保存插件的json备份）
    产品描述
    * {
	"name": "tp-温湿度",
	"serial_number": "TP-WSD-002",
	"protocol_type": "mqtt",
	"auth_type": "1",
	"plugin": "{}",
	"describe": "产品测试"
}
   */
import ProductAPI from "@/api/product.js"
import {message_success} from "@/utils/helpers";
import PluginBindingForm from "./PluginBindingForm";
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
        name: [{required, message: '请输入名称'}],
        serial_number: [{required, message: '请输入产品编号'}],
        protocol_type: [{required, message: '请选择协议类型'}],
        auth_type: [{required, message: '请选择协议类型'}],
      },
      dialogVisible: false,
      protocolOptions: [
        { value: "mqtt", label: "mqtt" },
        { value: "MQTT", label: "MQTT协议" },
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