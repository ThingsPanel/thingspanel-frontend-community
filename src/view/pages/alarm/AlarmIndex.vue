<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-07 10:02:17
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-28 16:00:50
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\alarm\index.vue
 * @Description: 告警信息列表
-->
<template>
  <div class="rounded card p-4">
    <el-row type="flex" :gutter="20" class="pt-3 pb-3 px-3">
      <el-col :span="12">
        <TableTitle>{{ $t("ALARM.WARNINFO") }}</TableTitle>
      </el-col>
    </el-row>

    <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3 el-dark-input">
      <!--  日期筛选  -->
      <el-col :span="12">
        <el-date-picker class="w-100" v-model="params.dateTimeRange" :picker-options="DatePickerOptions"
          value-format="timestamp" @change="handleSearch()" @clear="handleSearch()" type="datetimerange"
          :start-placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER5')" :range-separator="$t('DATA_MANAGEMENT.PLACEHOLDER6')"
          :end-placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER7')">
        </el-date-picker>
      </el-col>

      <el-col :span="12" class="text-right">
        <el-select style="margin-right:10px" v-model="params.warningLevel" placeholder="报警级别" clearable @change="handleSearch">
          <el-option value="low" label="低"></el-option>
          <el-option value="medium" label="中"></el-option>
          <el-option value="high" label="高"></el-option>
        </el-select>

        <el-select v-model="params.processing_result" placeholder="是否处理" clearable @change="handleSearch">
          <el-option :value="ProcessingState.unprocessed" label="未处理"></el-option>
          <el-option :value="ProcessingState.processed" label="已处理"></el-option>
          <el-option :value="ProcessingState.ignored" label="已忽略"></el-option>

        </el-select>
      </el-col>
    </el-row>

    <!-- 表 start -->
    <el-table :data="tableData" v-loading="loading" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column :label="$t('ALARM.ALARMTIME')" prop="created_at" width="180">
        <template v-slot="scope">
          {{ formatDate(scope.row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="告警名称" prop="warning_name" width="220"></el-table-column>
      <el-table-column label="级别" prop="warning_level" width="60"></el-table-column>
      <el-table-column label="告警描述" prop="warning_description" :show-overflow-tooltip="true" width="auto">
        <template v-slot="scope">
          <p class="table-describe mad">{{ scope.row.describe }}</p>
        </template>
      </el-table-column>

      <el-table-column label="处理时间" prop="updated_at" width="180"></el-table-column>
      <el-table-column label="处理结果" prop="handle_result" width="180">
        <template v-slot="scope">
          <p v-if="scope.row.processing_result == ProcessingState.processed">已处理</p>
          <p v-if="scope.row.processing_result == ProcessingState.unprocessed">未处理</p>
          <p v-if="scope.row.processing_result == ProcessingState.ignored">已忽略</p>
        </template>
      </el-table-column>
      <el-table-column label="处理人" prop="handler" width="auto"></el-table-column>

      <el-table-column label="操作" width="240" align="center">
        <template v-slot="scope">
          <div class="text-right">
            <el-button type="yellow" size="mini" @click="handleShowDetail(scope.row)">详情</el-button>

            <!-- 处理 -->
            <el-button type="border" size="mini" v-if="scope.row.processing_result == ProcessingState.unprocessed"
              @click="handleShowProcess(scope.row)">处理</el-button>

            <el-button size="mini" v-if="scope.row.processing_result == ProcessingState.unprocessed"
              @click="handleIgnored(scope.row)">忽略</el-button>

          </div>
        </template>
      </el-table-column>
    </el-table>
    <!-- 表 end -->

    <div class="text-left py-3">
      <el-button size="mini" type="border" @click="handleShowBatchProcessing">批量处理</el-button>
      <el-button size="mini" type="yellow" @click="handleIgnored(selectRows)">批量忽略</el-button>
    </div>
    <div class="text-right py-3">
      <el-pagination background layout="prev, pager, next" 
        :total="total" 
        :current-page.sync="params.current_page"
        :page-size="params.per_page" 
        @current-change="getAlarmList">
      </el-pagination>
    </div>

    <AlarmDetail :visible.sync="detailDialogVisible" :data="currentItem"></AlarmDetail>

    <AlarmProcess :visible.sync="processDialogVisible" :data="currentItem" 
      @change="processing"></AlarmProcess>

  </div>
</template>

<script>
const ProcessingState = {
  all: "all",
  unprocessed: "0",
  processed: "1",
  ignored: "2"
}
import TableTitle from "@/components/common/TableTitle.vue"
import AlarmDetail from "./AlramDetail.vue"
import AlarmProcess from "./AlarmProcess.vue"
import AlarmAPI from "@/api/alarm";
import "@/core/mixins/common"
import { message_success } from "../../../utils/helpers";
export default {
  name: "AlarmIndex",
  components: { TableTitle, AlarmDetail, AlarmProcess },
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      // 已选择的行
      selectRows: [],
      params: {
        dateTimeRange: [],
        warningLevel: "",
        processing_result: "",
        current_page: 1,
        per_page: 10
      },
      DatePickerOptions: [],
      ProcessingState,
      detailDialogVisible: false,
      processDialogVisible: false,
      currentItem: {}
    }
  },
  created() {
    this.getAlarmList();
  },
  methods: {
    /**
     * @description: 查询
     * @return {*}
     */    
    handleSearch() {
      if (this.params.dateTimeRange && this.params.dateTimeRange.length > 0 &&
        this.params.dateTimeRange[0] !== "" && this.params.dateTimeRange[1] !== "") {
        this.params.start_time = this.params.dateTimeRange[0].toString().substring(0, 10);
        this.params.end_time = this.params.dateTimeRange[1].toString().substring(0, 10);
      } else {
        delete this.params.start_time;
        delete this.params.end_time;
      }
      this.getAlarmList();
    },
    /**
     * @description: 获取告警列表
     * @return {*}
     */    
    getAlarmList() {
      console.log("getAlarmList", this.params)
      AlarmAPI.list(this.params)
        .then(({ data: result }) => {
          if (result.code === 200) {
            console.log(result.data)
            this.tableData = result.data?.data || [];
            this.total = result.data.total;
          }
        })
    },
    /**
     * @description: 显示详情对话框
     * @param {*} row
     * @return {*}
     */    
    handleShowDetail(row) {
      this.currentItem = row;
      this.detailDialogVisible = true;
    },
    /**
     * @description: 显示处理对话框
     * @param {*} row
     * @return {*}
     */    
    handleShowProcess(row) {
      this.currentItem = row;
      this.processDialogVisible = true;
    },
    /**
     * @description: 显示批量处理
     * @return {*}
     */    
    handleShowBatchProcessing() {
      console.log(this.selectRows)
      this.currentItem = this.selectRows;
      this.processDialogVisible = true;
    },
    /**
     * @description: 处理
     * @param {*} row
     * @param {*} value
     * @return {*}
     */    
    processing(args, value = ProcessingState.processed) {
      let params = {
        id: args.id,
        processing_result: value,
        processing_instructions: args.processing_instructions || ""
      };
      if (Object.prototype.toString.call(args.id) === '[object Array]') {
        // 批量
        AlarmAPI.batchProcess(params)
          .then(({ data: result }) => {
            if (result.code === 200) {
              this.getAlarmList();
              message_success(value === ProcessingState.processed ? "已处理" : "已忽略")
            }
          })
      } else {
        // 单个
        AlarmAPI.process(params)
          .then(({ data: result }) => {
            if (result.code === 200) {
              this.getAlarmList();
              message_success(value === ProcessingState.processed ? "已处理" : "已忽略")
            }
          })
      }
    },
    /**
     * @description: 多选
     * @param {*} rows
     * @return {*}
     */    
    handleSelectionChange(rows) {
      this.selectRows = rows;
    },
    /**
     * @description: 忽略
     * @param {*} rows
     * @return {*}
     */    
    handleIgnored(rows) {
      if (Object.prototype.toString.call(rows) === '[object Array]') {
        // 批量
        this.processing({ id: rows.map(row => row.id) }, ProcessingState.ignored);
      } else {
        this.processing({ id: rows.id }, ProcessingState.ignored);
      }
    }
  }
}
</script>