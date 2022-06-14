<template>
  <el-cascader
      placeholder="请选择设备分组"
      v-model="assetCascaderData"
      size="medium"
      :props="assetProps"
      :options="assetOptions"
      clearable
      :show-all-levels="false"
      class="w-100"
      filterable
      @change="handleChange()"
  >
  </el-cascader>
</template>

<script>
import {defineComponent, watch} from "@vue/composition-api";
import {computed, reactive, ref} from "@vue/composition-api/dist/vue-composition-api";
import {asset_list_a, asset_list_b} from "@/api/asset";

export default defineComponent({
  name: "AssertSelector",
  props: {
    business_id: {
      required: true
    },
    asset_id: {
      required: true
    }
  },
  setup(props,context){
    // 资产 asset_id
    let assetOptions = ref([])

    // business_id 更改时请求资产列表的第一级
    watch(()=> props.business_id, ()=>{
      let business_id = props.business_id
      // 有 business_id 时才加载资产
      if(business_id){
        asset_list_a({business_id}).then(({data})=>{
          if(data.code === 200 && data.data) {
            assetOptions.value = data.data.map((item)=>({
              label: item.name?item.name:item.id, // 没名字的时候用id代替
              value: item.id,
            }))
          }
        })
      }else{
        // 没有 business_id 时 清空资产
        assetOptions.value = []
      }
    })

    let assetCascaderData = computed({
      get(){
        return props.asset_id
      },
      set(val){
        context.emit('update:asset_id', val)
      }
    })

    // 级联懒加载
    let assetProps = reactive({
      lazy: true,
      checkStrictly: true,
      lazyLoad(node, resolve) {
        const { level } = node;
        if(level > 0) {
          let asset_id = node.data.value
          asset_list_b({asset_id}).then(({data})=>{
            let nodes = []
            if(data.code === 200 && data.data) {
              nodes = data.data.map((item)=>({
                label: item.name,
                value: item.id,
              }))
            }
            resolve(nodes)
          })
        }
      }
    })

    // 向父级传递 change 事件
    function handleChange(){
      context.emit('change')
    }

    return {
      assetOptions,
      assetProps,
      assetCascaderData,
      handleChange,
    }
  }
})
</script>

<style scoped>

</style>