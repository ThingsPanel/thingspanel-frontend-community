<template>
  <div class="transpond-create">
    <el-form
        ref="createForm"
        :rules="rules"
        label-position="left"
        :model="form"
        :hide-required-asterisk="true"
        label-width="80px">
      <el-form-item label="设备名称" prop="device_name">
        <el-cascader
            :options="options"
            v-model="form.device_name">
        </el-cascader>
      </el-form-item>
      <el-form-item label="频率" prop="frequency">
        <el-select v-model="form.frequency">
          <el-option label="实时" value="实时"></el-option>
          <el-option label="每分钟" value="每分钟"></el-option>
          <el-option label="每十分钟" value="每十分钟"></el-option>
          <el-option label="每半小时" value="每半小时"></el-option>
          <el-option label="每小时" value="每小时"></el-option>
        </el-select>
      </el-form-item>

        <el-button class="w-100" type="primary" @click="onSubmit">创建</el-button>
    </el-form>
  </div>
</template>

<script>
export default {
  name: "CreateForm",
  props: {
    // handle_create:{
    //   request: true,
    //   type: Function,
    // },
    init_data: {
      default: null
    }
  },
  data:()=>({
    form:{
      device_name: '',
      frequency: ''
    },
    rules: {
      device_name: [
        {required: true, message: "请选择设备"}
      ],
      frequency: [
        {required: true, message: "请选择频率"}
      ]
    },
    options: [{
      value: '环境检测',
      label: '环境检测',
      children: [{
        value: '4层',
        label: '4层',
        children: [{
          value: '温度湿度',
          label: '温度湿度'
        }, {
          value: 'fankui',
          label: '反馈'
        }, {
          value: 'xiaolv',
          label: '效率'
        }, {
          value: 'kekong',
          label: '可控'
        }]
      }, {
        value: '2层',
        label: '2层',
        children: [{
          value: '温度传感器',
          label: '温度传感器'
        }, {
          value: '氧传感器',
          label: '氧传感器'
        }]
      }]
    }, ]
  }),
  created() {
    if(this.init_data){
      this.form.device_name = this.init_data.device_name
      this.form.frequency = this.init_data.frequency
    }
  },
  methods: {
    onSubmit(){
      this.$refs.createForm.validate((valid)=>{
        if(valid){
          this.$emit('submit', this.form)
          setTimeout(()=>{
            this.$refs.createForm.resetFields()
          }, 500)
          // this.form.device_name = ""
          // this.form.frequency = ""
          // this.handle_create(this.form)
        }
      })
    }
  }
}
</script>

<style lang="scss">
.transpond-create{
  .el-form-item__label{
    color: #fff;
  }
  .el-cascader{
    width: 100%;
  }
  .el-select{
    width: 100%;
  }
}
</style>