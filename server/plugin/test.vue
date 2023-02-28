<!--
 * @Category: dashboard
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-10 17:46:15
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-28 14:48:18
 * @FilePath: \vue-remote-component\node-server\routes\test.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div >
        <h1>vue-sfc-loader demo</h1>
        <button @click="onClick">点击我</button>
        <input v-model="msg"/>
    </div>
</template>
  
<script>
  export default {
    name: 'Test',
    data() {
      return {
        msg: "Hello"
      }
    },
    methods: {
      async onClick() { 
          console.log("我是服务端的组件");
            
      }
    }
  }
</script>