// 基础选项类型，用于下拉选择、单选框组、复选框组等需要选项的表单项
interface Option {
  label: string; // 显示给用户的选项文本
  value: any; // 选项对应的值
  children?: Option[]; // 对于级联选择器，选项可能有子选项
}

// 基础表单项属性，适用于大多数表单项
interface BasicProps {
  label?: string; // 表单项的标签
  placeholder?: string; // 输入框/选择框的占位符
  disabled?: boolean; // 是否禁用表单项
}

// 基础表单项接口，其他所有表单项类型都将扩展此接口
interface FormItemBase {
  type: string; // 表单项的类型，如 "Input", "Select"
  key: string; // 表单项的唯一键，用于生成最终的表单数据对象
  props?: BasicProps; // 基础属性对象
}

// 自动完成表单项，扩展基础表单项
interface AutoCompleteItem extends FormItemBase {
  type: 'AutoComplete';
  fetchSuggestions: (query: string) => Promise<Option[]>; // 获取自动完成建议的函数
}

// 选择器表单项，支持单选和多选
interface SelectItem extends FormItemBase {
  type: 'Select';
  options: Option[]; // 选择器的选项
  multiple?: boolean; // 是否支持多选
}

// 级联选择器表单项
interface CascaderItem extends FormItemBase {
  type: 'Cascader';
  options: Option[]; // 级联的选项，支持嵌套
}

// 复选框表单项
interface CheckboxItem extends FormItemBase {
  type: 'Checkbox';
  checked?: boolean; // 复选框是否被选中
}

// 复选框组表单项
interface CheckboxGroupItem extends FormItemBase {
  type: 'CheckboxGroup';
  options: Option[]; // 复选框组的选项
}

// 单选框表单项
interface RadioItem extends FormItemBase {
  type: 'Radio';
  checked?: boolean; // 单选框是否被选中
}

// 单选框组表单项
interface RadioGroupItem extends FormItemBase {
  type: 'RadioGroup';
  options: Option[]; // 单选框组的选项
}

// 开关表单项
interface SwitchItem extends FormItemBase {
  type: 'Switch';
  checked?: boolean; // 开关是否开启
}

// 滑块表单项
interface SliderItem extends FormItemBase {
  type: 'Slider';
  value?: number; // 滑块当前值
  min?: number; // 最小值
  max?: number; // 最大值
  step?: number; // 步长
}

// 日期选择器表单项
interface DatePickerItem extends FormItemBase {
  type: 'DatePicker';
  value?: string; // 选择的日期
}

// 时间选择器表单项
interface TimePickerItem extends FormItemBase {
  type: 'TimePicker';
  value?: string; // 选择的时间
}

// 日期时间选择器表单项
interface DateTimePickerItem extends FormItemBase {
  type: 'DateTimePicker';
  value?: string; // 选择的日期时间
}

// 文件上传表单项
interface UploadItem extends FormItemBase {
  type: 'Upload';
  fileList?: Array<{
    // 已上传文件列表
    name: string; // 文件名
    url: string; // 文件URL
  }>;
}

// 动态标签（动态输入）表单项
interface DynamicTagsItem extends FormItemBase {
  type: 'DynamicTags';
  tags?: string[]; // 标签数组
}

// 树选择器表单项
interface TreeSelectItem extends FormItemBase {
  type: 'TreeSelect';
  treeData: Option[]; // 树形结构数据，使用Option类型，可包含children表示嵌套
}

// 输入数字表单项
interface InputNumberItem extends FormItemBase {
  type: 'InputNumber';
  value?: number; // 当前值
  min?: number; // 最小值
  max?: number; // 最大值
}

// 评分表单项
interface RateItem extends FormItemBase {
  type: 'Rate';
  value?: number; // 当前评分值
}

// 穿梭框表单项
interface TransferItem extends FormItemBase {
  type: 'Transfer';
  dataSource: Option[]; // 数据源，包含所有选项
  targetKeys: any[]; // 显示在右侧框数据的key集合
}

// 颜色选择器表单项
interface ColorPickerItem extends FormItemBase {
  type: 'ColorPicker';
  value?: string; // 当前选择的颜色值
}

// 校验规则接口，定义表单项的校验规则
interface ValidationRule {
  required?: boolean; // 是否必填
  message: string; // 校验未通过时的提示信息
  validator?: (value: any) => boolean | Promise<boolean>; // 自定义校验函数
}

// 表单项接口，将所有类型的表单项聚合在一起
type FormItem =
  | AutoCompleteItem
  | SelectItem
  | CascaderItem
  | CheckboxItem
  | CheckboxGroupItem
  | RadioItem
  | RadioGroupItem
  | SwitchItem
  | SliderItem
  | DatePickerItem
  | TimePickerItem
  | DateTimePickerItem
  | UploadItem
  | DynamicTagsItem
  | TreeSelectItem
  | InputNumberItem
  | RateItem
  | TransferItem
  | ColorPickerItem;

// 表单JSON结构，描述整个表单
interface FormJson {
  items: FormItem[]; // 包含的表单项数组
}
