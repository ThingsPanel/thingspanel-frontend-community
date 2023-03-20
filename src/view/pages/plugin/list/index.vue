<template>
    <div class="content-form">
      <el-form label-position="left" label-width="120px">
           <el-form-item label="插件类型：">
             <el-radio-group v-model="params.pluginType" size="small" @input="handlePluginTypeChanged">
               <el-radio-button label="device">设备插件</el-radio-button>
               <el-radio-button label="script">解析脚本</el-radio-button>
               <el-radio-button label="node-red">规则引擎代码</el-radio-button>
               <el-radio-button label="protocol">协议插件</el-radio-button>
               <el-radio-button label="visual">可视化插件</el-radio-button>
             </el-radio-group>
            </el-form-item>

            <el-form-item label="安装状态：">
              <el-radio-group v-model="params.installationStatus" size="small" @input="handlePluginTypeChanged">
                <el-radio-button label="all">全部</el-radio-button>
                <el-radio-button label="installed">已安装</el-radio-button>
                <el-radio-button label="uninstalled">未安装</el-radio-button>
              </el-radio-group>
             </el-form-item>

             <el-form-item label="搜索：">
                <el-row>
                  <el-col :span="20">
                    <div class="flex">
                      <el-input style="margin-right: 10px;width: 200px" size="small" clearable v-model="searchValue" :placeholder="$t('PLUGIN.TAB1_CONTENT.PLACEHOLDER')"></el-input>
                      <el-button icon="el-icon-refresh" class="primary el-button--indigo" size="mini"
                             :loading="refreshLoading" @click="loadList">{{ $t('PLUGIN.TAB1_CONTENT.SEARCH') }}</el-button>
                    </div>
                    
                  </el-col>

                  <el-col :span="4" class="flex">
                    <el-button :class="params.displayMode=='grid'? 'isActive' : ''" type="border" size="mini" icon="el-icon-s-grid"
                      @click="handleChangeDisplayMode('grid')"></el-button>

                    <el-button :class="params.displayMode=='table'? 'isActive' : ''" type="border" size="mini" icon="el-icon-s-unfold"
                      @click="handleChangeDisplayMode('table')"></el-button>
                  </el-col>
                </el-row>
             </el-form-item>
      </el-form>

      <div v-if="params.displayMode==='grid'">
        <div class="width-20" v-for="(item,index) in listArr" :key="index">
          <PluginCard :key="item.id" :data="item" :isInstalled="true" :category="category"
                      @edit="handleEditPlugin"
                      @delete="handleDelPlugin"
          ></PluginCard>
        </div>
      </div>

      <div v-else>
        <!-- 表 start -->
        <!--
          {
              "id": "4c77118a-5ee4-2483-13c8-9d15f5212473",
              "model_name": "BoshInfoCtrl",
              "flag": 0,
              "chart_data": "{\"info\":{\"pluginCategory\":\"2\",\"pluginName\":\"BoshInfoCtrl\"},\"tsl\":{\"properties\":[{\"dataType\":\"integer\",\"dataRange\":\"0-999\",\"stepLength\":0.1,\"title\":\"继电器\",\"name\":\"powerstate\"}],\"option\":{\"classify\":\"custom\",\"catValue\":\"relay\"}},\"chart\":[{\"componentName\":\"单控开关\",\"type\":\"switch\",\"series\":[{\"type\":\"switch\",\"value\":false,\"id\":1,\"mapping\":{\"value\":\"powerstate\",\"on\":\"1\",\"off\":\"0\",\"attr\":{\"dataType\":\"integer\",\"dataRange\":\"0-999\",\"stepLength\":0.1,\"title\":\"继电器\",\"name\":\"powerstate\"}}}],\"disabled\":false,\"name\":\"继电器\",\"controlType\":\"control\",\"id\":\"M4ZJUuhfcwkN\"}],\"publish\":{\"isPub\":false}}",
              "model_type": "2",
              "sort": 0,
              "issued": 0,
              "created_at": 1678964701
          }
        -->
        <el-form class="inline-edit">
          <el-table :data="listArr" v-loading="loading">

            <!-- 名称 -->
            <el-table-column label="名称" prop="model_name" align="left"></el-table-column>

            <el-table-column label="开发商"  align="left"></el-table-column>

            <el-table-column label="说明"  prop="description" align="left"></el-table-column>

            <el-table-column label="插件分类"  prop="category" align="left"></el-table-column>

            <el-table-column label="安装状态"  prop="category" align="left"></el-table-column>


            <!-- 操作列-->
            <el-table-column align="left" :label="$t('PLUGIN.TAB2_CONTENT.OPERATION')" width="240">
              <template v-slot="scope">
                <div style="text-align: left">
                  <el-button slot="reference" size="mini" type="border">安装</el-button>
                  <el-popconfirm :title="$t('PLUGIN.TAB2_CONTENT.TITLE4')" @confirm="handleDelete(scope.row)">
                    <el-button slot="reference" size="mini" type="danger">卸载</el-button>
                  </el-popconfirm>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-form>
        <!-- 表 end -->

      </div>
      

      <div class="text-right py-3">
        <el-pagination
            background
            layout="prev, pager, next"
            :total="params.total"
            :current-page.sync="params.current_page"
            :page-size="params.per_page"
            @current-change="loadList"></el-pagination>
      </div>
    </div>
