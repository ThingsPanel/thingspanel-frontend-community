<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-02 08:39:13
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-29 15:41:47
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\time\RepeatTimeSelector.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div style="display: flex">
    <el-select ref="typeRef" style="width: 100px;margin-right:10px" v-model="formData.type" @change="handleTypeChange">
      <el-option :label="$t('AUTOMATION.PERHOUR')" value="perHour"></el-option>
      <el-option :label="$t('AUTOMATION.DAYS')" value="days"></el-option>
      <el-option :label="$t('AUTOMATION.WEEKLY')" value="weekly"></el-option>
      <el-option :label="$t('AUTOMATION.MONTHLY')" value="monthly"></el-option>
      <el-option :label="$t('AUTOMATION.CUSTOM_CRON')" value="cron"></el-option>
    </el-select>

    <div style="display:flex;" v-if="formData.type=='perHour'">
      <el-input ref="perHourRef"  v-model="formData.perHour" @change="handlePerHourChange"></el-input>
      <el-tooltip placement="top">
        <div slot="content">{{ $t('AUTOMATION.TIP.PERHOUR') }}</div>
        <i class="el-icon-info" style="margin:10px;"></i>
      </el-tooltip>
    </div>
    
    <div style="display:flex;" v-else-if="formData.type=='days'">
      <!-- <el-time-select ref="daysRef" step='00:15' v-model="formData.days" placeholder="选择时间" @change="handleDaysChange"></el-time-select> -->
      <el-time-picker ref="daysRef" value-format="HH:mm"
          v-model="formData.days" :placeholder="$t('AUTOMATION.PLACEHOLDER.SELECT_TIME')" 
          @change="handleDaysChange"></el-time-picker>
      <el-tooltip placement="top">
        <div slot="content">{{ $t('AUTOMATION.TIP.DAYS') }}</div>
        <i class="el-icon-info" style="margin:10px;"></i>
      </el-tooltip>
    </div>

    <div style="display:flex;" v-else-if="formData.type=='weekly'">
      <WeeklySelector ref="weeklyRef" :data="formData.weekly" @change="handleWeeklyChange"/>
      <el-tooltip placement="top">
        <div slot="content">{{ $t('AUTOMATION.TIP.WEEKLY') }}</div>
        <i class="el-icon-info" style="margin:10px;"></i>
      </el-tooltip>
    </div>

    <div style="display:flex;" v-else-if="formData.type=='monthly'">
      <MonthlySelector ref="monthlyRef" :data="formData.monthly" @change="handleMonthlyChange"/>
      <el-tooltip placement="top">
        <div slot="content">{{ $t('AUTOMATION.TIP.MONTHLY') }}</div>
        <i class="el-icon-info" style="margin:10px;"></i>
      </el-tooltip>
    </div>


    <div style="display:flex;" v-if="formData.type=='cron'">
      <el-input ref="cronRef"  v-model="formData.cron" @change="handleCronChange"></el-input>

      <el-tooltip placement="top">
        <div slot="content">
          <span style="margin-right:20px">0/2 * * * *</span><span>{{ $t('AUTOMATION.TIP.CRON.LINE1') }}</span><br/>
          <span style="margin-right:20px">0 0/2 * * *</span><span>{{ $t('AUTOMATION.TIP.CRON.LINE2') }}</span><br/>
          <span style="margin-right:20px">15 10 * * *</span><span>{{ $t('AUTOMATION.TIP.CRON.LINE3') }}</span><br/>
          <span style="margin-right:20px">0/5 14 * * *</span><span>{{ $t('AUTOMATION.TIP.CRON.LINE4') }}</span><br/>
          <span style="margin-right:20px">0/5 14,18 * * *</span><span>{{ $t('AUTOMATION.TIP.CRON.LINE5') }}</span><br/>
          <span style="margin-right:20px">15 10 ? *</span><span>{{ $t('AUTOMATION.TIP.CRON.LINE6') }}</span><br/>
          <span style="margin-right:20px">15 10 15 * *</span><span>{{ $t('AUTOMATION.TIP.CRON.LINE7') }}</span>                                        
        </div>
        <i class="el-icon-info" style="margin:10px;"></i>
      </el-tooltip>
    </div>
    
    
  </div>
