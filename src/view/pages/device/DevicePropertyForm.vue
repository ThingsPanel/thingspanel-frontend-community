<template>
<div>
  <p class="my-2">协议：</p>
  <el-select size="medium" placeholder="请选择协议" class="w-100" v-model="device_item.protocol" @change="handleChange()">
    <el-option :label="'TCP'" :value="'tcp'"></el-option>
    <el-option :label="'MQTT'" :value="'mqtt'"></el-option>
  </el-select>

  <p class="my-2">默认配置:</p>
  <div class="default-setting">
    <p class="my-1" v-for="item in default_setting">{{item}}</p>
  </div>

  <p class="my-2">Token:</p>
  <el-input size="medium" class="w-100" v-model="device_item.token"></el-input>

  <p class="my-2">接口类型:</p>
  <div class="default-setting">
    <p class="my-1">json</p>
  </div>
</div>
</template>

<script>
import {defineComponent, ref, watch} from "@vue/composition-api";
import {device_default_setting} from "@/api/device";

export default defineComponent({
  name: "DevicePropertyForm",
  props: {
    device_item: {
      required: true,
    }
  },
  emits: ['change'],
  setup(props, context){
    let default_setting = ref([])

    // console.log(props.device_item)

    // 打开时初始化
    if(props.device_item.protocol) {
      device_default_setting({protocol: props.device_item.protocol}).then(({data})=>{
        // 有可能没有data
        if(data.data.default_setting) {
          default_setting.value = data.data.default_setting.split("$$")
        }else{
          default_setting.value = []
        }
      })
    }

    // select 更改时
    function handleChange(){
      device_default_setting({protocol: props.device_item.protocol}).then(({data})=>{
        if(data.code === 200) {

          // 没有 token 时，使用默认值
          if(data.data.Token && !props.device_item.token) {
            props.device_item.token = data.data.Token
          }

          // 有可能没有data
          if(data.data.default_setting) {
            default_setting.value = data.data.default_setting.split("$$")
          }else{
            default_setting.value = []
          }

          // console.log('update change')
          context.emit('change')
        }
      })
    }

    return {
      default_setting,
      handleChange,
    }
  }
})
</script>

<style scoped>
.default-setting{
  background: #f1f1f1;
  border-radius: 3px;
  padding: 5px 15px;
  min-height: 37px;
}
</style>