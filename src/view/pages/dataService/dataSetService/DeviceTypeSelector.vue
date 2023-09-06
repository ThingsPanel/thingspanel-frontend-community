<template>
  <div style="display: flex">
   
    <!-- 用户列表 -->
    <el-select :no-data-text="$t('COMMON.SELECT_NO_DATA')" ref="userRef" style="width: 200px;margin-right:10px" v-model="formData.user_id" @change="handleUserChange">
      <el-option v-for="(option, index) in userOptions" :key="index" :label="option.name" :value="option.id"></el-option>
    </el-select>

    <el-checkbox-group v-model="list">
      <!-- <el-checkbox label="is_email">{{ $t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.EMAIL') }}</el-checkbox>
      <el-checkbox label="is_message">{{ $t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.SMS') }}</el-checkbox>
      <el-checkbox label="is_phone">{{ $t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PHONE')}}</el-checkbox> -->

      <el-checkbox :label="item.label" v-for="(item, i) in dataList" :key="i" @change="chooseChange($event,item)">{{item.name}}</el-checkbox>
    </el-checkbox-group> 
  </div>
</template>

<script>
import {getUserList,} from "@/api/notice";
import { message_error } from '@/utils/helpers';
import i18n from "@/core/plugins/vue-i18n"
export default {
  name: "DeviceTypeSelector",
  components: { },
  props: {
    /**
     * 配置
     */
    option: {
      type: [Object],
      default: () => { return { operator: true } }
    },
    data: {
      type: [Object],
      default: () => {return {}}
    }
  },
  data() {
    return {
      formData: {
        user_id: "",
        list:[],
        is_email: 0,
        is_message: 0,
        is_phone: 0,
      },
      list: [],
      // 用户列表
      userOptions: [],
      params: {
        page: 1,
        limit: 100
      },
       
      dataList:[
        {
          name:i18n.t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.EMAIL'),
          label:"is_email",
        },
        {
          name:i18n.t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.SMS'),
          label:"is_message",
        },
        {
          name:i18n.t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PHONE'),
          label:"is_phone",
        }
      ]
    }
  },
  watch: {
    data: {
      handler(newValue) {
        if (newValue) {
          let arr=[]
          for (let key in newValue) {
            console.log(key)
            if(newValue[key] === 1){
              arr.push(key)
            }
          }
          this.list=arr
          this.formData = JSON.parse(JSON.stringify(newValue));
          console.log("formData", this.formData)
        }
      },
      immediate: true
    },
    // "formData.list": {
    //   handler(newValue) {
    //     if (newValue) {
    //       this.dataList = JSON.parse(JSON.stringify(newValue));
    //       console.log("list", this.dataList)
    //     }
    //   },
    //   immediate: true
    // },
    
  },
  created() {
    this.getUser();
  },
  methods: {
    /**
     * 选择用户
     * @param v
     */
     handleUserChange(v) {
      this.formData.user_id = v;
      this.updateData();

    },
    
    chooseChange(e,item){
      if(item.label==="is_email"){
        this.formData.is_email = e ? 1 : 0
      }else if(item.label==="is_message"){
        this.formData.is_message = e ? 1 : 0
      }else if(item.label==="is_phone"){
        this.formData.is_phone = e ? 1 : 0
      }
      this.updateData();
    },
   
    /**
     * 向父组件传值
     */
    updateData() {
      console.log("updateData", this.formData);
      this.$emit("change", this.formData);
    },


    // 获取用户数据
    getUser(){
      getUserList(this.params).then(res => {
        if (res.data.code === 200) {
          this.userOptions=res.data.data.data
        }
      })
    },
    /**
     * @description: 验证
     * @return {*}
     */    
    validate() {
      const refs = this.$refs;
      const form = this.formData;
      if (!form.user_id || form.user_id === "") {
        refs.userRef.focus();
        message_error(this.$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PLACEHOLDER3'));
        return false;
      }
      if (!this.list || this.list.length ===0) {
          message_error(this.$t('SYSTEM_MANAGEMENT.NOTICE_MANAGEMENT.PLACEHOLDER4'));
          return false;
      }
      return true;
    }
  }
}
</script>

<style scoped>

</style>