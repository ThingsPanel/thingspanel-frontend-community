<template>
  <el-form
      ref="form"
      :rules="rules"
      label-position="left"
      :model="form"
      label-width="80px">
      <el-form-item :label="$t('RULE_ENGINE.DATA_FORWARDINGNEW.URL')" prop="url" required>
        <el-input v-model="form.url"></el-input>
      </el-form-item>

      <div style="display: flex;justify-content: center">
        <el-button class="cancel-button" type="cancel" size="medium" plain @click="cancelDialog">{{ $t('RULE_ENGINE.ACCESS_ENGINE.CANCEL') }}</el-button>
        <el-button class="medium" type="save" size="medium" @click="onSubmit">{{ $t('RULE_ENGINE.ACCESS_ENGINE.SUBMIT') }}</el-button>
      </div>
  </el-form>

 
</template>

<script>
// import options from './cascader_options'

import i18n from "@/core/plugins/vue-i18n.js"
const required = true;

export default {
  name: "UrlContent",
  components: {  },
  props: {

    init_data: {
      default: null
    },

    type:{
      default: null
    }
  },
  
  data() {
    return {
      form:{
        url: '',
      },
      rules: {
        url: [{
            required: true,
            message: i18n.t('RULE_ENGINE.DATA_FORWARDINGNEW.PLACEHOLDER8'),
            trigger: "blur"
        }, ],
      },
    }
  },
  created() {

  },
  methods: {
    edit(record){
      if(record.target_info){
        this.form = Object.assign({}, record.target_info);
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