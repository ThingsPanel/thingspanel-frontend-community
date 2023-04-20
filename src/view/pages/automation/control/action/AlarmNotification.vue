<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-03 13:36:48
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-10 16:25:55
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\alarm\AlarmPanel.vue
 * @Description: 
-->
<template>
    <div>
  <!--    <el-form label-position="right" label-width="85px">-->
        <el-form-item :label="$t('AUTOMATION.WARNING_LEVEL')" required>
            <el-select ref="warningLevelRef" style="width: 100px;" v-model="formData.warningLevel" @change="handleChange">
                <el-option :label="$t('AUTOMATION.WARNING_LEVEL_LOW')" :value="'1'"></el-option>
                <el-option :label="$t('AUTOMATION.WARNING_LEVEL_MEDIUM')" :value="'2'"></el-option>
                <el-option :label="$t('AUTOMATION.WARNING_LEVEL_HIGH')" :value="'3'"></el-option>
              </el-select>
        </el-form-item>

        <el-form-item :label="$t('AUTOMATION.NOTIFY_USER')">
          <div style="display: flex;margin-bottom: 10px" v-for="(group, index) in formData.groups" :key="index">
  
            <el-select style="width: 100px;margin-right:10px" v-model="group.role" @change="handleRoleChange">
              <el-option v-for="(role, index) in roleList" :key="index" :label="role.role_name" :value="role.id"></el-option>
            </el-select>

            <el-select style="width: auto;margin-left: 10px;margin-right:10px" multiple v-model="group.users" @change="handleChange">
              <el-option :label="$t('AUTOMATION.ALL_USER')" :value="'all'"></el-option>

            </el-select>

  
            <!-- 新增一行 -->
            <el-button type="indigo" size="small" style="margin-left: auto"
                       v-if="index == 0"
                       @click="handleAddGroup">{{ $t('AUTOMATION.ADD_LINE') }}</el-button>
  
            <!-- 删除 -->
            <el-button type="danger" size="small" style="margin-left: auto"
                       v-if="index > 0"
                       @click="handleDeleteGrouop(group)">{{ $t('AUTOMATION.DELETE') }}</el-button>
  
          </div>
        </el-form-item>

        <el-form-item :label="$t('AUTOMATION.REPEAT_TIMES')">
          <el-input ref="repeatTimesRef" v-model="formData.repeatTimes" :placeholder="$t('AUTOMATION.PLACEHOLDER.ALARM_REPEAT_TIMES')" @change="handleChange"></el-input>
        </el-form-item>

        <el-form-item :label="$t('AUTOMATION.NOTIFY_TYPE')" required>
          <el-checkbox-group v-model="formData.notification" @change="handleChange">
            <el-checkbox label="wechat">{{ $t('AUTOMATION.WECHAT') }}</el-checkbox>
            <el-checkbox label="sms">{{  $t('AUTOMATION.SMS') }}</el-checkbox>
            <el-checkbox label="email">{{  $t('AUTOMATION.EMAIL') }}</el-checkbox>
            <el-checkbox label="phone">{{ $t('AUTOMATION.PHONE')}}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item :label="$t('AUTOMATION.ALARM_DESCRIPTION')">
          <el-input v-model="formData.warning_description" :placeholder="$t('AUTOMATION.ALARM_DESCRIPTION')" @change="handleChange"></el-input>
        </el-form-item>
  
  <!--    </el-form>-->
    </div>
  </template>
  
  <script>
  import { user_find_all_roles } from "@/api/user"
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
            groups: [
                {}
            ],
            notification: []
        },
        roleList: []
      }
    },
    created() {
      this.getRoleList();
    },
    watch: {
      data: {
        handler(newValue) {
          if (newValue && JSON.stringify(newValue) !== "{}") {
            this.formData = JSON.parse(JSON.stringify(newValue));
            console.log("alarm.formData", this.formData)
            if (!this.formData.groups || this.formData.groups.length === 0) {
              this.formData.groups = [{}];
            }
          }
        }, immediate: true
      },
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
        user_find_all_roles({ current_page: 1, per_page: 36 })
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
        
        if (!this.formData.notification || this.formData.notification.length ===0) {
          message_error(this.$t('AUTOMATION.ERROR.NOTIFY_TYPE'));
          return false;
        }
        return true;
      }
    }
  }
  </script>
  
  <style scoped>
  
  </style>