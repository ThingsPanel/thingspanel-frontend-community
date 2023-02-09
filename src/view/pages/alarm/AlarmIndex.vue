<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-07 10:02:17
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-07 11:16:13
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\alarm\index.vue
 * @Description: 告警信息列表
-->
<template>
    <div class="rounded card p-4">
      <el-row type="flex" :gutter="20" class="pt-3 pb-3 px-3">
        <el-col :span="12">
          <TableTitle>{{ $t("ALARM.WARNINFO")}}</TableTitle>
        </el-col>
      </el-row>
    
      <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3 el-dark-input">
        <!--  日期筛选  -->
        <el-col :span="12">
          <el-date-picker
              class="w-100"
              v-model="dateTimeRange"
              :picker-options="DatePickerOptions"
              @change="handleSearch()"
              @clear="handleSearch()"
              type="datetimerange"
              :start-placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER5')"
              :range-separator="$t('DATA_MANAGEMENT.PLACEHOLDER6')"
              :end-placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER7')">
          </el-date-picker>
        </el-col>
    
        <el-col :span="12" class="text-right">
          <el-select v-model="alarmPriority" placeholder="报警级别">
            <el-option></el-option>
           </el-select>
  
           <el-select v-model="isHandle" placeholder="是否处理">
            <el-option></el-option>
           </el-select>
        </el-col>
      </el-row>
    
      <!-- 表 start -->
      <el-table :data="tableData" v-loading="loading">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column :label="$t('ALARM.ALARMTIME')" prop="created_at" width="180" ></el-table-column>
        <el-table-column label="告警名称" prop="alarm_name" width="220"></el-table-column>
        <el-table-column label="级别" prop="priority" width="60"></el-table-column>
        <el-table-column label="告警描述" prop="describe" :show-overflow-tooltip="true" width="auto">
          <template v-slot="scope">
            <p class="table-describe mad">{{ scope.row.describe }}</p>
          </template>
        </el-table-column>

        <el-table-column label="处理时间" prop="updated_at" width="180" ></el-table-column>
        <el-table-column label="处理结果" prop="handle_result" width="180" >
          <template v-slot="scope">
            {{ scope.row.handle_result == '1' ? "已处理" : "未处理" }}
          </template>
        </el-table-column>
        <el-table-column label="处理人" prop="handler" width="180" ></el-table-column>

        <el-table-column label="操作" width="240" align="center">
          <template v-slot="scope">
            <div class="text-right">
              <el-button type="yellow" size="mini">详情</el-button>
  
              <!-- 处理 -->
              <el-button type="border" size="mini" @click="handleProcessing(scope.row)">处理</el-button>
  
              <el-button size="mini" v-if="scope.row.handle_result !== '1'" @click="handleIgnore(scope.row)">忽略</el-button>
  
            </div>
          </template>
        </el-table-column>
      </el-table>
      <!-- 表 end -->
    
      <div class="text-left py-3">
        <el-button size="mini" type="yellow">批量忽略</el-button>
        <el-button size="mini" type="border">批量处理</el-button>
      </div>
      <div class="text-right py-3">
        <el-pagination
            background
            layout="prev, pager, next"
            :total="total"
            :current-page.sync="params.page"
            :page-size="params.limit"
            @current-change="getAlarmList"></el-pagination>
      </div>
    
    </div>
    </template>

<script>
import TableTitle from "@/components/common/TableTitle.vue"
import data from "./data"
export default {
    name: "AlarmIndex",
    components: { TableTitle },
    data() {
        return {
            tableData: [],
            total: 0,
            params: {
                page: 1,
                limit: 10
            },
            dateTimeRange: "",
            DatePickerOptions: []
        }
    },
    created() {
      this.getAlarmList();
    },
    methods: {
        getAlarmList() {
            this.tableData = JSON.parse(JSON.stringify(data));
        },
        handleProcessing(row) {

        },
        handleIgnore(row) {
          
        }
    }
}
</script>