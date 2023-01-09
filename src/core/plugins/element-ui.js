import {
    Button,
    Input,
    InputNumber,
    Select,
    Option,
    OptionGroup,
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
    TimePicker,
    DatePicker,
    Breadcrumb,
    BreadcrumbItem,
    Switch,
    Message,
    Tree,
    Drawer,
    Divider,
    Checkbox,
    CheckboxButton,
    CheckboxGroup,
    Image,
    Avatar,
    Tabs,
    TabPane,
    Descriptions,
    DescriptionsItem,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Collapse,
    CollapseItem
} from "element-ui";

// 防止dialog导致页面滚动条消失抖动
Dialog.props.lockScroll.default = false;

const element = {
    install: function (Vue) {
        Vue.use(Avatar)
        Vue.use(Button)
        Vue.use(Form)
        Vue.use(FormItem)
        Vue.use(Input)
        Vue.use(InputNumber)
        Vue.use(Select)
        Vue.use(Option)
        Vue.use(OptionGroup)
        Vue.use(Table)
        Vue.use(TableColumn)
        Vue.use(Dialog)
        Vue.use(Image)
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
        Vue.use(TimePicker)
        Vue.use(DatePicker)
        Vue.use(Breadcrumb)
        Vue.use(BreadcrumbItem)
        Vue.use(Switch)
        Vue.use(Tree)
        Vue.use(Drawer)
        Vue.use(Divider)
        Vue.use(Checkbox)
        Vue.use(CheckboxButton)
        Vue.use(CheckboxGroup)
        Vue.use(Tabs)
        Vue.use(TabPane)
        Vue.use(Descriptions)
        Vue.use(DescriptionsItem)
        Vue.use(Dropdown)
        Vue.use(DropdownMenu)
        Vue.use(DropdownItem)
        Vue.use(Collapse)
        Vue.use(CollapseItem)
        Vue.prototype.$message = Message
    }
}

export default element;