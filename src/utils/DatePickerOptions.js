import moment from "moment";

const DatePickerOptions = {
    shortcuts: [{
        text: '最近一周',
        onClick(picker) {
            const start = moment().subtract(7, 'days').startOf('day').format('YYYY-MM-DD HH:mm:ss');
            const end = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
            picker.$emit('pick', [start, end]);
        }
    }, {
        text: '最近一个月',
        onClick(picker) {
            const start = moment().subtract(30, 'days').startOf('day').format('YYYY-MM-DD HH:mm:ss');
            const end = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
            picker.$emit('pick', [start, end]);
        }
    }, {
        text: '最近三个月',
        onClick(picker) {
            const start = moment().subtract(90, 'days').startOf('day').format('YYYY-MM-DD HH:mm:ss');
            const end = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
            picker.$emit('pick', [start, end]);
        }
    }]
};

export default DatePickerOptions;