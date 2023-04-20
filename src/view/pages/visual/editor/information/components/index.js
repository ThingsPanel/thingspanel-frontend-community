import Vue from 'vue'
import upperFirst from 'lodash/upperFirst'
import camelCase from 'lodash/camelCase'

const requireComponent = require.context(
    './',
    false,
    /[A-Z]\w+\.(vue)$/
)

requireComponent.keys().forEach(fileName => {
    const componentConfig = requireComponent(fileName)

    const componentName = upperFirst(
        camelCase(fileName.split('/').pop().replace(/\.\w+$/, ''))
    )

    Vue.component(
        componentName,
        componentConfig.default || componentConfig
    )
})