<template>
<el-dialog
    :title="current_item.id ? '修改控制策略' : '新增控制策略'"
    class="el-dark-dialog"
    :visible.sync="showDialog"
    width="60%"
    :close-on-click-modal="false"
>
<el-form
    ref="controlFormRef"
    :model="formData"
    label-position="top"
    hide-required-asterisk>
  <el-row :gutter="20">

    <el-col :span="8">
      <el-form-item label="策略名称" prop="name" :rules="rules.name">
        <el-input v-model="formData.name"></el-input>
      </el-form-item>
    </el-col>
    <el-col :span="8">
      <el-form-item label="策略描述" prop="describe" :rules="rules.describe">
        <el-input v-model="formData.describe"></el-input>
      </el-form-item>
    </el-col>
    <el-col :span="8">
      <el-form-item label="策略优先级" prop="sort">
        <template slot="label">
          策略优先级
          <el-tooltip placement="top">
            <div slot="content">值越小优先级越高</div>
            <small class="help">?</small>
          </el-tooltip>
        </template>
        <el-input-number class="w-100" v-model="formData.sort"></el-input-number>
      </el-form-item>
    </el-col>

    <!--  触发条件 start  -->
    <el-col :span="24">
      <el-form-item label="触发条件">
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
                ></DeviceSelector>
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-form-item :prop="`config.rules.${index}.field`" :rules="rules['config.rules.field']">
                <!-- 条件选择 -->
                <TriggerSelector
                    :device_id="rules_item.device_id"
                    :field.sync="rules_item.field"
                ></TriggerSelector>
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
                <el-input size="medium" class="w-100" v-model="rules_item.value" placeholder="数值"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-button type="indigo" size="medium" @click="addRulesLine" v-if="index===0">新增一行</el-button>
              <el-popconfirm title="确定删除此项？" @confirm="removeRulesLine(rules_item)" v-else>
                <el-button slot="reference" type="danger" size="medium">删除</el-button>
              </el-popconfirm>
            </el-col>
          </el-row>
        </template>

        <!-- 时间条件类型 -->
        <template v-if="formData.type == 2" v-for="(rules_item, index) in formData.config.rules">
          <el-row type="flex" :gutter="20" :class="index > 0 ? 'pt-5' : ''">
            <el-col :span="4">
              <el-form-item>
                <!-- 条件类型 -->
                <ControlTypeSelector
                    v-if="index == 0"
                    :type.sync="formData.type"
                    @change="handleTypeChange"></ControlTypeSelector>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item>
                <IntervalSelector :interval.sync="rules_item.interval"></IntervalSelector>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :prop="`config.rules.${index}.time`" :rules="rules['config.rules.time']">
                <TimeSelector :interval="rules_item.interval" :time.sync="rules_item.time"></TimeSelector>
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-button type="indigo" size="medium" @click="addRulesLine" v-if="index===0">新增一行</el-button>
              <el-popconfirm title="确定删除此项？" @confirm="removeRulesLine(rules_item)" v-else>
                <el-button slot="reference" type="danger" size="medium">删除</el-button>
              </el-popconfirm>
            </el-col>
          </el-row>
        </template>
      </el-form-item>
    </el-col>
    <!--  触发条件 end  -->

    <!--  执行指令 start  -->
    <el-col :span="24">
      <el-form-item label="执行命令">
        <template v-for="(apply_item, index) in formData.config.apply">
          <el-row :gutter="20" :class="index > 0 ? 'pt-5' : ''">
            <el-col :span="4">
              <el-form-item :prop="`config.apply.${index}.asset_id`" :rules="rules['config.rules.asset_id']">
                <!-- 设备分组 -->
                <DeviceGroupSelector
                    :business_id="business_id"
                    :asset_id.sync="apply_item.asset_id"
                    :clearable="false"
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
                ></DeviceSelector>
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-form-item :prop="`config.apply.${index}.field`" :rules="rules['config.rules.field']">
                <!-- 条件 -->
                <TriggerSelector
                    :device_id="apply_item.device_id"
                    :field.sync="apply_item.field"
                ></TriggerSelector>
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-form-item :prop="`config.apply.${index}.value`" :rules="rules['config.rules.value']">
                <!-- 值 -->
                <el-input size="medium" class="w-100" v-model="apply_item.value" placeholder="数值"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-button type="indigo" size="medium" @click="addApplyLine" v-if="index===0">新增一行</el-button>
              <el-popconfirm title="确定删除此项？" @confirm="removeApplyLine(apply_item)" v-else>
                <el-button slot="reference" type="danger" size="medium">删除</el-button>
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
      <el-form-item label="策略状态" class="inline-form-item">
        <el-switch :active-value="1" :inactive-value="0" v-model="formData.status"></el-switch>
      </el-form-item>
    </el-col>
  </el-row>
  <!-- 开关end -->

  <div class="text-right">
    <el-button size="medium" type="default" @click="handleCancel()">取消</el-button>
    <el-button size="medium" type="indigo" @click="handleSave()">保存</el-button>
  </div>
</el-form>
</el-dialog>
</template>

<script>
import {defineComponent, computed, ref, reactive} from "@vue/composition-api";
import DeviceGroupSelector from "@/components/common/DeviceGroupSelector.vue";
import DeviceSelector from "./DeviceSelector.vue"
import TriggerSelector from "./TriggerSelector.vue"
import SymbolSelector from "./SymbolSelector.vue"
import ControlTypeSelector from "./ControlTypeSelector.vue"
import LogicalSelector from "./LogicalSelector.vue"
import IntervalSelector from "./IntervalSelector.vue"
import TimeSelector from "./TImeSelector.vue"
import {automation_add, automation_edit} from "@/api/automation";
import {watch} from "@vue/composition-api/dist/vue-composition-api";
import {json_parse_stringify} from "@/utils/helpers";

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
    TimeSelector,
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
    let default_rules_type_1 = {asset_id: "", device_id: "", field: "", condition: "", value: "", duration: 0}
    let default_rules_type_2 = {interval:0, time:""}
    let default_apply = {asset_id: "", device_id: "",  field: "",  value: ""}

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
      "config.rules.time": [
        {required: true, message: "请选择时间"}
      ],
    })

    // 重置表单数据
    function resetFormData(){
      let item_attrs = JSON.parse(JSON.stringify(props.current_item))

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

    let loading = ref(false)

    function handleSave(){
      controlFormRef.value.validate((valid)=>{
        if(!valid) return

        if(loading.value) return
        loading.value = true

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
      // status 需要时数字，字符串会报错 "状态 不能为空"
      copy.status = Number(copy.status)
      // sort 需要转字符串，不然保存为0
      copy.sort = String(copy.sort)
      return formData.id ? automation_edit(copy) : automation_add(copy)
    }

    function handleCancel(){
      context.emit("update:controlDialogVisible", false)
    }

    function handleTypeChange(val){
      let tmp = val ==1 ? default_rules_type_1 : default_rules_type_2
      formData.config.rules = [json_parse_stringify(tmp)]
    }

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
      rules,
      handleSave,
      handleCancel,
      addRulesLine,
      removeRulesLine,
      addApplyLine,
      removeApplyLine,
      handleTypeChange,
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