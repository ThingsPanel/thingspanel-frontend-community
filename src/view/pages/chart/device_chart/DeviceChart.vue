<template>
  <div class="container-fluid">
    <div class="header">
      <el-button class="el-button--indigo"  @click="back">返回</el-button>
      <el-button class="el-button--indigo"  @click="VisualEdit">编辑</el-button>
    </div>
    <div class="content">
      <div class="left-tree">
          <el-input class="el-dark-input search-input" suffix-icon="el-icon-search" v-model="filterValue" autocomplete="off" placeholder="搜索"></el-input>
          <el-tree class="el-dark-tree" ref="pluginTree" lazy
                   :load="loadNode" :props="defaultProps" :filter-node-method="filterNode" @node-click="nodeClick"></el-tree>

<!--        <el-tree class="el-dark-tree" ref="pluginTree" :data="treeData" :props="defaultProps"></el-tree>-->
      </div>

      <div class="display-canvas">
        <DeviceChartCanvas :show-screen="showScreen" :screen-data="screenData" :device="device"></DeviceChartCanvas>
      </div>
    </div>

  </div>
</template>

<script>
import {defineComponent, watch, ref as reference} from "@vue/composition-api";
import useRoute from "@/utils/useRoute";
import { ref} from "@vue/composition-api/dist/vue-composition-api";
import {device_group_drop} from "@/api/asset";
import {device_list} from "@/api/device";
import PluginAPI from "@/api/plugin.js"
import DeviceChartCanvas from "./DeviceChartCanvas"
import VisualAPI from "@/api/visualization.js"
import {getDeviceTree} from "@/api/device";

export default defineComponent({
  name: "DeviceChart",
  components: {
    DeviceChartCanvas
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

    // let treeData = ref([])
    // getTreeData();
    // function getTreeData() {
    //   getDeviceTree({current_page: 1, per_page: 9999, business_id:  business_id})
    //     .then(({data}) => {
    //       if (data.code == 200) {
    //         treeData.value = data.data.data;
    //       }
    //       console.log("getDeviceTree", data)
    //     })
    // }


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
          console.log("level=2", arr)
          return resolve(arr);
        }
      }

    }

    let screenData = ref([]);
    let device = ref({})
    let showScreen = ref(false);

    /**
     * 点击设备
     * @param node
     */
    function nodeClick(node) {
      device.value = node;
      if (node.leaf && node.device && node.type) {
        let param = {"current_page": 1, "per_page": 10, "id": node.type}
        getScreenData(node.device, () => {
          PluginAPI.page(param)
              .then(({data}) => {
                if (data.code == 200 && data.data && data.data.data && data.data.data.length > 0) {
                  let plugin = JSON.parse(data.data.data[0].chart_data);
                  showScreen.value = false;
                  screenData.value = JSON.parse(JSON.stringify(plugin.chart));
                } else {
                  screenData.value = [];
                }
              })
        })


      } else {
        screenData.value = [];
      }
    }

    function back() {
      router.push({ name: "ChartList" })
    }

    function VisualEdit() {
      let query = {
        name,
        businessId: business_id,
        groupId,
        deviceId: device.value.device || ""
      }
      const{ href } = router.resolve({ name:"VisualEditor", query });
      window.open(href,'_blank');
    }


    function getScreenData(relation_id, callback) {
      let params = {current_page: 1, per_page: 9999, relation_id}
      VisualAPI.list(params)
          .then(({data}) => {
            if (data.code == 200 && data.data.data.length > 0) {
              showScreen.value = true;
              screenData.value = JSON.parse(data.data.data[0].json_data);
            } else {
              showScreen.value = false;
              if (callback) {
                callback();
              }
            }
          })
    }

    // 默认显示业务大屏
    getScreenData(business_id);

    return {
      back,
      defaultProps,
      filterValue,
      pluginTree,
      pluginData,
      filterNode,
      loadNode,
      nodeClick,
      showScreen,
      screenData,
      device,
      VisualEdit
    }
  }
})
</script>

<style scoped lang="scss">
.container-fluid {
  position: Inherit;
  height: 100vh!important;
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