</template>

<script>
import PluginCard from "./PluginCard";
import PluginAPI from "@/api/plugin.js";
import ProtocolPlugin from "@/api/protocolPlugin.js";

export default {
  name: "PluginList",
  components: {PluginCard},
  data() {
    return {
      loading: false,
      params: {
        total: 0,
        current_page: 1,
        per_page: 10,
        pluginType: "",
        displayMode: "grid"
      },
      list: [],
      listArr: [],
      searchValue: '',
      category: [],
      refreshLoading: false,
      imgArr: [
        "media/logos/wsd.png",
        "media/logos/gps.png",
        "media/logos/switch.png",
        "media/logos/temperature.png",
        "media/logos/en.png",
        "media/logos/qxz.png",
        "media/logos/qxz.png",
        "media/logos/yy.png",
        "media/logos/switch.png",
      ]
    }
  },
  created() {
    this.loadList();
  },
  watch: {
    searchValue(newVal) {
      this.debounce(this.searchPlugin, 500, newVal)
    }
  },
  methods: {
    /**
     * 加载插件列表
     */
    loadList() {
      this.refreshLoading = true;
      PluginAPI.category({"current_page": 1, "per_page": 9999, "dict_code": "chart_type"})
          .then(({data}) => {
            if (data.code == 200) {
              this.category = data.data.data;
              this.loadDevicePluginList();
            }
          })
    },
    /**
     * 获取设备插件列表
     */
    loadDevicePluginList() {
      // 加载插件列表
      PluginAPI.page(this.params)
        .then(({data}) => {
          if (data.code == 200) {
            this.params.total = data.data?.total || 0;
            this.params.current_page = data.data?.current_page || 1;
            this.params.per_page = data.data?.per_page || 10;

            let pluginList = data.data?.data || [];
            this.listArr = pluginList;
            this.refreshLoading = false;
            console.log(this.listArr);

          }
        })
    },
    /**
     * 获取协议插件列表
     */
    loadProtocolPluginList() {
      let params = { current_page: this.params.current_page, per_page: this.params.per_page }
      ProtocolPlugin.page(params)
          .then(({ data }) => {
            if (data.code == 200) {
              this.loading = false;
              this.params = data.data;
            }
          })
    },
    handleEditPlugin(item) {
      this.$emit("edit", item);
    },
    handleDelPlugin(item) {
      this.load();
    },
    searchPlugin(value) {
      if (value == "") {
        this.listArr = this.list;
      } else {
        this.listArr = this.list.filter(item => item.name.indexOf(this.searchValue) > -1);
      }
    },
    handleChangeDisplayMode(mode) {
      this.params.displayMode = mode;
    },
    /**
     * 插件类型
     * @param v
     */
    handlePluginTypeChanged(v) {

    },
    /**
     * 防抖
     * @param callback
     * @param delay
     * @param value
     */
    debounce: function (callback, delay, value) {
      if (timer == 1) return;
      setTimeout(() => timer = null, delay)
      timer = 1;
      callback(value);
    }
  }
}
let timer = null;
</script>

<style scoped>
.el-form-item {
  margin-bottom: 0;
}
::v-deep .el-button--border.isActive {
  background-color: #6573e0 !important;
  border-color: #6573e0 !important;
}
.width-20 {
  width: 20%;
  display: inline-block;
  padding: 10px;
}


@media (max-width: 1500px) {
  .width-20 {
    width: 25%;
  }
}

@media (max-width: 1424px) {
  .width-20 {
    width: 33%;
  }
}

@media (max-width: 1160px) {
  .width-20 {
    width: 50%;
    display: inline-block;
    padding: 10px;
  }
}

@media (max-width: 580px) {
  .width-20 {
    width: 100%;
    display: block;
    padding: 0px;
  }
}
</style>