<template>
  <div class="device-watch-container">
    <div class="header">
      <el-button class="el-button--indigo" size="medium" @click="back">{{ $t('DEVICE_WATCH_DETAIL.RETURN') }}</el-button>
    </div>
    <div class="content">

      <div class="left-tree">
        <el-input class="el-dark-input search-input" suffix-icon="el-icon-search" v-model="filterValue" autocomplete="off" :placeholder="$t('DEVICE_WATCH_DETAIL.SEARCH')"></el-input>
        <el-tree class="el-dark-tree" ref="pluginTree" lazy
                 :load="loadNode" :props="defaultProps" :filter-node-method="filterNode" 
                 @node-click="node => nodeClick(node, changeNode)"></el-tree>
      </div>

      <div class="display-canvas">
        <PluginCharts ref="pluginCharts" :options="pluginOptions" :tsl="pluginTsl" :device="device"></PluginCharts>
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
import useTree from "./useTree";

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


    let { 
      loadNode,
      pluginOptions, pluginTsl, device, nodeClick
    } = useTree(business_id);


    function back() {
      router.push({ name: "DeviceWatch" })
    }

    const pluginCharts = ref();
    function changeNode() {
      console.log("changeNode", pluginCharts)
      pluginCharts.value.nodeChanged && pluginCharts.value.nodeChanged();
    }


    return {
      back,
      defaultProps,
      filterValue,
      pluginTree,
      filterNode,
      loadNode,
      nodeClick,
      pluginCharts,
      changeNode,
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
  padding: 0;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  .header {
    color:  #fff;
    height: 50px;
    padding-bottom: 10px;
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