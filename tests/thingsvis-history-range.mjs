import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/components/thingsvis/ThingsVisWidget.vue', import.meta.url), 'utf8')
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)))
// 只加载真实范围解析代码，接口函数在此测试中不执行。
const parser = section('const parseFieldBindingExpression', '\nconst ')
const logic = section('const normalizeHistoryTimeRange', 'const getConfiguredPlatformDataSource')
const compiled = ts.transpileModule(
  section('const FIELD_BINDING_EXPR_RE', 'const DEFAULT_WRITE_EVENT_BY_COMPONENT') + parser + logic,
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } }
).outputText
const collect = config => new Function('props', compiled + '\nreturn collectConfiguredHistoryFields;')({ config })
const binding = range => ({ expression: '{{ ds.device.data.pm25__history }}', ...(range ? { historyConfig: { timeRange: range } } : {}) })
const node = (range, preset = 'all') => ({ props: { timeRangePreset: preset }, data: [binding(range)] })
assert.equal(collect({ nodes: [node('last_24h')] })('device').get('pm25'), 'last_24h')
assert.equal(collect({ nodes: [node(undefined, '6h')] })('device').get('pm25'), 'last_6h')
assert.equal(collect({ nodes: [node('last_24h'), node('last_7d')] })('device').get('pm25'), 'last_7d')
assert.equal(collect({ nodes: [node('last_24h')] })('other').size, 0)
assert.equal(collect({ nodes: [{ props: { timeRangePreset: '1h', data: '{{ ds.device.data.pm25__history }}' } }] })('device').get('pm25'), 'last_1h')
console.log('ThingsVis host history ranges passed: binding priority, fallback, multiple charts and source isolation')
