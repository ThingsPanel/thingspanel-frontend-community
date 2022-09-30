<template>
  <div class="container-fluid">
    <el-row>
      <el-col :span="4">
        <el-input class="el-dark-input" v-model="filterValue" autocomplete="off"></el-input>
        <el-tree class="el-dark-tree" ref="pluginTree" lazy
                 :load="loadNode" :props="defaultProps" :filter-node-method="filterNode" @node-click="nodeClick"></el-tree>
      </el-col>
      <el-col :span="20">
        <DeviceChartCanvas :json-str="jsonStr" :device="device"></DeviceChartCanvas>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import {defineComponent, watch, ref as reference} from "@vue/composition-api";
import useRoute from "@/utils/useRoute";
import {reactive, ref} from "@vue/composition-api/dist/vue-composition-api";
import {device_group_drop} from "@/api/asset";
import {device_list} from "@/api/device";
import PluginAPI from "@/api/plugin.js"
import DeviceChartCanvas from "./DeviceChartCanvas"

export default defineComponent({
  name: "DeviceChart",
  components: {
    DeviceChartCanvas
  },
  setup(props, context){
    let { route } = useRoute();
    // 业务id
    let business_id = route.query.business_id
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
    function loadNode(node, resolve) {
      // 默认加载一级节点
      if (node.level == 0) {
        device_group_drop({ business_id })
          .then(({ data }) => {
            console.log(data)
            let arr = data.data.map(item => { return { label: item.device_group, id: item.id } })
            return resolve(arr);
          })
      }

      // 点击了一级分类，加载二级节点
      if (node.level == 1) {
        let groupId = node.data.id;
        let data ={current_page: 1, per_page: 999999, asset_id: groupId}
        device_list(data)
          .then(({data}) => {
            if (data.code == 200) {
              if (!data.data.data) {
                return resolve([])
              }
              let arr = data.data.data.map(item => {
                item.label = item.device_name;
                item.leaf = true;
                return item;
              })
              return resolve(arr);
            }
          })
      }
    }

    let jsonStr = ref("")
    let device = ref({})

    /**
     * 点击设备
     * @param node
     */
    function nodeClick(node) {
      device.value = node;
      if (node.leaf && node.device && node.device_type) {
        let param = {"current_page": 1, "per_page": 10, "id": node.device_type}
        PluginAPI.page(param)
          .then(({data}) => {
            if (data.code == 200 && data.data && data.data.data && data.data.data.length > 0) {
                jsonStr.value = data.data.data[0].chart_data;
            } else {
              jsonStr.value ="{}";
            }
          })
      } else {
        jsonStr.value ="{}";
      }
    }
    return {
      defaultProps,
      filterValue,
      pluginTree,
      pluginData,
      filterNode,
      loadNode,
      nodeClick,
      jsonStr,
      device
    }
  }
})
</script>

<style scoped lang="scss">
.content {
  height: 100%!important;
}
.container-fluid {
  height: 100%!important;
  padding: 20px 10px 100px 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1)
}
</style>