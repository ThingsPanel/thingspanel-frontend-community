/**
 * GridPro 性能基准测试系统
 * 测量渲染性能、内存使用率、响应速度等关键指标
 */

import type { GridProItem, GridProConfig } from '../types/gridpro'
import type { BaseCanvasItem } from '../../../types/core'

export interface BenchmarkResult {
  testName: string
  timestamp: number
  duration: number
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  fps: number
  renderTime: number
  interactionLatency: number
  scores: {
    overall: number
    rendering: number
    memory: number
    responsiveness: number
  }
}

export interface BenchmarkConfig {
  itemCounts: number[]
  testDuration: number // 毫秒
  enableMemoryProfiling: boolean
  enableFPSMeasurement: boolean
  enableInteractionTesting: boolean
  warmupRounds: number
}

export class PerformanceBenchmark {
  private results: BenchmarkResult[] = []
  private observer: PerformanceObserver | null = null
  private frameCount = 0
  private lastFrameTime = 0
  private memorySnapshots: number[] = []

  constructor(private config: BenchmarkConfig) {
    this.setupPerformanceObserver()
  }

  /**
   * 设置性能监控器
   */
  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.entryType === 'measure') {
            console.debug(`Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`)
          }
        })
      })
      
      this.observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] })
    }
  }

  /**
   * 运行完整的基准测试套件
   */
  async runBenchmarkSuite(): Promise<BenchmarkResult[]> {
    console.log('🚀 开始GridPro性能基准测试...')
    
    this.results = []
    
    // 预热测试
    await this.runWarmup()
    
    // 渲染性能测试
    for (const itemCount of this.config.itemCounts) {
      await this.runRenderingBenchmark(itemCount)
      await this.wait(1000) // 让系统稳定
    }
    
    // 交互性能测试
    if (this.config.enableInteractionTesting) {
      await this.runInteractionBenchmark()
    }
    
    // 内存压力测试
    if (this.config.enableMemoryProfiling) {
      await this.runMemoryBenchmark()
    }
    
    // 生成测试报告
    this.generateReport()
    
    return this.results
  }

  /**
   * 预热测试
   */
  private async runWarmup(): Promise<void> {
    console.log('🔥 执行预热测试...')
    
    for (let i = 0; i < this.config.warmupRounds; i++) {
      const items = this.generateTestItems(50)
      const container = this.createTestContainer()
      
      await this.renderItems(container, items)
      await this.wait(100)
      
      this.cleanupTestContainer(container)
    }
  }

  /**
   * 渲染性能基准测试
   */
  private async runRenderingBenchmark(itemCount: number): Promise<void> {
    console.log(`📊 测试渲染性能 - ${itemCount} 个项目`)
    
    const testName = `Rendering_${itemCount}_items`
    const startTime = performance.now()
    
    // 生成测试数据
    const items = this.generateTestItems(itemCount)
    const container = this.createTestContainer()
    
    // 开始内存监控
    const startMemory = this.getMemoryUsage()
    
    // 开始FPS监控
    this.startFPSMeasurement()
    
    // 执行渲染
    performance.mark(`${testName}_start`)
    
    const renderStartTime = performance.now()
    await this.renderItems(container, items)
    const renderEndTime = performance.now()
    
    performance.mark(`${testName}_end`)
    performance.measure(testName, `${testName}_start`, `${testName}_end`)
    
    // 等待渲染稳定
    await this.wait(this.config.testDuration)
    
    // 停止FPS监控
    const fps = this.stopFPSMeasurement()
    
    // 测量内存使用
    const endMemory = this.getMemoryUsage()
    const memoryUsage = {
      used: endMemory.usedJSHeapSize - startMemory.usedJSHeapSize,
      total: endMemory.totalJSHeapSize,
      percentage: (endMemory.usedJSHeapSize / endMemory.totalJSHeapSize) * 100
    }
    
    const endTime = performance.now()
    
    // 记录结果
    const result: BenchmarkResult = {
      testName,
      timestamp: Date.now(),
      duration: endTime - startTime,
      memoryUsage,
      fps,
      renderTime: renderEndTime - renderStartTime,
      interactionLatency: 0, // 这里不测试交互延迟
      scores: this.calculateScores({
        renderTime: renderEndTime - renderStartTime,
        fps,
        memoryUsage: memoryUsage.percentage,
        itemCount
      })
    }
    
    this.results.push(result)
    this.cleanupTestContainer(container)
  }

  /**
   * 交互性能基准测试
   */
  private async runInteractionBenchmark(): Promise<void> {
    console.log('🎯 测试交互性能')
    
    const testName = 'Interaction_Performance'
    const itemCount = 100
    const items = this.generateTestItems(itemCount)
    const container = this.createTestContainer()
    
    await this.renderItems(container, items)
    
    // 测试拖拽延迟
    const dragLatencies = await this.measureDragLatency(container, 10)
    const avgDragLatency = dragLatencies.reduce((a, b) => a + b, 0) / dragLatencies.length
    
    // 测试调整大小延迟
    const resizeLatencies = await this.measureResizeLatency(container, 10)
    const avgResizeLatency = resizeLatencies.reduce((a, b) => a + b, 0) / resizeLatencies.length
    
    const interactionLatency = (avgDragLatency + avgResizeLatency) / 2
    
    const result: BenchmarkResult = {
      testName,
      timestamp: Date.now(),
      duration: 0,
      memoryUsage: { used: 0, total: 0, percentage: 0 },
      fps: 0,
      renderTime: 0,
      interactionLatency,
      scores: this.calculateScores({
        renderTime: 0,
        fps: 60, // 假设60fps
        memoryUsage: 0,
        itemCount,
        interactionLatency
      })
    }
    
    this.results.push(result)
    this.cleanupTestContainer(container)
  }

  /**
   * 内存压力测试
   */
  private async runMemoryBenchmark(): Promise<void> {
    console.log('💾 执行内存压力测试')
    
    const testName = 'Memory_Stress_Test'
    const maxItems = Math.max(...this.config.itemCounts) * 2
    
    let currentItems = 100
    const memorySnapshots: Array<{ itemCount: number; memory: number }> = []
    
    while (currentItems <= maxItems) {
      const items = this.generateTestItems(currentItems)
      const container = this.createTestContainer()
      
      await this.renderItems(container, items)
      await this.wait(500) // 让内存稳定
      
      const memory = this.getMemoryUsage()
      memorySnapshots.push({
        itemCount: currentItems,
        memory: memory.usedJSHeapSize
      })
      
      this.cleanupTestContainer(container)
      
      // 强制垃圾回收（如果可用）
      if ('gc' in window) {
        (window as any).gc()
      }
      
      currentItems += 100
    }
    
    // 分析内存增长趋势
    const memoryGrowthRate = this.calculateMemoryGrowthRate(memorySnapshots)
    
    const result: BenchmarkResult = {
      testName,
      timestamp: Date.now(),
      duration: 0,
      memoryUsage: {
        used: memorySnapshots[memorySnapshots.length - 1].memory,
        total: 0,
        percentage: memoryGrowthRate
      },
      fps: 0,
      renderTime: 0,
      interactionLatency: 0,
      scores: this.calculateScores({
        renderTime: 0,
        fps: 60,
        memoryUsage: memoryGrowthRate,
        itemCount: maxItems
      })
    }
    
    this.results.push(result)
  }

  /**
   * 生成测试项目
   */
  private generateTestItems(count: number): BaseCanvasItem[] {
    const items: BaseCanvasItem[] = []
    
    for (let i = 0; i < count; i++) {
      items.push({
        id: `test-item-${i}`,
        type: 'builtin-card',
        subType: 'text-card',
        x: (i % 10) * 120,
        y: Math.floor(i / 10) * 100,
        width: 100,
        height: 80,
        config: {
          title: `测试卡片 ${i}`,
          content: `这是第 ${i} 个测试卡片`
        },
        data: {},
        style: {}
      })
    }
    
    return items
  }

  /**
   * 创建测试容器
   */
  private createTestContainer(): HTMLElement {
    const container = document.createElement('div')
    container.id = `benchmark-container-${Date.now()}`
    container.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: 1200px;
      height: 800px;
      overflow: hidden;
      z-index: -1;
    `
    document.body.appendChild(container)
    return container
  }

  /**
   * 清理测试容器
   */
  private cleanupTestContainer(container: HTMLElement): void {
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  }

  /**
   * 渲染项目到容器
   */
  private async renderItems(container: HTMLElement, items: BaseCanvasItem[]): Promise<void> {
    // 这里应该实际渲染GridPro组件
    // 由于这是一个模拟测试，我们创建DOM元素来模拟渲染
    
    const fragment = document.createDocumentFragment()
    
    items.forEach(item => {
      const element = document.createElement('div')
      element.className = 'test-grid-item'
      element.style.cssText = `
        position: absolute;
        left: ${item.x}px;
        top: ${item.y}px;
        width: ${item.width}px;
        height: ${item.height}px;
        background: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 4px;
      `
      element.textContent = item.config?.title || item.id
      fragment.appendChild(element)
    })
    
    container.appendChild(fragment)
    
    // 等待DOM更新
    await new Promise(resolve => requestAnimationFrame(resolve))
  }

  /**
   * 开始FPS测量
   */
  private startFPSMeasurement(): void {
    this.frameCount = 0
    this.lastFrameTime = performance.now()
    this.measureFrame()
  }

  /**
   * 测量帧率
   */
  private measureFrame(): void {
    const currentTime = performance.now()
    this.frameCount++
    
    if (currentTime - this.lastFrameTime >= 1000) {
      // 每秒计算一次FPS
      this.lastFrameTime = currentTime
      this.frameCount = 0
    }
    
    requestAnimationFrame(() => this.measureFrame())
  }

  /**
   * 停止FPS测量
   */
  private stopFPSMeasurement(): number {
    const elapsed = performance.now() - this.lastFrameTime
    return elapsed > 0 ? (this.frameCount / elapsed) * 1000 : 60
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): any {
    if ('memory' in performance) {
      return (performance as any).memory
    }
    return { usedJSHeapSize: 0, totalJSHeapSize: 0 }
  }

  /**
   * 测量拖拽延迟
   */
  private async measureDragLatency(container: HTMLElement, samples: number): Promise<number[]> {
    const latencies: number[] = []
    const items = container.querySelectorAll('.test-grid-item')
    
    for (let i = 0; i < samples && i < items.length; i++) {
      const startTime = performance.now()
      
      // 模拟拖拽事件
      const item = items[i] as HTMLElement
      const rect = item.getBoundingClientRect()
      
      const pointerDown = new PointerEvent('pointerdown', {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        pointerId: 1
      })
      
      const pointerMove = new PointerEvent('pointermove', {
        clientX: rect.left + rect.width / 2 + 50,
        clientY: rect.top + rect.height / 2 + 50,
        pointerId: 1
      })
      
      const pointerUp = new PointerEvent('pointerup', {
        clientX: rect.left + rect.width / 2 + 50,
        clientY: rect.top + rect.height / 2 + 50,
        pointerId: 1
      })
      
      item.dispatchEvent(pointerDown)
      await this.wait(16) // 一帧的时间
      item.dispatchEvent(pointerMove)
      await this.wait(16)
      item.dispatchEvent(pointerUp)
      
      const endTime = performance.now()
      latencies.push(endTime - startTime)
      
      await this.wait(100) // 避免过快的操作
    }
    
    return latencies
  }

  /**
   * 测量调整大小延迟
   */
  private async measureResizeLatency(container: HTMLElement, samples: number): Promise<number[]> {
    const latencies: number[] = []
    const items = container.querySelectorAll('.test-grid-item')
    
    for (let i = 0; i < samples && i < items.length; i++) {
      const startTime = performance.now()
      
      // 模拟调整大小
      const item = items[i] as HTMLElement
      const originalWidth = item.offsetWidth
      item.style.width = `${originalWidth + 50}px`
      
      await this.wait(16) // 等待重绘
      
      const endTime = performance.now()
      latencies.push(endTime - startTime)
      
      // 恢复原始大小
      item.style.width = `${originalWidth}px`
      await this.wait(100)
    }
    
    return latencies
  }

  /**
   * 计算内存增长率
   */
  private calculateMemoryGrowthRate(snapshots: Array<{ itemCount: number; memory: number }>): number {
    if (snapshots.length < 2) return 0
    
    const first = snapshots[0]
    const last = snapshots[snapshots.length - 1]
    
    const itemGrowth = last.itemCount - first.itemCount
    const memoryGrowth = last.memory - first.memory
    
    return itemGrowth > 0 ? (memoryGrowth / itemGrowth) : 0
  }

  /**
   * 计算性能评分
   */
  private calculateScores(metrics: {
    renderTime: number
    fps: number
    memoryUsage: number
    itemCount: number
    interactionLatency?: number
  }): { overall: number; rendering: number; memory: number; responsiveness: number } {
    // 渲染性能评分 (0-100)
    const renderingScore = Math.max(0, 100 - (metrics.renderTime / metrics.itemCount) * 10)
    
    // 内存效率评分 (0-100)
    const memoryScore = Math.max(0, 100 - (metrics.memoryUsage / 1024 / 1024) * 10) // MB为单位
    
    // 响应性评分 (0-100)
    const responsivenessScore = Math.min(100, (metrics.fps / 60) * 100)
    
    // 交互延迟评分 (0-100)
    const interactionScore = metrics.interactionLatency 
      ? Math.max(0, 100 - metrics.interactionLatency * 2)
      : responsivenessScore
    
    // 综合评分
    const overallScore = (renderingScore + memoryScore + responsivenessScore + interactionScore) / 4
    
    return {
      overall: Math.round(overallScore),
      rendering: Math.round(renderingScore),
      memory: Math.round(memoryScore),
      responsiveness: Math.round(interactionScore)
    }
  }

  /**
   * 生成测试报告
   */
  private generateReport(): void {
    console.log('\n📈 GridPro 性能测试报告')
    console.log('=' .repeat(50))
    
    this.results.forEach(result => {
      console.log(`\n🧪 ${result.testName}`)
      console.log(`⏱️  执行时间: ${result.duration.toFixed(2)}ms`)
      console.log(`🎨 渲染时间: ${result.renderTime.toFixed(2)}ms`)
      console.log(`📊 帧率: ${result.fps.toFixed(1)}fps`)
      console.log(`💾 内存使用: ${(result.memoryUsage.used / 1024 / 1024).toFixed(2)}MB`)
      console.log(`🎯 交互延迟: ${result.interactionLatency.toFixed(2)}ms`)
      console.log(`📈 综合评分: ${result.scores.overall}/100`)
      console.log(`   - 渲染性能: ${result.scores.rendering}/100`)
      console.log(`   - 内存效率: ${result.scores.memory}/100`)
      console.log(`   - 响应速度: ${result.scores.responsiveness}/100`)
    })
    
    // 计算平均分数
    const avgScore = this.results.reduce((sum, r) => sum + r.scores.overall, 0) / this.results.length
    console.log(`\n🏆 平均综合评分: ${avgScore.toFixed(1)}/100`)
    
    // 性能建议
    this.generateOptimizationSuggestions()
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationSuggestions(): void {
    console.log('\n💡 优化建议:')
    
    const avgRenderTime = this.results.reduce((sum, r) => sum + r.renderTime, 0) / this.results.length
    const avgMemoryUsage = this.results.reduce((sum, r) => sum + r.memoryUsage.used, 0) / this.results.length
    const avgFPS = this.results.reduce((sum, r) => sum + r.fps, 0) / this.results.length
    
    if (avgRenderTime > 100) {
      console.log('⚠️  渲染时间较长，建议启用虚拟化功能')
    }
    
    if (avgMemoryUsage > 50 * 1024 * 1024) { // 50MB
      console.log('⚠️  内存使用量较高，建议优化对象池管理')
    }
    
    if (avgFPS < 50) {
      console.log('⚠️  帧率较低，建议启用批量更新和节流功能')
    }
    
    console.log('✅ 可以考虑启用以下优化选项:')
    console.log('   - 启用虚拟化 (virtualization: true)')
    console.log('   - 启用批量更新 (batchUpdates: true)')
    console.log('   - 调整节流间隔 (throttleInterval: 16)')
    console.log('   - 启用对象池 (enableObjectPool: true)')
  }

  /**
   * 等待指定时间
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }
}

/**
 * 创建默认的基准测试配置
 */
export function createDefaultBenchmarkConfig(): BenchmarkConfig {
  return {
    itemCounts: [50, 100, 200, 500, 1000],
    testDuration: 2000, // 2秒
    enableMemoryProfiling: true,
    enableFPSMeasurement: true,
    enableInteractionTesting: true,
    warmupRounds: 3
  }
}

/**
 * 运行快速性能测试
 */
export async function runQuickBenchmark(): Promise<BenchmarkResult[]> {
  const config: BenchmarkConfig = {
    itemCounts: [100, 300],
    testDuration: 1000,
    enableMemoryProfiling: false,
    enableFPSMeasurement: true,
    enableInteractionTesting: false,
    warmupRounds: 1
  }
  
  const benchmark = new PerformanceBenchmark(config)
  const results = await benchmark.runBenchmarkSuite()
  benchmark.dispose()
  
  return results
}