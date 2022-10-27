<template>
<el-dialog
    :title="current_item.id ? $t('AUTOMATION.CONTROL_STRATEGY.EDIT_CONTROL_STRATEGY') : $t('AUTOMATION.CONTROL_STRATEGY.ADD_CONTROL_STRATEGY')"
    class="el-dark-dialog"
    :visible.sync="showDialog"
    width="60%"
    height="60%"
    top="10vh"
>
<el-form
    ref="controlFormRef"
    :model="formData"
    label-position="top"
    hide-required-asterisk>
  <el-row :gutter="20">

<!--    策略名称-->
    <el-col :span="8">
      <el-form-item :label="$t('COMMON.STRATRGYLISTNAME')" prop="name" :rules="rules.name">
        <el-input v-model="formData.name" :placeholder="$t('COMMON.PLACEHOLDER5')"></el-input>
      </el-form-item>
    </el-col>
    <!--策略描述-->
    <el-col :span="8">
      <el-form-item :label="$t('COMMON.STRATRGYLISTDES')" prop="describe" :rules="rules.describe">
        <el-input v-model="formData.describe" :placeholder="$t('COMMON.PLACEHOLDER6')"></el-input>
      </el-form-item>
    </el-col>
<!--    策略优先级 -->
    <el-col :span="8">
      <el-form-item :label="$t('COMMON.POLICYPRIORITY')" prop="sort">
        <template slot="label">
          {{ $t('COMMON.POLICYPRIORITY') }}
          <el-tooltip placement="top">
            <div slot="content">{{ $t('COMMON.POLICYPRIORITY_TOOLTIP') }}</div>
            <small class="help">?</small>
          </el-tooltip>
        </template>
        <el-input-number class="w-100" v-model="formData.sort"></el-input-number>
      </el-form-item>
    </el-col>


    <!----------------------------------------------------------------------------------------------------------------->
    <!--  触发条件 start  -->
    <!----------------------------------------------------------------------------------------------------------------->
    <el-col :span="24">
      <el-form-item :label="$t('AUTOMATION.TRIGGERING_CONDITION')">
        <template v-if="formData.type == 1" v-for="(rules_item, index) in formData.config.rules">
          <el-row :gutter="20" :class="index > 0 ? 'pt-5' : ''">
            <el-col :span="4">
              <el-form-item>
                <!-- 条件类型 或者 逻辑且于判断 -->
                <ControlTypeSelector :type.sync="formData.type" @change="handleTypeChange" v-if="index === 0"></ControlTypeSelector>
                <LogicalSelector :operator="rules_item.operator" v-else></LogicalSelector>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item :prop="`config.rules.${index}.asset_id`" :rules="rules['config.rules.asset_id']">
                <!-- 设备组 -->
                <DeviceGroupSelector
                    :business_id="business_id"
                    :asset_id.sync="rules_item.asset_id"
                    :clearable="false"
                    @change="handleDeviceGroupChange(rules_item)"
                ></DeviceGroupSelector>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item :prop="`config.rules.${index}.device_id`" :rules="rules['config.rules.device_id']">
                <!-- 设备 -->
                <DeviceSelector
                    :asset_id="rules_item.asset_id"
                    :device_id.sync="rules_item.device_id"
                    :clearable="false"
                    @change="(deviceId, pluginId) => handleDeviceChange(rules_item, deviceId, pluginId)"
                ></DeviceSelector>
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-form-item :prop="`config.rules.${index}.field`" :rules="rules['config.rules.field']">
                <!-- 条件选择 -->
                <TriggerSelector
                    :device_id="rules_item.device_id"
                    :plugin_id="rules_item.plugin_id"
                    :field.sync="rules_item.field"></TriggerSelector>
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-form-item :prop="`config.rules.${index}.condition`" :rules="rules['config.rules.condition']">
                <!-- 符号大于小于 -->
                <SymbolSelector :condition.sync="rules_item.condition"></SymbolSelector>
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-form-item :prop="`config.rules.${index}.value`" :rules="rules['config.rules.value']">
                <!-- 数值 -->
                <el-input size="medium" class="w-100" v-model="rules_item.value" :placeholder="$t('AUTOMATION.PLACEHOLDER7')"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-button type="indigo" size="medium" @click="addRulesLine" v-if="index===0">{{ $t('AUTOMATION.ADD_LINE') }}</el-button>
              <el-popconfirm :title=" $t('COMMON.TITLE4') " @confirm="removeRulesLine(rules_item)" v-else>
                <el-button slot="reference" type="danger" size="medium">{{ $t('COMMON.DELETE') }}</el-button>
              </el-popconfirm>
            </el-col>
          </el-row>
        </template>

        <!-- 时间条件类型 -->
        <template v-if="formData.type == 2" v-for="(rules_item, index) in formData.config.rules">
          <el-row type="flex" :gutter="20" :class="index > 0 ? 'pt-5' : ''">

            <!-- 触发条件   -->
            <el-col :span="4">
              <el-form-item>
                <!-- 条件类型 -->
                <ControlTypeSelector
                    v-if="index == 0"
                    :type.sync="formData.type"
                    @change="handleTypeChange"></ControlTypeSelector>
              </el-form-item>
            </el-col>

            <!-- 时间间隔   -->
            <el-col :span="4">
              <el-form-item>
                <IntervalSelector
                    :interval.sync="rules_item.interval"
                    @change="handleIntervalChange(rules_item)"
                ></IntervalSelector>
              </el-form-item>
            </el-col>

            <!-- 选择时间   -->
            <el-col :span="8">
              <el-form-item v-if="rules_item.interval==2">
                <repeat-time :rule_id.sync="rules_item.rule_id"
                             :unit.sync="rules_item.unit" :time_interval.sync="rules_item.time_interval_a"></repeat-time>
              </el-form-item>

              <el-form-item v-else :rules="rules['config.rules.time']">
                <TimeSelector :interval="rules_item.interval" :time.sync="rules_item.time"></TimeSelector>
              </el-form-item>


            </el-col>

            <el-col :span="3">
              <el-button type="indigo" size="medium" @click="addRulesLine" v-if="index===0">{{ $t('AUTOMATION.ADD_LINE') }}</el-button>
              <el-popconfirm :title="$t('COMMON.TITLE4')" @confirm="removeRulesLine(rules_item)" v-else>
                <el-button slot="reference" type="danger" size="medium">{{ $t('COMMON.DELETE')}}</el-button>
              </el-popconfirm>
            </el-col>
          </el-row>
        </template>
      </el-form-item>
    </el-col>
    <!--  触发条件 end  -->

    <!----------------------------------------------------------------------------------------------------------------->
    <!-- 执行指令 start -->
    <!----------------------------------------------------------------------------------------------------------------->
    <el-col :span="24">
      <el-form-item :label="$t('AUTOMATION.EXECUTE_COMMAND')">
        <template v-for="(apply_item, index) in formData.config.apply">
          <el-row :gutter="20" :class="index > 0 ? 'pt-5' : ''">
            <el-col :span="4">
              <el-form-item :prop="`config.apply.${index}.asset_id`" :rules="rules['config.rules.asset_id']">
                <!-- 设备分组 -->
                <DeviceGroupSelector
                    :business_id="business_id"
                    :asset_id.sync="apply_item.asset_id"
                    :clearable="false"
                    @change="handleDeviceGroupChange(apply_item)"
                ></DeviceGroupSelector>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item :prop="`config.apply.${index}.device_id`" :rules="rules['config.rules.device_id']">
                <!-- 设备 -->
                <DeviceSelector
                    :asset_id="apply_item.asset_id"
                    :device_id.sync="apply_item.device_id"
                    :clearable="false"
                    @change="(deviceId, pluginId) => handleDeviceChange(apply_item, deviceId, pluginId)"
                ></DeviceSelector>
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-form-item :prop="`config.apply.${index}.field`" :rules="rules['config.rules.field']">
                <!-- 条件 -->
                <InstructSelector
                    :device_id="apply_item.device_id"
                    :plugin_id="apply_item.plugin_id"
                    :field.sync="apply_item.field"
                ></InstructSelector>
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-form-item
                  :prop="`config.apply.${index}.value`"
                  :rules="apply_item.field_type === 3 ? rules['config.rules.value_number'] : rules['config.rules.value']"
              >
                <!-- 值 field_type等于3时 改为数字输入框 -->
                <el-input-number size="medium" controls-position="right" class="w-100" v-model="apply_item.value" v-if="apply_item.field_type === 3"></el-input-number>
                <el-input size="medium" class="w-100" v-model="apply_item.value" v-else></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-button type="indigo" size="medium" @click="addApplyLine" v-if="index===0">{{ $t('AUTOMATION.ADD_LINE') }}</el-button>
              <el-popconfirm :title="$t('COMMON.TITLE4')" @confirm="removeApplyLine(apply_item)" v-else>
                <el-button slot="reference" type="danger" size="medium">{{  $t('COMMON.DELETE') }}</el-button>
              </el-popconfirm>
            </el-col>
          </el-row>
        </template>
      </el-form-item>
    </el-col>
    <!--  执行指令 end  -->

  </el-row>

  <!-- 开关start -->
  <el-row :gutter="20">
    <el-col :span="24">
      <!-- 策略状态 -->
      <el-form-item :label="$t('COMMON.POLICYSTATUS')" class="inline-form-item">
        <el-switch :active-value="1" :inactive-value="0" v-model="formData.status"></el-switch>
        <small class="px-2">{{formData.status ? $t('COMMON.ON') : $t('COMMON.OFF')}}</small>
      </el-form-item>
    </el-col>
  </el-row>
  <!-- 开关end -->

  <FormAlert :error_message="error_message"></FormAlert>

  <div class="text-right">
    <el-button size="medium" type="default" @click="handleCancel()">{{$t('COMMON.CANCEL')}}</el-button>
    <el-button size="medium" type="indigo" @click="handleSave()">{{$t('COMMON.SAVE')}}</el-button>
  </div>
