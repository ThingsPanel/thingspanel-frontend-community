<template>
    <div class="content-form">

      <el-row style="width:100%;display: flex;justify-content: space-between">
        <el-col :xs="16" :sm="20" :md="20" :lg="22" :xl="22">
          <el-input style="width: 200px" clearable v-model="searchValue" placeholder="请输入插件名称"></el-input>
        </el-col>

        <el-col :xs="8" :sm="4" :md="4" :lg="2" :xl="2">
          <el-button icon="el-icon-refresh" class="primary el-button--indigo"
                     :loading="refreshLoading" @click="load">刷新</el-button>
        </el-col>
      </el-row>

      <div class="width-20" v-for="item in listArr">
        <PluginCard :key="item.id" :data="item" :isInstalled="true" :category="category"
                    @edit="handleEditPlugin"
                    @delete="handleDelPlugin"
        ></PluginCard>
      </div>
    </div>
</template>

<script>
import PluginCard from "./PluginCard";
import PluginAPI from "@/api/plugin.js";

export default {
  name: "Installed",
  components: {PluginCard},
  data() {
    return {
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
    this.load();
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
    load() {
      this.refreshLoading = true;
      PluginAPI.category({"current_page": 1, "per_page": 9999, "dict_code": "chart_type"})
          .then(({data}) => {
            if (data.code == 200) {
              this.category = data.data.data;
              this.loadList();
            }
          })
    },
    loadList() {
      // 加载插件列表
      PluginAPI.page({"current_page": 1, "per_page": 9999})
        .then(({data}) => {
          if (data.code == 200) {
            let pluginList = data.data.data;
            this.listArr = pluginList;
            this.refreshLoading = false;

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


@media (max-width: 1400px) {
  .width-20 {
    width: 25%;
  }
}

@media (max-width: 1200px) {
  .width-20 {
    width: 33%;
  }
}

@media (max-width: 768px) {
  .marketbox {
    max-width: unset !important;
  }
  .width-20 {
    width: 50%;
    display: inline-block;
    padding: 10px;
  }
}

@media (max-width: 500px) {
  .width-20 {
    width: 100%;
    display: block;
    padding: 0px;
  }
}
</style>