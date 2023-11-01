<template>
<el-dialog
    :title="current_item.id ? $t('AUTOMATION.ALARM_STRATEGY.EDIT_ALARM_STRATEGY') : $t('AUTOMATION.ALARM_STRATEGY.ADD_ALARM_STRATEGY')"
    class="el-dark-dialog"
    :visible.sync="showDialog"
    width="50%"
    :close-on-click-modal="false"
>
<el-form
    ref="alarmFormRef"
    :model="formData"
    label-position="top"
    hide-required-asterisk>
  <el-row :gutter="20">

    <el-col :span="12">
      <el-form-item :label="$t('AUTOMATION.ALARM_STRATEGY.ALARM_STRATEGY_NAME')" prop="name" :rules="rules.name">
        <el-input v-model="formData.name" :placeholder="$t('AUTOMATION.ALARM_STRATEGY.PLACEHOLDER1')"></el-input>
      </el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item :label="$t('AUTOMATION.ALARM_STRATEGY.ALARM_STRATEGY_DESCRIBE')" prop="describe" :rules="rules.describe">
        <el-input v-model="formData.describe" :placeholder="$t('AUTOMATION.ALARM_STRATEGY.PLACEHOLDER2')"></el-input>
      </el-form-item>
    </el-col>
<!--分组-->
    <el-col :span="12">
      <el-form-item :label="$t('AUTOMATION.GROUP')" prop="sensor" :rules="rules.sensor">
        <DeviceGroupSelector
            :business_id="business_id"
            :asset_id.sync="formData.sensor"
            :clearable="false"
            @change="handleDeviceGroupChange"
        ></DeviceGroupSelector>
      </el-form-item>
    </el-col>

<!--    设备-->
    <el-col :span="12">
      <el-form-item :label="$t('AUTOMATION.DEVICE')" prop="bid" :rules="rules.bid">
        <DeviceSelector
            :asset_id="formData.sensor"
            :device_id.sync="formData.bid"
            :plugin_id.sync="formData.pluginId"
            :clearable="false"
            @change="handleDeviceChange"
        ></DeviceSelector>
      </el-form-item>
    </el-col>

<!-- --------------------------------------------------------------------------------------------------------------- -->
<!--触发条件-->
<!-- --------------------------------------------------------------------------------------------------------------- -->
    <el-col :span="24">
      <el-form-item :label="$t('AUTOMATION.TRIGGERING_CONDITION')">
        <template v-for="(config_item, index) in formData.config">
          <el-row :gutter="20">
            <el-col :span="3" class="py-5" v-if="config_item.operator">
              <el-form-item>
                <el-select :no-data-text="$t('COMMON.SELECT_NO_DATA')" v-model="config_item.operator">
                  <el-option :value="item.value" :label="item.label" v-for="(item, index) in operatorOptions" :key="index"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

<!--          请选择条件-->
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item :prop="'config.'+index+'.field'" :rules="rules['config.field']">
                <el-select :no-data-text="$t('COMMON.SELECT_NO_DATA')" class="w-100" v-model="config_item.field" :placeholder="$t('AUTOMATION.PLACEHOLDER2')">
                  <el-option :value="item.name" :label="item.title" v-for="(item, index) in triggerOptions" :key="index"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
<!--           选择操作符 -->
            <el-col :span="6">
              <el-form-item :prop="'config.'+index+'.condition'" :rules="rules['config.condition']">
                <el-select :no-data-text="$t('COMMON.SELECT_NO_DATA')" class="w-100" v-model="config_item.condition" :placeholder="$t('AUTOMATION.PLACEHOLDER3')">
                  <el-option :value="item.id" :label="item.name" v-for="(item,index) in symbolOptions" :key="index">{{ item.id }}</el-option>
                </el-select>
              </el-form-item>
            </el-col>
<!--            选择值-->
            <el-col :span="6">
              <el-form-item :prop="'config.'+index+'.value'" :rules="rules['config.value']">
                <el-input class="w-100" v-model="config_item.value" :placeholder="$t('AUTOMATION.PLACEHOLDER4')"></el-input>
              </el-form-item>
            </el-col>
