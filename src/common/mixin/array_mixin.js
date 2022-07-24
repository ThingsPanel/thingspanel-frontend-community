import Vue from 'vue'
Vue.mixin({
    methods: {
        editArray(arr, oldValue, newValue) {
            if (!(arr instanceof Array))
                return false;
            let index = arr.indexOf(oldValue);
            if (index == -1)
                return false;
        }
    }
})