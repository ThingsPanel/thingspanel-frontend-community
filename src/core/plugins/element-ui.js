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
    RadioGroup,
    Upload,
    Popconfirm,
    Pagination,
    Tag,
    Cascader,
    Row,
    Col,
    Alert,
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
        Vue.use(RadioGroup)
        Vue.use(Upload)
        Vue.use(Popconfirm)
        Vue.use(Pagination)
        Vue.use(Tag)
        Vue.use(Cascader)
        Vue.use(Row)
        Vue.use(Col)
        Vue.use(Alert)

        Vue.prototype.$message = Message
    }
}

export default element;