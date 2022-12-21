import Vue from 'vue'
Vue.mixin({
    methods: {
        hasAuth(perm) {
            let authority = this.$store.getters.getAuth;
            return authority.indexOf(perm) > -1
        }
    }
})