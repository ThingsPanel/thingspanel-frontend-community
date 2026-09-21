import assert from 'node:assert/strict'
import fs from 'node:fs'

const constantsSource = fs.readFileSync(new URL('../src/utils/thingsvis/constants.ts', import.meta.url), 'utf8')
const proxySource = fs.readFileSync(new URL('../build/config/proxy.ts', import.meta.url), 'utf8')
const historySource = fs.readFileSync(new URL('../src/service/api/device.ts', import.meta.url), 'utf8')

assert.match(constantsSource, /export const PLATFORM_API_PROXY_PATH = createProxyPattern\(\)/)
assert.match(constantsSource, /return isHttpProxy \? PLATFORM_API_PROXY_PATH : PLATFORM_API_BASE_PATH/)
assert.match(constantsSource, /window\.location\.origin \+ resolvePlatformApiBasePath\(\)/)

assert.match(proxySource, /const defaultProxyPattern = createProxyPattern\(\)/)
assert.match(proxySource, /rewrite: path => path\.replace\(new RegExp\(`\^\$\{defaultProxyPattern\}`\), ''\)/)
assert.match(historySource, /request\.get<any>\('\/telemetry\/datas\/statistic'/)

const proxyPrefix = '/proxy-default'
const historyRequestPath = `${proxyPrefix}/telemetry/datas/statistic`
assert.equal(historyRequestPath.replace(new RegExp(`^${proxyPrefix}`), ''), '/telemetry/datas/statistic')

console.log('ThingsVis runtime base and history proxy static checks passed')