</template>

<script>
import WeeklySelector from "./WeeklySelector";
import MonthlySelector from "./MonthlySelector";
import { message_error } from '@/utils/helpers';
const cronTip = "0/2 * * * * 每2分钟触发\n"
  + "0 0/2 * * * 每两小时触发<br/>" 
  + "15 10 * * * 每天上午的10:15触发<br/>"
  + "0/5 14 * * *   在每天下午2点到下午2:55期间的每5分钟触发<br/>"
  + "0/5 14,18 * * *      在每天下午2点到2:55期间和下午6点到6:55期间的每5分钟触发<br/>"
  + "15 10 ? * MON-FRI   周一至周五的上午10:15触发<br/>"
  + "15 10 15 * *  每月15日上午10:15触发"

export default {
  name: "RepeatTimeSelector",
  components: { WeeklySelector, MonthlySelector },
  props: {
    data: {
      type: [Object],
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      cronTip,
      formData: {
        type: "",
        perHour: "",
        day: "",
        weekly: {},
        monthly: {},
        cron: ""
      },
    }
  },
  watch: {
    data: {
      handler(newValue) {
        if (newValue) {
          console.log("RepeatTimeSelector", newValue);
          this.formData = JSON.parse(JSON.stringify(newValue));
        }
      },
      immediate: true
    }
  },
  methods: {
    /**
     * @description: 类型改变
     * @param {*} v
     * @return {*}
     */
     handleTypeChange(v) {
      this.$emit("change", { type: v })
    },
    /**
     * @description: 每小时
     * @param {*} v
     * @return {*}
     */
     handlePerHourChange(v) {
      this.$emit("change", { type: "perHour", perHour: v})
    },
    /**
     * @description: 每天
     * @param {*} v
     * @return {*}
     */
    handleDaysChange(v) {
      console.log("handleDaysChange")
      this.$emit("change", { type: "days", days: v });
    },
    /**
     * @description: 每周
     * @param {*} v
     * @return {*}
     */
    handleWeeklyChange(v) {
      this.$emit("change", { type: "weekly", weekly: v });
    },
    /**
     * @description: 每月
     * @param {*} v
     * @return {*}
     */
    handleMonthlyChange(v) {
      this.$emit("change", { type: "monthly", monthly: v });
    },
    /**
     * @description: cron
     * @param {*} v
     * @return {*}
     */    
    handleCronChange(v) {
      this.$emit("change", { type: "cron", cron: v})
    },
    /**
     * @description: 验证
     * @return {*}
     */    
    validate() {
      if (!this.formData.type || this.formData.type === "") {
        this.$refs.typeRef.focus();
        message_error(this.$t('AUTOMATION.ERROR.DATE_TYPE'));
        return false;
      }
      if (this.formData.type==='perHour' && (!this.formData.perHour || this.formData.perHour==="")) {
        this.$refs.perHourRef.focus();
        message_error(this.$t('AUTOMATION.ERROR.PERHOUR'));
        return false;
      }
      if (this.formData.type==='days' && (!this.formData.days || this.formData.days==="")) {
        this.$refs.daysRef.focus();
        message_error(this.$t('AUTOMATION.ERROR.DAYS'));
        return false;
      }
      if (this.formData.type==='cron' && (!this.formData.cron || this.formData.cron==="")) {
        this.$refs.cronRef.focus();
        message_error(this.$t('AUTOMATION.ERROR.CRON'));
        return false;
      }
      if (this.$refs.weeklyRef && !this.$refs.weeklyRef.validate()) {
        return false;
      }
      if (this.$refs.monthlyRef && !this.$refs.monthlyRef.validate()) {
        return false;
      }
      return true;
    }
  }
}
</script>

<style scoped>

</style>