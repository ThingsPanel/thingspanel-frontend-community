<template>
    <div class="content-form">
      <el-form>
        <el-row>
          <el-col :xs="16" :sm="18" :md="18" :lg="18" :xl="18">
<!--            <el-form-item label="插件类型：">-->
<!--              <el-radio-group v-model="params.pluginType" size="small" @input="handlePluginTypeChanged">-->
<!--                <el-radio-button label="device">设备插件</el-radio-button>-->
<!--                <el-radio-button label="protocol">协议插件</el-radio-button>-->
<!--              </el-radio-group>-->
<!--            </el-form-item>-->
          </el-col>
          <el-col :xs="8" :sm="6" :md="6" :lg="6" :xl="6" style="display: inline-flex;">
            <el-input style="margin-right: 10px" size="small" clearable v-model="searchValue" :placeholder="$t('COMMON.PLACEHOLDER50')"></el-input>
            <el-button icon="el-icon-refresh" class="primary el-button--indigo" size="mini"
                       :loading="refreshLoading" @click="loadList">{{ $t('COMMON.SEARCH') }}</el-button>
          </el-col>

        </el-row>

<!--        <el-row style="width:100%;display: flex;justify-content: space-between">-->
<!--          <el-col :xs="16" :sm="20" :md="20" :lg="22" :xl="22">-->
<!--            <el-input style="width: 200px" size="small" clearable v-model="searchValue" :placeholder="$t('COMMON.PLACEHOLDER50')"></el-input>-->
<!--          </el-col>-->

<!--          <el-col :xs="8" :sm="4" :md="4" :lg="2" :xl="2">-->
<!--            <el-button icon="el-icon-refresh" class="primary el-button&#45;&#45;indigo"-->
<!--                       :loading="refreshLoading" @click="load">{{ $t('COMMON.THEREFRESH') }}</el-button>-->
<!--          </el-col>-->
<!--        </el-row>-->
      </el-form>
      <div class="width-20" v-for="item in listArr">
        <PluginCard :key="item.id" :data="item" :isInstalled="true" :category="category"
                    @edit="handleEditPlugin"
                    @delete="handleDelPlugin"
        ></PluginCard>
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
      params: {
        total: 0,
        current_page: 1,
        per_page: 10,
        pluginType: ""
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
            this.params = data.data;
            let pluginList = data.data.data;
            this.listArr = pluginList;
            this.refreshLoading = false;

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

@media (max-width: 1068px) {
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