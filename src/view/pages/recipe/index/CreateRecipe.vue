<template>
    <div>
      <el-dialog class="el-dark-dialog" :title="$t('POTTYPE.POTTYPE_ADD.CREATEPOT')" :visible.sync="dialogVisible" width="30%"
                 :before-close="handleClose" :close-on-click-modal="false">
        <el-form label-position="top" :model="formData" :rules="formRules" class="el-dark-input">
          <el-form-item :label="$t('POTTYPE.POTTYPE_ADD.POTNAME')" prop="name">
            <el-input v-model="formData.name"></el-input>
          </el-form-item>

          <el-form-item :label="$t('POTTYPE.POTTYPE_ADD.POTNAME')" prop="name">
            <el-input v-model="formData.name"></el-input>
          </el-form-item>

          <el-form-item :label="$t('POTTYPE.POTTYPE_ADD.POTNAME')" prop="name">
            <el-input v-model="formData.name"></el-input>
          </el-form-item>

          <el-form-item :label="$t('POTTYPE.POTTYPE_ADD.POTNAME')" prop="name">
            <el-input v-model="formData.name"></el-input>
          </el-form-item>

          <el-form-item :label="$t('POTTYPE.POTTYPE_ADD.POTNAME')" prop="name">
            <el-input v-model="formData.name"></el-input>
          </el-form-item>
          
  
        </el-form>
  
        <span slot="footer" class="dialog-footer">
        <el-button type="save" @click="handleSubmit">{{ $t('POTTYPE.POTTYPE_ADD.CONFIRM') }}</el-button>
      </span>
      </el-dialog>
      <plugin-binding-form :dialog-visible.sync="pluginDialogVisible" @submit="handleBindPluginSubmit"></plugin-binding-form>

    </div>
    
  </template>
  
  <script>
  
  import PotAPI from "@/api/pot.js"
  import {message_success} from "@/utils/helpers";
  import PluginBindingForm from "./PluginBindingForm";
  import i18n from "@/core/plugins/vue-i18n.js"
  import CreateMaterials from './CreateMaterials';
  import CreateTaste from './CreateTaste';
  
  const required = true;
  export default {
    name: "CreatePotType",
    components: { PluginBindingForm, CreateMaterials,CreateTaste },
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
        createMaterialsDialogVisible: false,
        createTasteDialogVisible: false,
        formData: {
          name: "",
          serial_number: "",
          protocol_type: "",
          auth_type: "",
          plugin: "",
          describe: ""
        },
        formRules: {
          name: [{required, message: i18n.t('POTTYPE.POTTYPE_ADD.PLACEHOLDER1')}],
          auth_type: [{required, message: i18n.t('POTTYPEID.POTTYPE_ADD.PLACEHOLDER4')}],
        },
        dialogVisible: false,
        protocolOptions: [
          { value: "mqtt", label: "mqtt" },
          { value: "MQTT", label: i18n.t("POTTYPE.PRODUCT_LIST.MQTTPROTOCOL") },
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
      /**
       * 打开创建物料对话框
       */
       handleMaterialsCreate() {
        this.createMaterialsDialogVisible = true;
      },
      /**
       * 打开创建口味对话框
       */
       handleTasteCreate() {
        this.createTasteDialogVisible = true;
      },
      handleSubmit() {
        if (!this.formData.id) {
          // add
          this.formData.plugin = "{}"
          PotAPI.add(this.formData)
            .then(({ data }) => {
              if (data.code ==200) {
                this.$emit("submit")
                message_success("锅型添加成功！")
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