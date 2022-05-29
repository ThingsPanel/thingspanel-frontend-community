import {
    Button,
    Input,
    Select,
    Option,
    Form,
    FormItem,
    Table,
    TableColumn,
    Dialog,
    Radio,
    Upload,
    Popconfirm,
    Pagination,
    Tag,
    Cascader,
    Message,
} from "element-ui";

const element = {
    install: function (Vue) {
        Vue.use(Button)
        Vue.use(Form)
        Vue.use(FormItem)
        Vue.use(Input)
        Vue.use(Select)
        Vue.use(Option)
        Vue.use(Table)
        Vue.use(TableColumn)
        Vue.use(Dialog)
        Vue.use(Radio)
        Vue.use(Upload)
        Vue.use(Popconfirm)
        Vue.use(Pagination)
        Vue.use(Tag)
        Vue.use(Cascader)

        Vue.prototype.$message = Message
    }
}

export default element;