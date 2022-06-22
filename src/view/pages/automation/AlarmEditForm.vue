<template>
<el-dialog
    :title="current_item.id ?'修改告警策略': '新增告警策略'"
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
      <el-form-item label="告警策略名称" prop="name" :rules="rules.name">
        <el-input v-model="formData.name"></el-input>
      </el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item label="告警策略名称" prop="describe" :rules="rules.describe">
        <el-input v-model="formData.describe"></el-input>
      </el-form-item>
    </el-col>

    <el-col :span="12">
      <el-form-item label="分组" prop="sensor" :rules="rules.sensor">
        <DeviceGroupSelector
            :business_id="business_id"
            :asset_id.sync="formData.sensor"
            :clearable="false"
        ></DeviceGroupSelector>
      </el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item label="设备" prop="bid" :rules="rules.bid">
        <DeviceSelector
            :asset_id="formData.sensor"
            :device_id.sync="formData.bid"
            :clearable="false"
        ></DeviceSelector>
      </el-form-item>
    </el-col>

    <el-col :span="24">
      <el-form-item label="触发条件">
        <template v-for="(config_item, index) in formData.config">
          <el-row :gutter="20">
            <!-- 或 且 -->
            <el-col :span="3" class="py-5" v-if="config_item.operator">
              <el-form-item>
                <el-select v-model="config_item.operator" size="medium">
                  <el-option :value="item.value" :label="item.label" v-for="item in operatorOptions"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item :prop="'config.'+index+'.field'" :rules="rules['config.field']">
                <el-select class="w-100" v-model="config_item.field" placeholder="请选择条件" size="medium">
                  <el-option :value="item.key" :label="item.name" v-for="item in triggerOptions"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item :prop="'config.'+index+'.condition'" :rules="rules['config.condition']">
                <el-select class="w-100" v-model="config_item.condition" placeholder="请选择符号" size="medium">
                  <el-option :value="item.id" :label="item.name" v-for="item in symbolOptions"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item :prop="'config.'+index+'.value'" :rules="rules['config.value']">
                <el-input class="w-100" v-model="config_item.value" placeholder="请输入值"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-button type="indigo" size="medium" @click="addLine" v-if="index===0">新增一行</el-button>
              <el-popconfirm title="确定删除此项？" @confirm="removeLine(config_item)" v-else>
                <el-button slot="reference" type="danger" size="medium">删除</el-button>
              </el-popconfirm>
            </el-col>
          </el-row>
        </template>
      </el-form-item>
    </el-col>

    <el-col :span="24">
      <el-form-item label="触发条件">
        <el-input v-model="formData.message" type="textarea"></el-input>
      </el-form-item>
    </el-col>
  </el-row>

  <FormAlert :error_message="error_message"></FormAlert>

  <div class="text-right">
    <el-button size="medium" type="default" @click="handleCancel()">取消</el-button>
    <el-button size="medium" type="indigo" @click="handleSave()">保存</el-button>
  </div>
</el-form>
</el-dialog>
</template>

<script>
import {computed, defineComponent, reactive, ref, watch} from "@vue/composition-api";
import DeviceGroupSelector from "@/components/common/DeviceGroupSelector.vue";
import DeviceSelector from "./DeviceSelector.vue"
import useAlarmTriggerOptions from "@/view/pages/automation/useAlarmTriggerOptions";
import {warning_add, warning_edit} from "@/api/automation";
import FormAlert from "@/components/common/FormAlert";

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
      config: [
        {field: "", condition: "", value: ""},
      ],
      message: "",
    })

    let error_message = ref("")

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

    let rules = reactive({
      name:[
        {required: true, message: "请填写名字"}
      ],
      describe: [
        {required: true, message: "请填写描述"}
      ],
      sensor: [
        {required: true, message: "请选择分组"}
      ],
      bid: [
        {required: true, message: "请选择设备"}
      ],
      "config.field": [
        {required: true, message: "请选择条件"}
      ],
      "config.condition": [
        {required: true, message: "请选择符号"}
      ],
      "config.value": [
        {required: true, message: "请填写值"}
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
      addLine,
      removeLine,
    }
  }
})
</script>

<style scoped>

</style>