<!--            新增一行-->
            <el-col :span="6">
              <el-button type="indigo" size="medium" @click="addLine" v-if="index===0">{{ $t('AUTOMATION.ADD_LINE') }}</el-button>
              <el-popconfirm :confirm-button-text="$t('COMMON.CONFIRM')" :cancel-button-text="$t('COMMON.CANCEL')" :title="$t('AUTOMATION.TITLE4')" @confirm="removeLine(config_item)" v-else>
                <el-button slot="reference" type="danger" size="medium">{{ $t('AUTOMATION.DELETE') }}</el-button>
              </el-popconfirm>
            </el-col>
          </el-row>
        </template>
      </el-form-item>
    </el-col>

    <el-col :span="24">
      <el-form-item :label="$t('AUTOMATION.ALARM_TYPE')">
        <el-checkbox-group v-model="formData.warningChecked" @change="handleAlarmChange" size="small">
          <el-checkbox label="email">{{$t('AUTOMATION.EMAIL')}}</el-checkbox>
          <el-checkbox label="sms" disabled>{{$t('AUTOMATION.SMS')}}</el-checkbox>
          <el-checkbox label="dingtalk" disabled>{{$t('AUTOMATION.DING_TALK')}}</el-checkbox>
          <el-checkbox label="enterpriseWeChat" disabled>{{$t('AUTOMATION.ENTERPRISE_WECHAT')}}</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </el-col>

    <el-col :span="24">
      <el-form-item :label="$t('AUTOMATION.INFORMATION')">
        <el-input v-model="formData.message" type="textarea"></el-input>
      </el-form-item>
    </el-col>

  </el-row>

  <FormAlert :error_message="error_message"></FormAlert>

  <div class="text-right">
    <el-button size="medium" type="cancel" @click="handleCancel()">{{ $t('AUTOMATION.CANCEL') }}</el-button>
    <el-button size="medium" type="save" @click="handleSave()">{{ $t('AUTOMATION.SAVE') }}</el-button>
  </div>
</el-form>
</el-dialog>
</template>

