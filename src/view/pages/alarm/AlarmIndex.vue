<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-07 10:02:17
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-21 17:56:48
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
          value-format="timestamp"
          @change="handleSearch()" @clear="handleSearch()" type="datetimerange"
          :start-placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER5')" :range-separator="$t('DATA_MANAGEMENT.PLACEHOLDER6')"
          :end-placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER7')">
        </el-date-picker>
      </el-col>

      <el-col :span="12" class="text-right">
        <el-select v-model="params.warningLevel" placeholder="报警级别" clearable @change="handleSearch">
          <el-option value="low" label="低"></el-option>
          <el-option value="medium" label="中"></el-option>
          <el-option value="high" label="高"></el-option>
        </el-select>

        <el-select v-model="params.processing_result" placeholder="是否处理" clearable  @change="handleSearch">
          <el-option :value="ProcessingState.unprocessed" label="未处理"></el-option>
          <el-option :value="ProcessingState.processed" label="已处理"></el-option>
          <el-option :value="ProcessingState.ignored" label="已忽略"></el-option>

        </el-select>
      </el-col>
    </el-row>

    <!-- 表 start -->
    <el-table :data="tableData" v-loading="loading">
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
          {{ scope.row.processing_result == ProcessingState.processed ? "已处理" : "未处理" }}
        </template>
      </el-table-column>
      <el-table-column label="处理人" prop="handler" width="180"></el-table-column>

      <el-table-column label="操作" width="240" align="center">
        <template v-slot="scope">
          <div class="text-right">
            <el-button type="yellow" size="mini">详情</el-button>

            <!-- 处理 -->
            <el-button type="border" size="mini"  v-if="scope.row.processing_result !== ProcessingState.processed"
                  @click="handleProcessing(scope.row, ProcessingState.processed)">处理</el-button>

            <el-button size="mini" v-if="scope.row.processing_result !== ProcessingState.ignored"
                  @click="handleProcessing(scope.row, ProcessingState.ignored)">忽略</el-button>

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
      <el-pagination background layout="prev, pager, next" :total="total" :current-page.sync="params.current_page"
        :page-size="params.per_page" @current-change="getAlarmList"></el-pagination>
    </div>

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
import AlarmAPI from "@/api/alarm";
import "@/core/mixins/common"
export default {
  name: "AlarmIndex",
  components: { TableTitle },
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      params: {
        dateTimeRange: [],
        warningLevel: "",
        processing_result: "",
        current_page: 1,
        per_page: 10
      },
      DatePickerOptions: [],
      ProcessingState
    }
  },
  created() {
    this.getAlarmList();
  },
  methods: {
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
    getAlarmList() {
      AlarmAPI.list(this.params)
        .then(({ data: result }) => {
          if (result.code === 200) {
            console.log(result.data)
            this.tableData = result.data?.data || [];
            this.total = result.data.total;
          }
        })
    },
    handleProcessing(row, value) {
      const params = {
        id: row.id,
        processing_result: value,
        processing_instructions: ""
      };

      AlarmAPI.process(params)
        .then(({ data: result }) => {
          if (result.code === 200) {
            this.getAlarmList();
            console.log(result)
          }
        })
    }

  }
}
</script>