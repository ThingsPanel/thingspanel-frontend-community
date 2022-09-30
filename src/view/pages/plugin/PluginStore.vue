<template>
    <div class="content-form">

      <el-form :inline="true">
        <el-form-item style="width: 200px">
          <el-input style="width: 200px" clearable v-model="searchValue" placeholder="请输入插件名称"></el-input>
        </el-form-item>
      </el-form>

      <div class="width-20" v-for="item in listArr">
        <PluginCard :data="item" :isInstalled="item.isInstalled" @installed="handleInstalled"></PluginCard>
      </div>
    </div>
</template>

<script>
import AUTH from "@/core/services/store/auth.module";
import ApiService from "@/core/services/api.service";
import PluginCard from "./PluginCard";
import PluginAPI from "@/api/plugin.js";

export default {
  name: "Installed",
  components: {PluginCard},
  data() {
    return {
      list: [],
      searchValue: '',
      listArr: [],
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
  watch: {
    searchValue(newVal) {
      this.debounce(this.searchPlugin, 500, newVal)
    }
  },
  created() {
    this.loadPlugin();
  },
  methods: {
    loadPlugin() {

    },
    searchPlugin(value) {
      if (value == "") {
        this.listArr = this.list;
      } else {
        this.listArr = this.list.filter(item => item.name.indexOf(this.searchValue) > -1);
      }
    },
    handleInstalled(pluginData) {
      let index = this.list.indexOf(pluginData);
      if (index > -1) {
        pluginData.isInstalled = true;
        this.list.splice(index, 1, pluginData);
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
</style>