<script>
import {computed, defineComponent, reactive, ref, watch} from "@vue/composition-api";
import DeviceGroupSelector from "@/components/common/DeviceGroupSelector.vue";
import DeviceSelector from "../components/DeviceSelector.vue"
import useAlarmTriggerOptions from "./useAlarmTriggerOptions";
import {warning_add, warning_edit} from "@/api/automation";
import FormAlert from "@/components/common/FormAlert.vue";
import AUTH from "@/core/services/store/auth.module";
import {device_info} from "../../../../api/device";
import i18n from "@/core/plugins/vue-i18n.js"
export default defineComponent({
  name: "AlarmEditForm",
  components: {
    DeviceGroupSelector,
    DeviceSelector,
    FormAlert,
  },
  props: {
    business_id: {
      required: true,
      type: String,
    },
    current_item: {
      required: true,
      type: Object,
    },
    alarmDialogVisible: {
      type: Boolean,
      default: false,
    },
    add_alarm: {
      required: true,
      type: Function,
    },
    update_alarm: {
      required: true,
      type: Function,
    }
  },
  setup(props, context){
    let showDialog = computed({
      get(){
        return !!props.alarmDialogVisible
      },
      set(val){
        context.emit("update:alarmDialogVisible", val)
      }
    })

    let alarmFormRef = ref()

    // 表单
    let formData = reactive({
      id: "",
      wid: props.business_id, //business_id
      name: "",
      describe: "",
      sensor: "", // 设备分组
      bid: "", // 设备id
      pluginId: "", // 插件id
      config: [
        {field: "", condition: "", value: ""},
      ],
      message: "",
      other_message:"",
      warningChecked:[],
    })

    let error_message = ref("")

    function handleAlarmChange(val) {
      formData.other_message = "";
      if(val.indexOf('email') > -1){  
        formData.other_message = AUTH.state.user.email;
      }
    }
    // 重置表单数据
    function resetFormData(){
      let item_attrs = JSON.parse(JSON.stringify(props.current_item))
      for (const key in formData) {
        // 有则逐个赋值
        if(key in item_attrs){
          formData[key] = item_attrs[key]
        }
        if (key == "bid") {
          device_info({ id: item_attrs[key]})
          .then(({data}) => {
            if (data.code == 200) {
              formData.pluginId = data.data.type;
            }
          })
        }
      }
      if(item_attrs.other_message){
       formData.warningChecked = ["email"]
      }
    }

    // 修改时用
    watch(()=>props.current_item, ()=>{
      resetFormData()
    }, {
      immediate: true
    })

    let rules = reactive({
      name:[
        {required: true, message: i18n.t('AUTOMATION.ALARM_STRATEGY.PLACEHOLDER3')}
      ],
      describe: [
        {required: true, message: i18n.t('AUTOMATION.ALARM_STRATEGY.PLACEHOLDER4')}
      ],
      sensor: [
        {required: true, message: i18n.t('AUTOMATION.ALARM_STRATEGY.PLACEHOLDER5')}
      ],
      bid: [
        {required: true, message: i18n.t('AUTOMATION.ALARM_STRATEGY.PLACEHOLDER6')}
      ],
      "config.field": [
        {required: true, message: i18n.t('AUTOMATION.ALARM_STRATEGY.PLACEHOLDER7')}
      ],
      "config.condition": [
        {required: true, message: i18n.t('AUTOMATION.ALARM_STRATEGY.PLACEHOLDER8')}
      ],
      "config.value": [
        {required: true, message: i18n.t('AUTOMATION.ALARM_STRATEGY.PLACEHOLDER9')}
      ],
      
    })

    let loading = ref(false)

    // 保存
    function handleSave(){
      alarmFormRef.value.validate((valid)=>{
        if(!valid) return

        error_message.value = ""

        if(loading.value) return
        loading.value = true

        // 发送请求
        create_or_update(formData).then(({data})=>{
          if(data.code === 200){
            handleCancel()

            if(formData.id){
              // 更新
              props.update_alarm(props.current_item, formData)
            }else{
              // 新增
              props.add_alarm(formData)
            }
          }else{
            error_message.value = data.message
          }
        }).finally(()=>{
          loading.value = false
        })
      })

    }

    // 创建或更新的 api
    function create_or_update(formData){
      // 拷贝
      let copy = JSON.parse(JSON.stringify(formData))
      // 重点 config 要序列化
      copy.config = JSON.stringify(copy.config)
      // 返回接口
      return formData.id ? warning_edit(copy) : warning_add(copy)
    }

    // 关闭弹窗
    function handleCancel(){
      context.emit("update:alarmDialogVisible", false)
    }

    // 触发条件的下拉框选项
    let {
      triggerOptions,
      symbolOptions,
      operatorOptions,
    } = useAlarmTriggerOptions(formData)

    // 设备分组更改时
    function handleDeviceGroupChange(){
      formData.bid = ""; // 设备id 置空
      // 触发条件置空
      formData.config = [
        {field: "", condition: "", value: ""}
      ]
    }

    // 设备更改时
    function handleDeviceChange(deviceId, pluginId){
      formData.pluginId = pluginId;
      // 触发条件置空
      formData.config = [
        {field: "", condition: "", value: ""}
      ]
    }

    // 添加条件
    function addLine(){
      formData.config.push({
        operator:"&&", field:"", condition:"", value:""
      })
    }
    // 移除条件
    function removeLine(item){
      let index = formData.config.indexOf(item)
      formData.config.splice(index, 1)
    }

    return {
      showDialog,
      alarmFormRef,
      formData,
      error_message,
      rules,
      handleSave,
      handleCancel,
      triggerOptions,
      symbolOptions,
      operatorOptions,
      handleAlarmChange,
      addLine,
      removeLine,
      handleDeviceGroupChange,
      handleDeviceChange,
    }
  }
})
</script>

<style scoped>

</style>