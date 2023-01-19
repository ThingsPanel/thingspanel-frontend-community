<template>
  <div>
    <el-dialog class="el-dark-dialog" title="注册插件" :visible.sync="dialogVisible" width="50%"
               :before-close="handleClose" :close-on-click-modal="false">
      <el-form class="el-dark-input" label-position="left" :model="formData" :rules="formRules">

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="名称" prop="name">
              <el-input v-model="formData.name"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="设备类型" prop="device_type">
              <el-select v-model="formData.device_type">
                <el-option value="1" label="设备"></el-option>
                <el-option value="2" label="网关"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="协议类型" prop="protocol_type">
              <el-input v-model="formData.protocol_type"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="接入地址" prop="access_address">
              <el-input v-model="formData.access_address"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="HTTP服务器地址" prop="http_address">
              <el-input v-model="formData.http_address"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="插件订阅主题前缀" prop="sub_topic_prefix">
              <el-input v-model="formData.sub_topic_prefix"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="作者" prop="author">
              <el-input v-model="formData.author"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="描述" prop="description">
              <el-input v-model="formData.description"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            连接参数：
          </el-col>

          <el-col :span="8" :offset="8">
            <el-button type="border" @click="addConnectForm">新增配置项</el-button>
          </el-col>
        </el-row>

        <el-row class="config-line" :gutter="20" v-for="(form, index) in connectForm" :key="index">
          <el-col :span="8">
            <el-input v-model="form.key" placeholder="请输入配置项名称"></el-input>
          </el-col>
          <el-col :span="8">
            <el-input v-model="form.value" placeholder="请输入配置项目值"></el-input>
          </el-col>
          <el-col :span="8">
            <el-button type="danger" @click="delConnectForm(index)">删除</el-button>
          </el-col>
        </el-row>


      </el-form>

      <span slot="footer" class="dialog-footer">
      <el-button type="info" @click="handleClose">{{ $t('COMMON.CANCEL') }}</el-button>
      <el-button :loading="loading" type="primary" @click="handleSubmit">{{ $t('COMMON.CONFIRM') }}</el-button>
    </span>
    </el-dialog>
  </div>
</template>

<script>
import ProtocolPlugin from "@/api/protocolPlugin.js"
import {message_success} from "@/utils/helpers";
const required = true;
export default {
  name: "RegisterPlugin",
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
      dialogVisible: false,
      formData: {
        name: "",
        device_type: "1",
        protocol_type: "",
        access_address: "",
        http_address: "",
        sub_topic_prefix: "",
        author: "",
        description: "",
        additional_info: {}
      },
      formRules: {
        name: [{required, message: "请输入名称"}],
        device_type: [{required, message: "请选择设备类型"}],
        protocol_type: [{required, message: "请输入协议类型"}],
        access_address: [{required, message: "请输入接入地址"}],
        http_address: [{required, message: "请输入名服务地址"}],
        sub_topic_prefix: [{required, message: "请输入协议订阅主题前缀"}]
      },
      loading: false,
      connectForm: []
    }
  },
  watch: {
    visible: {
      handler(newValue) {
        console.log("====visible", newValue)
        if (newValue) {
          // this.formData = JSON.parse(JSON.stringify(this.data));
          // this.formData.device_type = "1";
          this.loading = false;
          this.dialogVisible = newValue;
        }
      }
    }
  },
  methods: {
    handleSubmit() {
      this.loading = true;
      this.formData.additional_info = JSON.stringify(this.connectForm);
      if (this.formData.id) {
        // 编辑
      } else {
        ProtocolPlugin.add(this.formData)
            .then(({ data }) => {
              if (data.code == 200) {
                message_success("注册成功！");
                this.$emit("submit");
                this.handleClose();
              }
            })
            .finally(() => this.loading = false)
      }

    },
    handleClose() {
      this.$emit("update:visible", false)
      this.dialogVisible = false;
    },
    addConnectForm() {
      this.connectForm.push({key: "", value: ""})
    },
    delConnectForm(index) {
      this.connectForm.splice(index, 1);
    }

  }
}
</script>

<style scoped>
.config-line {
  margin-top: 16px;
}
</style>