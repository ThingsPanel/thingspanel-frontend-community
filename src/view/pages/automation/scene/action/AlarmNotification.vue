<template>
    <div class="alarm-device-box" >
     <!-- <el-form label-position="left" label-width="85px"> -->
        <!-- 告警级别 -->
        <el-form-item style="margin-bottom: 10px" :label="$t('AUTOMATION.WARNING_LEVEL')" required>
            <el-select :no-data-text="$t('COMMON.SELECT_NO_DATA')" ref="warningLevelRef" style="width: 200px" v-model="formData.warningLevel" @change="handleChange">
                <el-option :label="$t('AUTOMATION.WARNING_LEVEL_LOW')" :value="'1'"></el-option>
                <el-option :label="$t('AUTOMATION.WARNING_LEVEL_MEDIUM')" :value="'2'"></el-option>
                <el-option :label="$t('AUTOMATION.WARNING_LEVEL_HIGH')" :value="'3'"></el-option>
              </el-select>
        </el-form-item>

        <!-- 通知组 -->
        <el-form-item  style="margin-bottom: 10px" :label="$t('AUTOMATION.NOTIFY_USER')">
            <el-select style="width: 200px;margin-right:10px" clearable v-model="formData.notification" @change="handleRoleChange">
              <el-option :no-data-text="$t('COMMON.SELECT_NO_DATA')" v-for="(item, index) in roleList" :key="index" :label="item.group_name" :value="item.id"></el-option>
            </el-select>
        </el-form-item>

        <!-- 重复次数 -->
        <el-form-item  style="margin-bottom: 10px" label="告警条件">
          条件触发达到
          <el-input-number ref="repeatTimesRef" size="small" :min="1" v-model="formData.repeatTimes" :placeholder="$t('AUTOMATION.PLACEHOLDER.ALARM_REPEAT_TIMES')" @change="handleChange"/>
          次后触发告警
        </el-form-item>

        <!-- 描述 -->
        <el-form-item  style="margin-bottom: 10px" :label="$t('AUTOMATION.ALARM_DESCRIPTION')">
          <el-input style="width: 200px" v-model="formData.warning_description" :placeholder="$t('AUTOMATION.ALARM_DESCRIPTION')" @change="handleChange"></el-input>
        </el-form-item>
  
     <!-- </el-form> -->
    </div>
  </template>
  
  <script>
  import { user_find_all } from "@/api/user"
import { message_error } from '@/utils/helpers'
  export default {
    name: "AlarmPanel",
    components: {  },
    props: {
      data: {
        type: [Object],
        default: () => { return {} }
      }
    },
    data() {
      return {
        formData: {
          repeatTimes: 1,
            groups: [
                {}
            ],
            notification:''
        },
        roleList: []
      }
    },
    watch: {
      data: {
        handler(newValue) {
          if (newValue && JSON.stringify(newValue) !== "{}") {
            this.formData = JSON.parse(JSON.stringify(newValue));
            console.log("回显", this.formData)
           
            if (!this.formData.groups || this.formData.groups.length === 0) {
              this.formData.groups = [{}];
            }
          }
        }, immediate: true
      },
    },
    async created() {
      this.getRoleList();
      await this.$nextTick();
      this.handleChange();
    },
    methods: {
      /**
       * @description: 新增用户组
       * @return {*}
       */      
      handleAddGroup() {
        this.formData.groups.push({});
      },
      /**
       * @description: 删除用户组
       * @param {*} group
       * @return {*}
       */
      handleDeleteGrouop(group) {
        let index = this.formData.groups.findIndex(item => item == group);
        this.formData.groups.splice(index, 1);
      },
      handleChange() {
        this.$emit("change", this.formData);
      },
      /**
       * @description: 根据角色id查询用户
       * @param {*} v
       * @return {*}
       */      
      handleRoleChange(v) {
        // 缺接口
        this.handleChange();
      },
      /**
       * @description: 获取角色列表
       * @return {*}
       */
      getRoleList() {
        user_find_all({ current_page: 1, per_page: 36 })
        .then(({data}) => {
          if (data.code == 200) {
            this.roleList = data.data?.data || [];
          }
        })
      },
      validate() {
        if (!this.formData.warningLevel || this.formData.warningLevel === "") {
          this.$refs.warningLevelRef.focus();
          message_error(this.$t('AUTOMATION.ERROR.WARNING_LEVEL'));
          return false;
        }
        // if (!this.formData.repeatTimes || this.formData.repeatTimes === "") {
        //   this.$refs.repeatTimesRef.focus();
        //   message_error("请输入重复次数！");
        //   return false;
        // }
        
        // if (!this.formData.notification || this.formData.notification.length ===0) {
        //   message_error(this.$t('AUTOMATION.ERROR.NOTIFY_TYPE'));
        //   return false;
        // }
        return true;
      }
    }
  }
  </script>
  
  <style scoped>
  .alarm-device-box {
    padding: 10px;
    border: 1px solid #4d96e0;
    border-radius: 6px;
  }
  </style>
