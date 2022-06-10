<template>
<div class="rounded card p-4 el-table-transparent">

  <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3">
    <el-col :span="22">
      <h2 class="h2 text-white m-0 pt-2">设备分组</h2>
    </el-col>
    <el-col :span="2" class="px-2">
      <el-button class="w-100" size="medium" type="indigo">
        新增分组
      </el-button>
    </el-col>
  </el-row>

  <!-- 面包屑导航 start -->
  <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3">
    <el-col class="pb-3">
      <el-breadcrumb separator="/" class="my-breadcrumb">
        <el-breadcrumb-item
            class="cursor-pointer"
            v-for="(item, index) in breadcrumbData"
            :key="item.id"
            @click.native="handleBreadcrumbClick(item, index)"
        >{{ item.name ? item.name : item.id }}</el-breadcrumb-item>
      </el-breadcrumb>
    </el-col>
  </el-row>
  <!-- 面包屑导航 end -->

  <el-table :data="tableData" :show-header="false" v-loading="loading">
    <el-table-column label="名字" prop="name">
      <template v-slot="scope">
        <div class="cursor-pointer" @click="handleClick(scope.row)">
          <i :class="scope.row.icon"></i>
          {{scope.row.name ? scope.row.name : scope.row.id}}
        </div>
      </template>
    </el-table-column>
  </el-table>
</div>
</template>

<script>
import {defineComponent, ref} from "@vue/composition-api";
import useRoute from "@/utils/useRoute";
import useAssetIndex from "@/view/pages/business/useAssetIndex";

export default defineComponent({
  name: "AssetIndex",
  setup(){
    let breadcrumbData = ref([])

    let {route,router} = useRoute()
    // 业务列表
    breadcrumbData.value.push({
      id: "business_list",
      name: "业务管理",
      params: route.params,
    })

    // 业务名加入面包屑导航
    breadcrumbData.value.push({
      id: route.query.id,
      name: route.query.name,

    })

    let business_id = route.query.id

    // 通过业务id 获取第一级分组
    let {
      tableData,
      loading,
      getFirstLevel,
      getSecondLevel,
    } = useAssetIndex()

    getFirstLevel(business_id)

    function handleClick(item){
      if(item.is_asset){
        getSecondLevel(item.id)
        breadcrumbData.value.push(item)
      }
    }

    // 面包屑点击
    function handleBreadcrumbClick(item, index) {
      // console.log(item,index)

      if(index === 0) {
        // 返回业务列表并携带之前的页码
        router.push({name: 'businesslist', params: {page: item.params.page}})
        return;
      }
      // 点击最后一项什么都不做
      if(index === breadcrumbData.value.length) return;

      // 如果时第二项开始 重新获取列表
      if(index > 1) {
        // 通过 asset_id 获取子分组
        getSecondLevel(item.id)
      } else{
        // 如果时第一项
        // 通过 business_id 获取分组
        getFirstLevel(item.id)
      }

      // 截取面包屑导航
      breadcrumbData.value = breadcrumbData.value.slice(0, index+1)
    }


    return {
      breadcrumbData,
      tableData,
      loading,
      handleClick,
      handleBreadcrumbClick,
    }

  }
})
</script>

<style scoped>

</style>