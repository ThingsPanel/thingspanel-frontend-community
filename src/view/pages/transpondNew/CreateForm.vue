<template>
  <el-dialog
    :title="id ? $t('RULE_ENGINE.DATA_FORWARDINGNEW.EDIT_TITLE') : $t('RULE_ENGINE.DATA_FORWARDINGNEW.ADD_TITLE')"
    class="el-dark-dialog" :close-on-click-modal="false" :before-close="handleClose" :visible.sync="dialogVisible"
    width="60%" height="60%" top="10vh">
    <el-form ref="CreateForm" label-position="left" label-width="120px" :model="form">
      <el-form-item :label="$t('RULE_ENGINE.ACCESS_ENGINE.RULE_NAME_NEW')" required>
        <el-input ref="nameRef" v-model="form.name"></el-input>
      </el-form-item>

      <el-form-item :label="$t('RULE_ENGINE.ACCESS_ENGINE.RULE_DESCRIBE')" required>
        <el-input class="el-dark-input" ref="descRef" type="textarea" v-model="form.desc"></el-input>
      </el-form-item>


      <el-form-item :label="$t('RULE_ENGINE.ACCESS_ENGINE.DATA')" required>
        <div style="display:flex;margin-bottom: 10px;" v-for="(command, index) in form.commands" :key="index">
          <DeviceTypeSelector ref="deviceTypeRef" style="" :data="command.data"
            @change="v => handleCommandChange(command, v)" />
          <!-- 新增一行 -->
          <el-button type="indigo" size="small" style="margin-left: auto" v-if="index == 0"
            @click="handleAddCommand(command)">{{ $t('RULE_ENGINE.ACCESS_ENGINE.ADD') }}</el-button>

          <el-button type="danger" size="small" style="margin-left: auto" v-if="index > 0"
            @click="handleDeleteCommand(command)">{{ $t('RULE_ENGINE.ACCESS_ENGINE.DELETE') }}</el-button>
        </div>
      </el-form-item>

      <p class="code-editor-label"><span style="color: red">* </span>{{ $t('RULE_ENGINE.ACCESS_ENGINE.PARSING_SCRIPTS') }}
      </p>
      <CodeEditor class="dark-code-editor" key="upside" style="width: 100%;height: 260px;overflow-y: auto"
        min_height="260px" :copy_code="true" :hide_header="false" theme="dark" :wrap_code="true" v-model="form.script">
      </CodeEditor>

      <el-form-item :label="$t('RULE_ENGINE.ACCESS_ENGINE.DATAPURPOSE')">
        <el-button type="indigo" size="small" style="margin-left: auto" @click="handleAdd()">{{
          $t('RULE_ENGINE.ACCESS_ENGINE.ADDACTION') }}</el-button>

        <!-- 列表 -->
        <div class="list_box" v-if="listData.length > 0">
          <div class="item" v-for="(item, index) in listData" :key="index">
            <span>{{ item.title }}</span>
            <div class="flex_full"></div>
            <el-button @click="editBtn(item, index)" type="primary" icon="el-icon-edit" circle></el-button>
            <el-button @click="deleteBtn(index)" type="danger" icon="el-icon-delete" circle></el-button>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="转发失败告警">
        <el-switch v-model="form.warning_switch" active-color="#13ce66" :active-value="1" :inactive-value="0"/>
        <AlarmNotification ref="alarmRef" v-if="form.warning_switch===1" :data="form.alarm" @change="handleAlarmChange"/>
      </el-form-item>

      <div style="display: flex;justify-content: center">
        <el-button class="cancel-button" type="cancel" size="medium" plain @click="cancelDialog">{{ $t('COMMON.CANCEL')
        }}</el-button>
        <el-button class="medium" type="save" size="medium" @click="onSubmit">{{ $t('COMMON.SUBMIT') }}</el-button>
      </div>


      <el-dialog class="el-dark-dialog el-dark-input" :title="$t('RULE_ENGINE.ACCESS_ENGINE.ADDACTION')"
        :visible.sync="dialogChooseVisible" :close-on-click-modal="false" :close-on-press-escape="false"
        :show-close="false" :append-to-body="true" width="400px">
        <div class="dialog-body">
          <div :class="isChoose === 0 ? 'dialog-border' : 'dialog-box'" @click="choose(0)">
            <p>{{ $t('RULE_ENGINE.ACCESS_ENGINE.PUSH_OUTSIDE_MQTT') }}</p>
            <p>{{ $t('RULE_ENGINE.ACCESS_ENGINE.PUSH_OUTSIDE_MQTT_DES') }}</p>
          </div>

          <div :class="isChoose === 1 ? 'dialog-border' : 'dialog-box'" @click="choose(1)">
            <p>{{ $t('RULE_ENGINE.ACCESS_ENGINE.PUSH_OUTSIDE_URL') }}</p>
            <p>{{ $t('RULE_ENGINE.ACCESS_ENGINE.PUSH_OUTSIDE_URL_DES') }}</p>
          </div>
        </div>
      </el-dialog>

      <el-dialog class="el-dark-dialog el-dark-input" :title="$t('RULE_ENGINE.ACCESS_ENGINE.ADDACTION')"
        :visible.sync="dialogMQTTVisible" :destroy-on-close="true" :close-on-click-modal="false" :append-to-body="true"
        width="830px">
        <MqttContent ref="realForm" @cancel="dialogMQTTVisible = false" :type="type" :fromData="editData" @save="create">
        </MqttContent>
      </el-dialog>

      <el-dialog class="el-dark-dialog el-dark-input" :title="$t('RULE_ENGINE.ACCESS_ENGINE.ADDACTION')"
        :visible.sync="dialogUrlVisible" :destroy-on-close="true" :close-on-click-modal="false" :append-to-body="true"
        width="830px">
        <UrlContent ref="realForms" @cancel="dialogUrlVisible = false" :type="type" :fromData="editData" @save="create2">
        </UrlContent>
      </el-dialog>
    </el-form>
  </el-dialog>