</el-form>
</el-dialog>
</template>

<script>
import {defineComponent, computed, ref, reactive} from "@vue/composition-api";
import DeviceGroupSelector from "@/components/common/DeviceGroupSelector.vue";
import DeviceSelector from "../components/DeviceSelector.vue"
import TriggerSelector from "../components/TriggerSelector.vue"
import SymbolSelector from "../components/SymbolSelector.vue"
import ControlTypeSelector from "../components/ControlTypeSelector.vue"
import LogicalSelector from "../components/LogicalSelector.vue"
import IntervalSelector from "../components/IntervalSelector.vue"
import TimeSelector from "../components/TImeSelector.vue"
import InstructSelector from "../components/InstructSelector.vue"
import FormAlert from "@/components/common/FormAlert.vue";
import {automation_add, automation_edit} from "@/api/automation";
import {watch} from "@vue/composition-api/dist/vue-composition-api";
import {json_parse_stringify} from "@/utils/helpers";
import RepeatTime from "../components/RepeatTime"
export default defineComponent({
  name: "ControlEditForm",
  components: {
    DeviceGroupSelector,
    DeviceSelector,
    TriggerSelector,
    SymbolSelector,
    ControlTypeSelector,
    LogicalSelector,
    IntervalSelector,
    RepeatTime,
    TimeSelector,
    InstructSelector,
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
    controlDialogVisible: {
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
        return !!props.controlDialogVisible
      },
      set(val){
        context.emit("update:controlDialogVisible", val)
      }
    })

    let controlFormRef = ref()

    // 默认值重置时用
    let default_rules_type_1 = {asset_id: "", device_id: "", plugin_id: "", field: "", condition: "", value: "", duration: 0}
    let default_rules_type_2 = {interval:0, time: "", time_interval_a: 60, unit: "second", rule_id: ""}
    let default_apply = {asset_id: "", device_id: "", plugin_id: "",  field: "",  value: ""}

    let formData = reactive({
      id: "",
      business_id: props.business_id,
      name: "",
      describe: "",
      status: 1, // 开关
      sort: 100,
      type: 1, // 策略类型
      issued: "1",
      config: {
        rules: [
          json_parse_stringify(default_rules_type_1)
        ],
        apply: [
          json_parse_stringify(default_apply)
        ]
      }
    })

    let error_message = ref("")

    // 重置表单数据
    function resetFormData(){
      let item_attrs = JSON.parse(JSON.stringify(props.current_item))
      if (JSON.stringify(item_attrs) != "{}") {
        item_attrs.config.rules.forEach(item => {
          if (item.unit == "minute") {
            item.time_interval_a = item.time_interval / 60;
          } else if (item.unit == "hour") {
            item.time_interval_a = item.time_interval / 3600;
          } else {
            item.time_interval_a = item.time_interval;
          }
        })
      }
      for (const key in formData) {
        // 有则逐个赋值
        if(key in item_attrs){
          formData[key] = item_attrs[key]
        }
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
        {required: true, message: "请填写名字"}
      ],
      describe: [
        {required: true, message: "请填写描述"}
      ],
      "config.rules.asset_id": [
        {required: true, message: "请选择分组"}
      ],
      "config.rules.device_id": [
        {required: true, message: "请选择设备"}
      ],
      "config.rules.field": [
        {required: true, message: "请选择条件"}
      ],
      "config.rules.condition": [
        {required: true, message: "请选择符号"}
      ],
      "config.rules.value": [
        {required: true, message: "请填写值"}
      ],
      "config.rules.value_number": [
        {required: true, message: "请填写值"},
        {pattern: /^[0-9]+([.]{1}[0-9]+){0,1}$/, message: "必须是数字"},
      ],
      "config.rules.time": [
        {required: true, message: "请选择时间"}
      ]
    })

    let loading = ref(false)

    function handleSave(){
      controlFormRef.value.validate((valid)=>{
        if(!valid) return

        if(loading.value) return
        loading.value = true
        formData.config.rules.forEach(item => {
          if (item.unit == "minute") {
            item.time_interval = item.time_interval_a * 60;
          } else if (item.unit == "hour") {
            item.time_interval = item.time_interval_a * 3600;
          } else {
            item.time_intervaa = item.time_interval_a;
          }
        })
        create_or_update(formData).then(({data})=>{
          if(data.code === 200) {
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

    function create_or_update(formData) {
      // 拷贝
      let copy = JSON.parse(JSON.stringify(formData))
      // 重点 config 要序列化
      copy.config = JSON.stringify(copy.config)
      // status 需要数字类型，字符串会报错 "状态 不能为空"
      copy.status = Number(copy.status)
      // sort 需要转字符串，不然保存为0
      copy.sort = String(copy.sort)
      return formData.id ? automation_edit(copy) : automation_add(copy)
    }

    function handleCancel(){
      context.emit("update:controlDialogVisible", false)
    }

    // 设备分组更改时
    function handleDeviceGroupChange(item){
      item.device_id = ""
      item.field = ""
    }

    // 设备 id 更改时
    function handleDeviceChange(item, deviceId, pluginId){
      // device_id 更改时 field 置空
      // item.field = ""
      // 插件id
      if (pluginId) {
        item.plugin_id = pluginId;
      }
      console.log("handleDeviceChange.item", item)
      console.log("handleDeviceChange.deviceId", deviceId)
      console.log("handleDeviceChange.pluginId", pluginId)
    }

    // 时间条件下 interval 更改
    function handleIntervalChange(item){
      item.time = ""
    }

    // 条件类型切换表单对应的数据
    function handleTypeChange(val){
      let tmp = val ==1 ? default_rules_type_1 : default_rules_type_2
      formData.config.rules = [json_parse_stringify(tmp)]
    }

    // 添加表单规则
    function addRulesLine(){
      let tmp;
      if(formData.type == 1){
        tmp = default_rules_type_1
        tmp.operator = "&&"
      }else{
        tmp = default_rules_type_2
      }
      formData.config.rules.push(json_parse_stringify(tmp))
    }
    // 移除表单规则
    function removeRulesLine(item){
      let index = formData.config.rules.indexOf(item)
      formData.config.rules.splice(index, 1)
    }

    function addApplyLine(){
      formData.config.apply.push(json_parse_stringify(default_apply))
    }

    function removeApplyLine(item){
      let index = formData.config.apply.indexOf(item)
      formData.config.apply.splice(index, 1)
    }

    return {
      showDialog,
      controlFormRef,
      formData,
      error_message,
      rules,
      handleSave,
      handleCancel,
      addRulesLine,
      removeRulesLine,
      addApplyLine,
      removeApplyLine,
      handleTypeChange,
      handleDeviceChange,
      handleDeviceGroupChange,
      handleIntervalChange,
    }
  }
})
</script>

<style scoped>
.help{
  /*display: inline-block;*/
  /*width: 14px;*/
  /*height: 14px;*/
  /*background: rgba(0,0,0, 0.5);*/
  /*border-radius: 100%;*/
  /*text-decoration: underline;*/
  /*text-decoration-style: dotted*/
}
.inline-form-item /deep/ .el-form-item__label{
  float: left!important;
  padding-right: 10px;
}
</style>