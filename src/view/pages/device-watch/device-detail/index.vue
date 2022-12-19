<template>
  <div class="device-watch-container">
    <div class="header">
      <el-button class="el-button--indigo"  @click="back">{{ $t('COMMON.RETURN') }}</el-button>
    </div>
    <div class="content">

      <div class="left-tree">
        <el-input class="el-dark-input search-input" suffix-icon="el-icon-search" v-model="filterValue" autocomplete="off" :placeholder="$t('COMMON.SEARCH')"></el-input>
        <el-tree class="el-dark-tree" ref="pluginTree" lazy
                 :load="loadNode" :props="defaultProps" :filter-node-method="filterNode" @node-click="nodeClick"></el-tree>
      </div>

      <div class="display-canvas">
        <PluginCharts :options="pluginOptions" :tsl="pluginTsl" :device="device"></PluginCharts>
      </div>
    </div>

  </div>
</template>

<script>
import {defineComponent, watch, ref as reference} from "@vue/composition-api";
import useRoute from "@/utils/useRoute";
import { ref} from "@vue/composition-api/dist/vue-composition-api";
import {device_group_drop} from "@/api/asset";
import PluginAPI from "@/api/plugin.js"
import {getDeviceTree} from "@/api/device";
import PluginCharts from "./PluginCharts.vue"

export default defineComponent({
  name: "DeviceDetail",
  components: {
    PluginCharts
  },
  setup(props, context){
    let { route, router } = useRoute();
    // 业务id
    let business_id = route.query.businessId;
    let name = route.query.name;



    const defaultProps = { label: 'label', isLeaf: 'leaf'}
    /**
     * 节点过滤
     * @type {null}
     */
    const pluginTree = reference(null);
    let filterValue = ref("")
    watch(filterValue, value => {
      pluginTree.value.filter(value)
    })
    function filterNode(value, data) {
      if (!value) return true;
      return data[defaultProps.label].indexOf(value) !== -1;
    }

    /**
     * 1. 初始化时在树组件中显示业务下的所有设备分组
     * 2. 点击设备分组后加载该分组下的所有设备
     */
    let pluginData = ref([])
    let groupId = "";

    function loadNode(node, resolve) {
      // 默认加载一级节点
      if (node.level == 0) {
        device_group_drop({ business_id })
          .then(({ data }) => {
            let arr = data.data.map(item => { return { label: item.device_group, id: item.id } })
            return resolve(arr);
          })
      }

      // 点击了一级分类，加载二级节点
      if (node.level == 1) {
        groupId = node.data.id;
        let data ={current_page: 1, per_page: 9999, asset_id: groupId}
        getDeviceTree(data)
          .then(({data}) => {
            if (data.code == 200) {
              if (!data.data.data) {
                return resolve([])
              }
              let arr = data.data.data.map(item => {
                item.label = item.device_name;
                if (!item.children) {
                  item.leaf = true;
                }
                return item;
              })
              return resolve(arr);
            }
          })
      }

      if (node.level == 2) {
        if (node.data.children) {
          let arr = node.data.children.map(item => {
            item.id = item.device;
            item.label = item.device_name;
            item.leaf = true;
            return item;
          })
          return resolve(arr);
        }
      }

    }

    let pluginOptions = ref([]);
    let pluginTsl = ref([]);
    let canvasStyle = ref({});
    let device = ref({})

    /**
     * 点击设备显示插件图表
     * @param node
     */
    function nodeClick(node) {
      device.value = node;
      if (node.leaf && node.device && node.type) {
        let param = {"current_page": 1, "per_page": 10, "id": node.type}
          PluginAPI.page(param)
              .then(({data}) => {
                if (data.code == 200 && data.data && data.data.data && data.data.data.length > 0) {
                  let plugin = JSON.parse(data.data.data[0].chart_data);
                  pluginOptions.value = JSON.parse(JSON.stringify(plugin.chart));
                  pluginTsl.value = JSON.parse(JSON.stringify(plugin.tsl.properties));
                } else {
                  pluginOptions.value = [];
                }
              })
      } else {
        pluginOptions.value = [];
      }
    }

    function back() {
      router.push({ name: "DeviceWatch" })
    }


    return {
      back,
      defaultProps,
      filterValue,
      pluginTree,
      pluginData,
      filterNode,
      loadNode,
      nodeClick,
      canvasStyle,
      device,
      pluginOptions,
      pluginTsl
    }
  }
})
</script>

<style scoped lang="scss">
.device-watch-container {
  position: Inherit;
  height: calc(100vh - 90px)!important;
  //height: calc(100% - 100px);
  width: auto;
  padding: 20px 10px 0px 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  .header {
    color:  #fff;
    height: 60px;
    padding-bottom: 20px;
  }
  .content {
    display: inline-flex;
    width: 100%;
    height: calc(100% - 60px);
    background-color: #161e43;
    .left-tree {
      position: Inherit;
      width: 300px;
      height: 100%;
      border: 2px solid #161e43;
      border-radius: 4px;
      background-color: #1f2a5f;
      overflow-y: auto;
      .search-input {
        //background-color: #5867dd!important;
        //border-color: #5867dd!important;
        border-radius: 10px;
        margin: 2px;
      }
    }

    .display-canvas {
      width: 100%;
      height: 100%;
    }
  }

}
</style>