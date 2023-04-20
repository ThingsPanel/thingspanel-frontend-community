/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-01-29 14:11:24
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-02 11:05:18
 * @FilePath: \ThingsPanel-Backend-Vue\src\core\mixins\checkAuth.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import Vue from 'vue'
Vue.mixin({
    methods: {
        hasAuth(perm) {
            
            let authority = this.$store.getters.getAuth;
            return authority.indexOf(perm) > -1
        }
    }
})