</template>

<script>
// import options from './cascader_options'
import MqttContent from "@/view/pages/transpondNew/MqttContent.vue";
import UrlContent from "@/view/pages/transpondNew/UrlContent.vue";
import CodeEditor from 'simple-code-editor';
import DeviceTypeSelector from "./components/device/DeviceTypeSelector.vue";
import AlarmNotification from "./AlarmNotification.vue";
import { message_error } from '@/utils/helpers';
import { getTranspondNewAdd, getTranspondNewEdit, getTranspondNewDetail } from "@/api/transpondNew";
import i18n from "@/core/plugins/vue-i18n";

const upCodeTemp = i18n.t('RULE_ENGINE.ACCESS_ENGINE.CODE_TEMP')
export default {
  name: "CreateForm",
  components: { DeviceTypeSelector, AlarmNotification, CodeEditor, MqttContent, UrlContent },
  props: {
    // handle_create:{
    //   request: true,
    //   type: Function,
    // },
    // init_data: {
    //   default: null
    // },
    id: {
      default: null
    },
    visible: {
      type: [Boolean],
      default: false
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
  watch: {
    visible: {
      handler(newValue) {
        if (newValue) {
          if (this.id) {
            // 编辑
            this.getDetail(this.id);
            // this.form = JSON.parse(JSON.stringify(data.find(item => item.id = this.id)));
          } else {
            // 新增
            this.form = {
              name: '',
              desc: '',
              script: upCodeTemp,
              script_type: "javascript",
              commands: [
                {
                  data: {}
                }
              ],
              target_info: {

              },
              objData: {}
            };
          }
        } else {
          this.form = {};
        }
      }
    },
    dialogMQTTVisible: {
      handler(val) {
        if (!val) {
          this.editData = ""
        }
      },
      deep: true,
      immediate: true
    },
    dialogUrlVisible: {
      handler(val) {
        if (!val) {
          this.editData = ""
        }
      },
      deep: true,
      immediate: true
    },
  },
  data: () => ({
    dialogChooseVisible: false,// 二选一弹框
    dialogMQTTVisible: false,
    dialogUrlVisible: false,
    // 列表数据
    listData: [],
    isShow: false,
    // 选中编辑数据
    editData: "",
    // 数据类型
    type: '',
    isChoose: null,
    form: {
      name: '',
      desc: '',
      script: upCodeTemp,
      script_type: "javascript",
      commands: [
        {
          data: {}
        }
      ],
      target_info: {

      },
      objData: {},
      warning_switch: 0,
      alarm: {}
    },
    // rules: {
    //   name: [
    //     {required, message: i18n.t('RULE_ENGINE.DATA_FORWARDINGNEW.PLACEHOLDER')}
    //   ],
    //   desc: [
    //     {required, message: i18n.t('RULE_ENGINE.DATA_FORWARDINGNEW.PLACEHOLDER1')}
    //   ]
    // },

  }),
  created() {
    // if(this.init_data){
    //   this.form.name = this.init_data.name
    // }
  },
  methods: {
    // mq表提交
    create(data) {
      if (this.type == 'add') {
        data.title = i18n.t('RULE_ENGINE.ACCESS_ENGINE.PUSH_OUTSIDE_MQTT')
        this.listData.push(data)
        this.form.target_info.mqtt = data
        this.dialogMQTTVisible = false
      } else {
        data.title = i18n.t('RULE_ENGINE.ACCESS_ENGINE.PUSH_OUTSIDE_MQTT')
        this.listData[this.editIndex] = data
        this.form.target_info.mqtt = data
        this.dialogMQTTVisible = false
      }
    },
    // url表提交
    create2(item) {
      if (this.type == 'add') {
        item.title = i18n.t('RULE_ENGINE.ACCESS_ENGINE.PUSH_OUTSIDE_URL')
        this.listData.push(item)
        this.form.target_info.url = item.url
        this.dialogUrlVisible = false
      } else {
        item.title = i18n.t('RULE_ENGINE.ACCESS_ENGINE.PUSH_OUTSIDE_URL')
        this.listData[this.editIndex] = item
        this.form.target_info.url = item.url
        this.dialogUrlVisible = false
      }
    },
    // 逻辑删除
    deleteBtn(index) {
      this.listData.splice(index, 1)
    },
    // 编辑
    editBtn(e, index) {
      this.editData = e
      this.editIndex = index
      this.type = 'edit'
      switch (e.title) {
        case i18n.t('RULE_ENGINE.ACCESS_ENGINE.PUSH_OUTSIDE_MQTT'):
          this.dialogMQTTVisible = true
          this.$nextTick(() => {
            this.$refs.realForm.edit(e)
          })
          break;
        case i18n.t('RULE_ENGINE.ACCESS_ENGINE.PUSH_OUTSIDE_URL'):
          this.dialogUrlVisible = true
          this.$nextTick(() => {
            this.$refs.realForms.edit(e)
          })
          break;
      }
    },
    /**
   * @description: 新增一行命令
   * @return {*}
   */
    handleAddCommand() {
      this.form.commands.push({ data: {} });
    },
    /**
     * @description: 指定行被改变
     * @param {*} command  改变前的值
     * @param {*} v  改变后的值
     * @return {*}
     */
    handleCommandChange(command, v) {
      command.data = v;
    },
    /**
     * @description: 删除指定行
     * @param {*} command
     * @param {*} v
     * @return {*}
     */
    handleDeleteCommand(command) {
      let index = this.form.commands.findIndex(item => item == command);
      this.form.commands.splice(index, 1);
    },

    handleAdd() {
      console.log(this.listData, 'this')
      if (this.listData.length > 0) {
        this.$message({ message: i18n.t('RULE_ENGINE.DATA_FORWARDINGNEW.PLACEHOLDER9'), center: true, type: "waring" })
        this.dialogChooseVisible = false
        return
      } else {

        this.dialogChooseVisible = true
      }

    },

    //二选一弹框
    choose(type) {
      this.editIndex = ''
      if (type == 0) {
        this.type = 'add'
        this.isChoose = 0
        this.dialogChooseVisible = false
        this.dialogMQTTVisible = true
      } else {
        this.type = 'add'
        this.isChoose = 1
        this.dialogChooseVisible = false
        this.dialogUrlVisible = true
      }
    },

    //详情
    getDetail(id) {
      this.listData = []
      getTranspondNewDetail({ data_transpond_id: id }).then(res => {
        if (res.data.code === 200) {
          let data = res.data.data
          if (data !== "{}") {
            let commands = this.getCommands(JSON.parse(JSON.stringify(data)))
            let tmp = JSON.parse(JSON.stringify(data));
            tmp.commands = commands;
            
            data.warning_switch && (tmp.alarm = {
              warningLevel: data.warning_strategy.warning_level,
              repeatTimes: data.warning_strategy.repeat_count,
              notification: data.warning_strategy.inform_way,
              warning_description: data.warning_strategy.warning_description
            });
            this.form = tmp;
            if (data.target_info.url !== '') {
              data.title = i18n.t('RULE_ENGINE.ACCESS_ENGINE.PUSH_OUTSIDE_URL')
              this.listData.push(data)
            } else {
              data.title = i18n.t('RULE_ENGINE.ACCESS_ENGINE.PUSH_OUTSIDE_MQTT')
              this.listData.push(data)
            }
          }
        }
      })
    },

    getCommands(v) {
      let cmds = v?.device_info || [];
      let commands = cmds.map(cmd => {
        return {
          data: {
            projectId: cmd.business_id,
            groupId: cmd.asset_group_id,
            // deviceId: cmd.device_id,
            device: cmd.device_id,
            messageType: cmd.message_type,
          }
        }
      })
      return commands;
    },

    //提交
    onSubmit() {
      if (!this.validate()) {
        return;
      }

      let params = JSON.parse(JSON.stringify(this.form));

      console.log("onSubmit", this.form)
      // return
      params.device_info = this.form.commands.map(cmd => {
        return {
          business_id: cmd.data.projectId,
          asset_group_id: cmd.data.groupId,
          device_id: cmd.data.device,
          message_type: cmd.data.messageType,
        }
      })

      if (!this.id) {
        if (this.form.target_info.url) {
          params.target_info = {
            mqtt: {
              "host": '',
              "topic": '',
              "password": '',
              "username": '',
              "client_id": '',
              "port": null
            },
            url: this.form.target_info.url
          }
        } else {
          params.target_info = {
            mqtt: {
              "host": this.form.target_info.mqtt.host,
              "topic": this.form.target_info.mqtt.topic,
              "password": this.form.target_info.mqtt.password,
              "username": this.form.target_info.mqtt.username,
              "client_id": this.form.target_info.mqtt.client_id,
              "port": Number(this.form.target_info.mqtt.port)
            },
            url: ''
          }
        }
      } else {
        if (params.target_info.url) {
          params.target_info = {
            mqtt: {
              "host": '',
              "topic": '',
              "password": '',
              "username": '',
              "client_id": '',
              "port": null
            },
            url: params.target_info.url
          }
        } else {
          params.target_info = {
            mqtt: {
              "host": this.form.target_info.mqtt.host,
              "topic": this.form.target_info.mqtt.topic,
              "password": this.form.target_info.mqtt.password,
              "username": this.form.target_info.mqtt.username,
              "client_id": this.form.target_info.mqtt.client_id,
              "port": Number(this.form.target_info.mqtt.port)
            },
            url: ""
          }
        }
      }

      if (!this.id) {
        getTranspondNewAdd(params).then(res => {
          if (res.data.code === 200) {
            this.$emit("submit");
            this.listData = [];
            this.dialogVisible = false;
            this.$message({ message: "新建成功", center: true, type: "success" })
          }
        })
      } else {
        getTranspondNewEdit(params).then(res => {
          if (res.data.code === 200) {
            this.$emit("submit");
            this.listData = [];
            this.dialogVisible = false;
            this.$message({ message: "编辑成功", center: true, type: "success" })
          }
        })
      }
    },
    /**
     * @description: 告警表单改变时的回调
     * @param {*} v
     * @return {*}
     */    
    handleAlarmChange(v) {
      let warning_strategy = {
        warning_strategy_name: "",
        warning_level: v.warningLevel,
        repeat_count: v.repeatTimes,
        warning_description: v.warning_description || "",
        inform_way: v.notification
      }
      this.form.warning_strategy = warning_strategy;
    },
    handleClose() {
      this.form = {}
      this.listData = []
      this.dialogVisible = false;
    },
    cancelDialog() {
      this.form = {}
      this.listData = []
      this.dialogVisible = false;
    },
    validate() {
      console.log("this.form.target_info", this.form.target_info)
      if (!this.form.name || this.form.name === "") {
        this.$refs.nameRef.focus();
        message_error(this.$t('RULE_ENGINE.DATA_FORWARDINGNEW.PLACEHOLDER'));
        return false;
      }
      if (!this.form.desc || this.form.desc === "") {
        this.$refs.descRef.focus();
        message_error(this.$t('RULE_ENGINE.DATA_FORWARDINGNEW.PLACEHOLDER1'));
        return false;
      }
      if (!this.form.script) {
        message_error("解析脚本不能为空")
        return false;
      }
      if (JSON.stringify(this.form.target_info) === "{}") {
        message_error("数据目的不能为空")
        return false;
      }
      if (this.form.warning_switch && !this.$refs.alarmRef.validate()) {
        return false;
      }
      for (let i = 0; i < this.$refs.deviceTypeRef.length; i++) {
        const ref = this.$refs.deviceTypeRef[i];
        if (!ref.validate()) return false;
      }
      return true;
    }
  }
}
</script>

<style scoped lang="scss">
.code-editor-label {
  color: #fff;
  margin-top: 10px;

}

::v-deep .code_editor .code_area textarea {
  overflow-y: auto;
}

.dialog-box {
  border: 1px solid #e9e9eb;
  padding: 10px;
  cursor: pointer;

  p {
    margin-bottom: 0;
  }
}

.dialog-box:last-child {
  margin-top: 20px;
}

.dialog-border {
  border: 1px solid #5867dd;
  padding: 10px;
  cursor: pointer;

  p {
    margin-bottom: 0;
  }
}

.dialog-border:last-child {
  margin-top: 20px;
}

.list_box {
  margin-top: 20px;

  .item {
    display: flex;
    align-items: center;
    height: 60px;
    justify-content: space-between;
    border-bottom: 1px solid #ccc;

    .flex_full {
      flex: 1;
    }

    &:first-child {
      border-top: 1px solid #ccc;
    }
  }

}
</style>