<template>
<el-form
    ref="deviceCreateForm"
    label-position="left"
    label-width="70px"
    :model="formData"
    :rules="rules"
    hide-required-asterisk>
  <el-form-item label="设备名" prop="name">
    <el-input size="medium" v-model="formData.name"></el-input>
  </el-form-item>

  <FormAlert :error_message="error_message"></FormAlert>

  <div>
    <el-button type="primary" class="w-100" @click="handleSubmit">创建设备</el-button>
  </div>
</el-form>
</template>

<script>
import {defineComponent, reactive, ref} from "@vue/composition-api";
import FormAlert from "@/components/common/FormAlert";
import {device_add} from "@/api/device";
import {message_success} from "@/utils/helpers";

export default defineComponent({
  name: "DeviceCreateForm",
  components: {
    FormAlert
  },
  props: {
    asset_id: {
      required: true
    }
  },
  emits: ['deviceCreated'],
  setup(props, context){
    let deviceCreateForm = ref()

    let formData = reactive({
      name: "",
      asset_id: props.asset_id,
      protocol: "tcp"
    })

    let rules = reactive({
      name: [
        {required: true, message: "请填写设备名"}
      ]
    })

    let loading = ref(false)
    let error_message = ref("")
    function handleSubmit(){
      deviceCreateForm.value.validate((valid)=>{
        if(!valid) return

        if(loading.value) return;
        loading.value = true

        error_message.value = ""

        device_add(formData).then(({data})=>{
          if(data.code === 200) {
            message_success("创建成功！")
            context.emit("deviceCreated", data.data)
          }else{
            error_message.value = data.message
          }
        }).finally(()=>{
          loading.value = false
        })
      })
    }

    return {
      deviceCreateForm,
      formData,
      rules,
      loading,
      handleSubmit,
      error_message,
    }
  }
})
</script>

<style scoped>

</style>