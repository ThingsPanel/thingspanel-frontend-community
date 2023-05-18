<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-30 15:33:41
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-04-03 17:07:52
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\device\components\DevicePlugiSelector.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div>
    <el-popover placement="bottom-start" width="420" trigger="click" @show="showPopover">
      <div>
        <el-input ref="searchInput" v-model="searchText" clearable placeholder="输入插件名称检索"></el-input>

        <el-table :data="pageList" :row-class-name="tableRowClassName">
          <el-table-column width="180" property="name" label="名称" :show-overflow-tooltip="true"></el-table-column>
          <el-table-column width="100" property="author" label="作者"></el-table-column>
          <el-table-column width="100" label="操作">
            <template slot-scope="scope">

              <el-button type="text" size="mini" v-if="scope.row.status === 'install'"
                @click="handleSelect(scope.row)">{{ scope.row.bind ? "已选择" : "选择"}}</el-button>

              <el-button type="text" size="mini" v-if="scope.row.status === 'store'"
                >安装</el-button>

              <el-button type="text" size="mini"  slot="reference" @click="handleView(scope.row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="text-right py-3">
          <el-pagination background layout="prev, pager, next" :total="total" :current-page.sync="params.page"
            :page-size="params.pageSize" @current-change="getList"></el-pagination>
        </div>

        <el-link class="link-create" type="warning" target="_blank" @click.native="handleGoToPlugin">{{
          $t('PLUGIN.MATTER_MODEL_INFO_TAB.BTN') }}</el-link>
        <!-- <el-button type="border-warning" >{{ $t('PLUGIN.MATTER_MODEL_INFO_TAB.BTN') }}</el-button> -->
      </div>
      <el-input size="medium" slot="reference" readonly v-model="data.plugin_name"></el-input>
    </el-popover>
    <device-plugin-detail :visible.sync="showDetailDialog" :id="currentItem.id"></device-plugin-detail>
  </div>
</template>

<script>
import { _debounce } from "@/utils/helpers.js";
import DevicePluginDetail from "./DevicePluginDetail.vue";
const fuzzysort = require('fuzzysort');

export default {
  components: {DevicePluginDetail},
  props: {
    options: {
      type: [Object, Array],
      default: () => {
        return {};
      }
    },
    data: {
      type: [Object, Array],
      default: () => {
        return {};
      }
    }
  },
  data() {
    return {
      searchText: '',
      currentItem: {},
      showDetailDialog: false,
      debounceSearchTextChange: null,
      queryList: [],
      pageList: [],
      total: 30,
      params: {
        page: 1,
        pageSize: 5
      }
    }
  },
  watch: {
    searchText: {
      handler(newValue) {
        if (newValue) {
          this.debounceSearchTextChange();
        }
      },
      immediate: true
    },
    data: {
      handler(newValue) {
        if (newValue.plugin_name) {
          this.searchText = newValue.plugin_name;
        }
      },
      deep: true,
      immediate: true
    }
  },
  created() {
    // 防抖
    this.debounceSearchTextChange = _debounce(this.querySearch, 100);
  },
  methods: {
    getList() {
      const { list, total } = this.createPagination(this.queryList, this.params.page, this.params.pageSize);
      this.pageList = list;
      this.total = total;
    },
    /**
     * @description: 搜索
     * @param {String} searchText
     * @return {Array}
     */
    querySearch() {
      const result = fuzzysort.go(this.searchText, this.options, { keys: ["name", "author"] });
      this.queryList = result.map(item => item.obj);
      this.getList();
    },
    /**
     * @description: 分页
     * @param {Array} list
     * @param {Number} page
     * @param {Number} pageSize
     * @return {Object}
     */
    createPagination(list, page, pageSize) {
      let total = list.length;
      let start = (page - 1) * pageSize;
      let end = page * pageSize;
      let newList = JSON.parse(JSON.stringify(list.slice(start, end)));
      if (this.data && this.data.type) {
        const index = newList.findIndex(item => item.id === this.data.type);
        if (index > -1) {
          newList[index].bind = true;
        }
      }
      return {
        total,
        list: newList
      };
    },
    /**
     * @description: 显示搜索对话框
     * @param {Object} event
     * @return {void}
     */
    showPopover() {
      this.$nextTick(() => {
        console.log("showPopover", this.data.plugin_name)
        this.$refs.searchInput.focus();
        this.debounceSearchTextChange();
      });
    },
    handleSelect(row) {
      this.$emit("select", row, () => {
        console.log("handleSelect", row)
        this.searchText = row.name;
        this.debounceSearchTextChange();
      });
    },
    handleView(row) {
      this.currentItem = row;
      this.showDetailDialog = true;
      console.log("handleView", row);
      // this.$emit("view", row);
    },
    handleGoToPlugin() {
      this.$router.push({ name: "Market", query: { tab: "deviceEditor" } })
    },
    tableRowClassName({row, rowIndex}) {
        if (row.bind) {
          return 'select-row';
        }
        return '';
      }

  }
}
</script>
<style lang="scss" scoped>
.link-create {
  margin: 20px auto 0 20px;
}
::v-deep .el-table tr.el-table__row.select-row {
  background-color:#4758a5!important;
  color: #0af199;
  .el-table td.el-table__cell div {
    color: #0af199;
  }
}
</style>