<template>
  <el-cascader
      placeholder="请选择业务"
      v-model="businessCascaderData"
      size="medium"
      :props="businessProps"
      clearable
      class="w-100"
      @change="handleChange()"
  >
  </el-cascader>
</template>

<script>
import {defineComponent} from "@vue/composition-api";
import {computed, reactive} from "@vue/composition-api/dist/vue-composition-api";
import {business_index} from "@/api/business";

export default defineComponent({
  name: "BusinessSelector",
  props: ['business_id'],
  setup(props, context){
    // 业务
    let businessCascaderData = computed({
      get(){
        return [props.business_id]
      },
      set(val){
        // 触发事件更新 props.business_id
        context.emit('update:business_id', val.join(""))
      }
    })

    // 业务级联懒加载
    let businessProps = reactive({
      lazy: true,
      lazyLoad(node, resolve) {
        business_index({page: 1}).then(({data})=>{
          let nodes = []
          if(data.code === 200 && data.data.data) {
            nodes = data.data.data.map((item)=>({
              value: item.id,
              label: item.name,
              leaf: true,
            }))
            // 返回节点
            resolve(nodes)
          }
        })
      }
    })

    function handleChange(){
      context.emit('change')
      // console.log('handelChange')
    }

    return {
      businessCascaderData,
      businessProps,
      handleChange,
    }
  }
})
</script>

<style scoped>

</style>