
export default "option = {\n" +
"  tooltip: {\n" +
"    formatter: '{a} <br/>{b} : {c}%'\n" +
"  },\n" +
"  series: [\n" +
"    {\n" +
"      name: 'Pressure',\n" +
"      type: 'gauge',\n" +
"      center: ['30%', '50%'],\n" +
"      radius: '60%',\n" +
"      startAngle: 320,\n" +
"      endAngle: 40,\n" +
"      itemStyle: { \n" +
"        color: '#409EFF' \n" +
"      },"+
"      progress: {\n" +
"        show: true\n" +
"      },\n" +
"      axisTick: {\n" +
"        show: false\n" +
"      },\n" +
"      splitLine: {\n" +
"        show: false\n" +
"      },\n" +
"      axisLabel: {\n" +
"        distance: 0,\n" +
"        color: '#999',\n" +
"        fontSize: 10\n" +
"      },\n" +
"      detail: {\n" +
"        fontSize: 20,\n" +
"        color: '#fff',\n" +
"        formatter: '{value}'\n" +
"      },\n" +
"      data: [\n" +
"        {\n" +
"          value: 10,\n" +
"          name: ''\n" +
"        }\n" +
"      ]\n" +
"    },\n" +
"    {\n" +
"      name: 'Pressure',\n" +
"      type: 'gauge',\n" +
"      center: ['70%', '50%'],\n" +
"      radius: '60%',\n" +
"      startAngle: 140,\n" +
"      endAngle: -140,\n" +
"      itemStyle: { \n" +
"        color: '#49B401' \n" +
"      },"+
"      progress: {\n" +
"        show: true\n" +
"      },\n" +
"      axisTick: {\n" +
"        show: false\n" +
"      },\n" +
"      splitLine: {\n" +
"        show: false\n" +
"      },\n" +
"      axisLabel: {\n" +
"        distance: 0,\n" +
"        color: '#999',\n" +
"        fontSize: 10\n" +
"      },\n" +
"      detail: {\n" +
"        fontSize: 20,\n" +
"        color: '#fff',\n" +
"        formatter: '{value}'\n" +
"      },\n" +
"      data: [\n" +
"        {\n" +
"          value: 10,\n" +
"          name: ''\n" +
"        }\n" +
"      ]\n" +
"    }\n" +
"  ]\n" +
"};"