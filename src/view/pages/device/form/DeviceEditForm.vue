<template>
<el-form
    ref="deviceEditForm"
    label-position="left"
    label-width="70px"
    :model="formData"
    :rules="rules"
    hide-required-asterisk>
  <el-form-item label="设备名" prop="name">
    <el-input size="medium" v-model="formData.name"></el-input>
  </el-form-item>

  <el-form-item label="协议" prop="protocol">
    <el-radio-group v-model="formData.protocol">
      <el-radio label="mqtt">MQTT</el-radio>
      <el-radio label="tcp">TCP</el-radio>
    </el-radio-group>
  </el-form-item>

  <el-form-item label="类型" prop="type">
    <el-select size="medium" label="type" v-model="formData.type">
      <el-option v-for="item in typeOptions" :value="item.id" :label="item.name" :key="item.id"></el-option>
    </el-select>
  </el-form-item>
  <div class="mb-3">
    <el-tag class="mr-2 mb-2" v-for="item in dash" :key="item.key">{{item.name}}</el-tag>
  </div>

  <!-- 默认参数 start -->
  <div class="default-params">
    <p><span>token</span> {{device_show.token}}</p>
    <p><span>端口</span> {{device_show.port}}</p>
    <p><span>发布主题</span> {{device_show.publish}}</p>
    <p><span>订阅主题</span> {{device_show.subscribe}}</p>
    <p><span>用户名</span> {{device_show.username}}</p>
    <p><span>密码</span> {{device_show.password}}</p>
  </div>
  <!-- 默认参数 end -->

  <FormAlert :error_message="error_message"></FormAlert>

  <div class="my-2"><el-button type="primary" class="w-100" @click="handleSubmit" :disabled="loading">保存</el-button></div>
  <div class="my-2"><el-button type="default" class="w-100" @click="handleReset" :disabled="loading">重置</el-button></div>

</el-form>

</template>

<script>
import {defineComponent, reactive, ref, watch} from "@vue/composition-api";
import {device_data, device_update} from "@/api/device";
import {asset_index, structure_field} from "@/api/asset";
import {message_success} from "@/utils/helpers";
import FormAlert from "@/components/common/FormAlert";

export default defineComponent({
  name: "DeviceEditForm",
  components: {
    FormAlert
  },
  props: {
    device_id: {
      required: true
    }
  },
  emits: ['deviceUpdated'],
  setup(props, context){
    // 元素 ref
    let deviceEditForm = ref()

    // 设备的详情
    let device_show = ref({})

    // 表单数据
    let formData = reactive({
      id: "",
      asset_id: "",
      name: "",
      type: "",
      protocol: "mqtt",
    })

    // 校验规则
    let rules = reactive({
      name: [
        {required: true, message: "请填写设备名字"}
      ],
      type: [
        {required: true, message: "请选择类型"}
      ],
      protocol: [
        {required: true, message: "请选择协议"}
      ]
    })

    // 插件类型的选项
    let typeOptions = ref([])
    asset_index().then(({data})=>{
      if(data.code === 200){
        // console.log(data.data)
        typeOptions.value = data.data
      }
    })

    // 插件的仪表，tpye 变更时查询
    let dash = ref([])
    watch(()=>formData.type, (new_type)=>{
      structure_field({field: new_type}).then(({data})=>{
        if(data.code === 200 && data.data && data.data.length){
          // 先清空
          dash.value = []
          // 返回的是数组下的 field
          data.data.forEach((item)=>{
            dash.value.push(...item.field)
          })
        }
      })
    })

    // 设备详情 device_id 更新时重新请求接口
    watch(()=>props.device_id, (did)=>{
      // id 改变的时候请求 设备详情
      device_data({did}).then(({data})=>{
        if(data.code===200){
          device_show.value = data.data
          initFormData()
        }
      })
    },{
      immediate:true
    })

    // 初始化表单
    function initFormData(){
      for (let key in formData) {
        if(key in device_show.value){
          formData[key] = device_show.value[key]
        }
      }
    }

    // 提交更新请求
    let loading = ref(false)
    let error_message = ref("")
    function handleSubmit(){
      deviceEditForm.value.validate((valid)=>{
        if(!valid) return;

        // 提交
        if(loading.value) return;
        loading.value = true

        // 清空错误信息
        error_message.value = ""

        device_update(formData).then(({data})=>{
          if(data.code === 200) {
            message_success('更新成功！')
            context.emit('deviceUpdated', data.data)
          }else{
            error_message.value = data.message
          }
        }).finally(()=>{
          loading.value = false
        })
      })
    }

    function handleReset(){
      initFormData()
    }

    return {
      device_show,
      formData,
      typeOptions,
      dash,
      deviceEditForm,
      rules,
      handleSubmit,
      handleReset,
      error_message,
      loading,
    }
  }
})
</script>

<style scoped>
/deep/ label{
  margin-bottom: 0!important;
}

.default-params span{
  display: inline-block;
  width: 70px;
}

.default-params p{
  margin-bottom: 1rem;
}
</style>