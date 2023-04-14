<template>
  <div class="controller-container" id="recordBox">
    <div class="calendar-select">
      <!-- 年 -->
      <el-select class="year" size="mini" v-model="year" @change="handleChangeDate">
        <el-option v-for="year in getYearList()" :key="year" :label="year" :value="year"></el-option>
      </el-select>

      <!-- 月 -->
      <el-select class="month" size="mini" v-model="month" @change="handleChangeDate">
        <el-option v-for="month in getMonthList()" :key="month" :label="month + '月'" :value="month"></el-option>
      </el-select>

      <!-- 日历 -->
      <el-calendar v-model="value">
      </el-calendar>
    </div>

    <!-- 录像列表 -->
    <div class="record-list" v-if="showRecordList">
      <template v-if="records && records.length > 0">
        <div class="record-item" v-for="(record, index) in records" :key="index">
          <div class="item-left">
            {{ record.startTime.substr(11) + "-" + record.endTime.substring(11) }}
          </div>
          <div class="item-right">
            <el-button size="mini" round icon="el-icon-caret-right" :disabled="playDisabled" @click="handlePlayRecord(record)"></el-button>
          </div>
        </div>
      </template>
      <template v-else><el-empty description="暂无数据" :image-size="20"></el-empty></template>
    </div>

  </div>
</template>

<script>
export default {
  name: "RecordController",
  props: {
    records: {
      type: [Array],
      default: () => []
    },
    showRecordList: {
      type: [Boolean],
      default: true
    },
    playDisabled: {
      type: [Boolean],
      default: false
    }
  },
  data() {
    return {
      value: new Date(),
      year: (new Date()).getFullYear(),
      month: (new Date()).getMonth() + 1,
    }
  },
  watch: {
    value: {
      handler(newValue) {
        if (newValue) {
          let timestamp = Date.parse(newValue);
          let d = new Date(timestamp);
          let year = d.getFullYear();
          let month = d.getMonth() + 1;
          let day = d.getDate();
          let date = year + "-" + month + "-" + day;
          this.$emit("change-date", date);
        }
      },
      immediate: true
    }
  },
  mounted() {

  },
  methods: {
    /**
     * 获取年列表
     * @returns {*[]}
     */
    getYearList() {
      let years = [];
      let currentYear = (new Date()).getFullYear();
      for (let i = 2000; i <= Number(currentYear); i++) {
        years.push(i);
      }
      return years.reverse();
    },
    /**
     * 获取月列表
     * @returns {*[]}
     */
    getMonthList() {
      let months = [];
      for (let i = 1; i <= 12; i++) {
        months.push(i);
      }
      return months;
    },
    /**
     * 更改年和月
     */
    handleChangeDate() {
      this.value = this.year + "-" + this.month;
    },
    /**
     * 点击播放按钮
     * @param record
     */
    handlePlayRecord(record) {
      console.log("RecordController.handlePlayRecord", record)
      this.$emit("play", record);
    }
  }
}
</script>

<style scoped lang="scss">
.controller-container{
  position: relative;
  width: 100%;
  height: 100%;
  .calendar-select {
    margin: 10px;
    padding: 4px;
    border: 1px solid #dadada;
    ::v-deep .year.el-select.el-select--mini  {
      float: left;
    }
    ::v-deep .month.el-select.el-select--mini  {
      float: right;
    }
    ::v-deep .el-select.el-select--mini {
      width: 73px;
      margin: 2px;
      .el-input__inner {
        font-size: 10px!important;
      }
    }
    ::v-deep .el-calendar {
      .el-calendar__body {
        padding: 0;
      }
      table.el-calendar-table {
        border: 1px solid rgba(91, 146, 255, 0.15) !important;
      }
      .el-calendar__header {
        display: none!important;
      }
      .el-calendar-table .el-calendar-day {
        padding: 1px;
        height: 22px;
      }
      .el-calendar-table thead th {
        padding: 0;
      }
      .current .el-calendar-day span {
        color: #000;
      }
      .el-calendar-table td.is-selected {
        color: #fff;
        background-color: #409EFF;
      }
      table th, table td {
        border: unset!important;
        border-top: unset !important;
        border-bottom: unset !important;
        font-size: 13px !important;
      }
    }
  }
  .record-list {
    position: absolute;
    width: calc(100% - 20px);
    //height: calc(100% - 200px);
    top: 200px;
    bottom: 10px;
    margin: 10px;
    padding: 10px;
    border: 1px solid #dadada;
    overflow-y: auto;
    .record-item {
      padding: 4px;
      .item-left {
        float: left;
      }
      .item-right {
        float: right;
        .el-button--mini, .el-button--mini.is-round {
          padding: 0px;
        }
      }
    }
    .record-item::after {
      content: "";
      display: block;
      visibility: hidden;
      clear: both;
    }
  }
}

</style>