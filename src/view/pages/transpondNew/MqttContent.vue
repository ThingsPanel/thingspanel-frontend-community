<template>
  <el-form
      ref="form"
      :rules="rules"
      label-position="left"
      :model="form"
      label-width="170px">
      <el-form-item :label="$t('RULE_ENGINE.DATA_FORWARDINGNEW.LABLE1')" prop="host" required>
          <el-input v-model="form.host"></el-input>
      </el-form-item>
      <el-form-item :label="$t('RULE_ENGINE.DATA_FORWARDINGNEW.LABLE2')" prop="port" required>
          <el-input v-model="form.port"></el-input>
      </el-form-item>
      <el-form-item :label="$t('RULE_ENGINE.DATA_FORWARDINGNEW.LABLE3')" prop="client_id">
          <el-input v-model="form.client_id"></el-input>
      </el-form-item>
      <el-form-item :label="$t('RULE_ENGINE.DATA_FORWARDINGNEW.LABLE4')" prop="username">
          <el-input v-model="form.username"></el-input>
      </el-form-item>
      <el-form-item :label="$t('RULE_ENGINE.DATA_FORWARDINGNEW.LABLE5')" prop="password">
          <el-input v-model="form.password"></el-input>
      </el-form-item>
      <el-form-item :label="$t('RULE_ENGINE.DATA_FORWARDINGNEW.LABLE6')" prop="topic" required>
          <el-input v-model="form.topic"></el-input>
      </el-form-item>
      <div style="display: flex;justify-content: center">
        <el-button class="cancel-button" type="cancel" size="medium" plain @click="cancelDialog">{{ $t('COMMON.CANCEL') }}</el-button>
        <el-button class="medium" type="save" size="medium" @click="onSubmit">{{ $t('COMMON.SUBMIT') }}</el-button>
      </div>
  </el-form>


</template>

<script>
// import options from './cascader_options'

import i18n from "@/core/plugins/vue-i18n.js"
const required = true;

export default {
  name: "MqttContent",
  components: {  },
  props: {
    // init_data: {
    //   default: null
    // },
    // type : {
    //   default: null
    // }
  },
  data () {
    return {
      form:{
        host:"",
        port:"",
        client_id:"",
        username:"",
        password:"",
        topic:"",
      },
      rules: {
        host: [{
            required: true,
            message: i18n.t('RULE_ENGINE.DATA_FORWARDINGNEW.PLACEHOLDER2'),
            trigger: "blur"
        }, ],
        port: [{
            required: true,
            message: i18n.t('RULE_ENGINE.DATA_FORWARDINGNEW.PLACEHOLDER3'),
            trigger: "blur"
        }, ],
        client_id: [{
            required: false,
            message: i18n.t('RULE_ENGINE.DATA_FORWARDINGNEW.PLACEHOLDER4'),
            trigger: "blur"
        }, ],
        username: [{
            required: false,
            message: i18n.t('RULE_ENGINE.DATA_FORWARDINGNEW.PLACEHOLDER5'),
            trigger: "blur"
        }, ],
        password: [{
            required: false,
            message: i18n.t('RULE_ENGINE.DATA_FORWARDINGNEW.PLACEHOLDER6'),
            trigger: "blur"
        }, ],
        topic: [{
            required: true,
            message: i18n.t('RULE_ENGINE.DATA_FORWARDINGNEW.PLACEHOLDER7'),
            trigger: "blur"
        }, ],
      },
    }
  },
  created() {
    // if(this.fromData){
    //   this.form = this.fromData
    // }
    // console.log(this.fromData)
  },
  methods: {
    edit(record) {
      if(record.target_info){
        this.form = Object.assign({}, record.target_info.mqtt);
      }else{
        this.form = Object.assign({}, record);
      }
    },
    onSubmit(){
      this.$refs.form.validate((valid)=>{
        if(valid){
          this.$emit('save', this.form)
        }
      })
    },
    cancelDialog() {
      this.$emit("cancel")
    }
  }
}
</script>

<style scoped lang="scss">
.transpond-create{
  //.el-form-item__label{
  //  color: #fff;
  //}
  //.el-cascader{
  //  width: 100%;
  //}
  //.el-select{
  //  width: 100%;
  //}
}

</style>