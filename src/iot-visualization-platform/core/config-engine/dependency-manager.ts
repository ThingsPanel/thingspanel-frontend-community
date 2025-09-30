/**
 * 配置依赖管理和循环检测系统
 *
 * 企业级依赖管理系统，处理组件间复杂的依赖关系
 *
 * 主要特性：
 * 1. 依赖关系建模 - 多种类型的依赖关系支持
 * 2. 循环依赖检测 - 深度优先和广度优先算法
 * 3. 依赖拓扑排序 - 安全的执行顺序计算
 * 4. 影响分析 - 变更影响范围评估
 * 5. 依赖可视化 - 依赖图的生成和分析
 * 6. 智能建议 - 依赖优化建议
 * 7. 版本兼容性 - 跨版本依赖检查
 * 8. 性能优化 - 大规模依赖的高效处理
 *
 * 创建时间：2025年1月
 * 作者：ThingsPanel Team
 */

import { EventEmitter } from 'events'
import type { WidgetConfiguration } from './enhanced-config-state-manager'

// ========== 🎯 依赖系统类型定义 ==========

/**
 * 依赖类型枚举
 */
export enum DependencyType {
  DATA = 'data',                    // 数据依赖：组件需要其他组件的数据
  EVENT = 'event',                  // 事件依赖：组件监听其他组件的事件
  LAYOUT = 'layout',                // 布局依赖：组件的布局依赖其他组件
  THEME = 'theme',                  // 主题依赖：组件的样式依赖主题设置
  CONFIG = 'config',                // 配置依赖：组件配置依赖其他配置
  RENDER = 'render',                // 渲染依赖：组件渲染依赖其他组件
  LIFECYCLE = 'lifecycle',          // 生命周期依赖：组件生命周期依赖
  PERMISSION = 'permission',        // 权限依赖：组件依赖权限设置
  RESOURCE = 'resource',            // 资源依赖：组件依赖外部资源
  COMPUTED = 'computed'             // 计算依赖：组件依赖计算结果
}

/**
 * 依赖关系定义
 */
export interface DependencyRelation {
  id: string                        // 依赖关系唯一ID
  sourceId: string                  // 依赖源组件ID
  targetId: string                  // 依赖目标组件ID
  type: DependencyType              // 依赖类型
  description?: string              // 依赖描述
  isOptional: boolean               // 是否可选依赖
  version?: string                  // 依赖版本要求
  condition?: DependencyCondition   // 依赖条件
  metadata: {
    createdAt: number               // 创建时间
    updatedAt: number               // 更新时间
    createdBy: string               // 创建者
    tags: string[]                  // 依赖标签
    weight: number                  // 依赖权重
    priority: number                // 依赖优先级
  }
}

/**
 * 依赖条件
 */
export interface DependencyCondition {
  field: string                     // 条件字段
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'exists' | 'custom'
  value?: any                       // 条件值
  customValidator?: (source: any, target: any) => boolean // 自定义验证器
}

/**
 * 依赖节点
 */
export interface DependencyNode {
  id: string                        // 组件ID
  configuration?: WidgetConfiguration // 组件配置
  dependencies: DependencyRelation[] // 出度依赖（此节点依赖的其他节点）
  dependents: DependencyRelation[]  // 入度依赖（依赖此节点的其他节点）
  metadata: {
    level: number                   // 依赖层级
    visited: boolean                // 遍历标记
    inStack: boolean                // 栈中标记（用于循环检测）
    lastUpdated: number             // 最后更新时间
    tags: string[]                  // 节点标签
  }
}

/**
 * 依赖图
 */
export interface DependencyGraph {
  nodes: Map<string, DependencyNode> // 节点映射
  edges: Map<string, DependencyRelation> // 边映射
  metadata: {
    version: string                 // 图版本
    createdAt: number              // 创建时间
    updatedAt: number              // 更新时间
    nodeCount: number              // 节点数量
    edgeCount: number              // 边数量
    cycleCount: number             // 循环数量
    maxDepth: number               // 最大深度
  }
}

/**
 * 循环依赖信息
 */
export interface CircularDependency {
  id: string                        // 循环ID
  cycle: string[]                   // 循环路径（组件ID数组）
  type: DependencyType              // 循环涉及的依赖类型
  severity: 'low' | 'medium' | 'high' | 'critical' // 严重程度
  description: string               // 循环描述
  suggestion: string                // 解决建议
  detectedAt: number                // 检测时间
  affectedComponents: string[]      // 受影响的组件
}

/**
 * 依赖分析结果
 */
export interface DependencyAnalysis {
  isValid: boolean                  // 依赖图是否有效
  hasCycles: boolean                // 是否有循环依赖
  cycles: CircularDependency[]      // 循环依赖列表
  topologicalOrder: string[]        // 拓扑排序结果
  levels: Map<number, string[]>     // 依赖层级
  suggestions: DependencySuggestion[] // 优化建议
  statistics: {
    totalNodes: number              // 总节点数
    totalEdges: number              // 总边数
    maxDepth: number                // 最大深度
    averageDependencies: number     // 平均依赖数
    isolatedNodes: string[]         // 孤立节点
    criticalPath: string[]          // 关键路径
  }
}

/**
 * 依赖优化建议
 */
export interface DependencySuggestion {
  type: 'remove' | 'add' | 'modify' | 'restructure'
  severity: 'info' | 'warning' | 'error'
  title: string
  description: string
  affectedComponents: string[]
  action: {
    type: string
    params: Record<string, any>
  }
  benefit: string
}

/**
 * 影响分析结果
 */
export interface ImpactAnalysis {
  sourceComponent: string           // 变更的源组件
  directImpacts: string[]           // 直接影响的组件
  indirectImpacts: string[]         // 间接影响的组件
  cascadeDepth: number              // 影响级联深度
  impactedTypes: DependencyType[]   // 影响的依赖类型
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  recommendations: string[]         // 建议
}

/**
 * 依赖验证选项
 */
export interface DependencyValidationOptions {
  checkCycles: boolean              // 检查循环依赖
  maxDepth: number                  // 最大依赖深度
  allowOptionalCycles: boolean      // 允许可选依赖形成循环
  strictVersionCheck: boolean       // 严格版本检查
  performImpactAnalysis: boolean    // 执行影响分析
}

// ========== 🚀 依赖管理器主类 ==========

/**
 * 配置依赖管理器
 */
export class ConfigurationDependencyManager extends EventEmitter {
  // ========== 存储 ==========
  private dependencyGraph: DependencyGraph
  private analysisCache = new Map<string, DependencyAnalysis>()
  private impactCache = new Map<string, ImpactAnalysis>()

  // ========== 配置 ==========
  private readonly MAX_DEPENDENCY_DEPTH = 20
  private readonly MAX_CYCLE_DETECTION_DEPTH = 50
  private readonly CACHE_TTL = 300000 // 5分钟缓存
  private readonly MAX_ANALYSIS_CACHE_SIZE = 100

  // ========== 算法选择 ==========
  private cycleDetectionAlgorithm: 'dfs' | 'tarjan' | 'johnson' = 'dfs'

  constructor() {
    super()
    this.dependencyGraph = this.createEmptyGraph()
  }

  // ========== 🎯 核心依赖管理方法 ==========

  /**
   * 添加依赖关系
   */
  addDependency(dependency: Omit<DependencyRelation, 'id' | 'metadata'>): string {
    // 生成依赖ID
    const dependencyId = this.generateDependencyId(dependency.sourceId, dependency.targetId, dependency.type)

    // 检查是否已存在
    if (this.dependencyGraph.edges.has(dependencyId)) {
      console.warn(`依赖关系已存在: ${dependencyId}`)
      return dependencyId
    }

    // 创建完整的依赖关系
    const fullDependency: DependencyRelation = {
      ...dependency,
      id: dependencyId,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'system',
        tags: [],
        weight: 1,
        priority: 1
      }
    }

    // 检查是否会创建循环（如果不允许循环）
    if (!dependency.isOptional && this.wouldCreateCycle(dependency.sourceId, dependency.targetId)) {
      const error = `添加依赖会创建循环: ${dependency.sourceId} -> ${dependency.targetId}`
      console.error(error)
      this.emit('dependencyRejected', { dependency: fullDependency, reason: error })
      throw new Error(error)
    }

    // 添加到图中
    this.addDependencyToGraph(fullDependency)

    // 清理缓存
    this.clearAnalysisCache()

    this.emit('dependencyAdded', fullDependency)

    return dependencyId
  }

  /**
   * 移除依赖关系
   */
  removeDependency(dependencyId: string): boolean {
    const dependency = this.dependencyGraph.edges.get(dependencyId)
    if (!dependency) {
      return false
    }

    // 从图中移除
    this.removeDependencyFromGraph(dependencyId)

    // 清理缓存
    this.clearAnalysisCache()

    this.emit('dependencyRemoved', dependency)

    return true
  }

  /**
   * 更新依赖关系
   */
  updateDependency(dependencyId: string, updates: Partial<DependencyRelation>): boolean {
    const dependency = this.dependencyGraph.edges.get(dependencyId)
    if (!dependency) {
      return false
    }

    // 更新依赖信息
    const updatedDependency: DependencyRelation = {
      ...dependency,
      ...updates,
      id: dependencyId, // 保持ID不变
      metadata: {
        ...dependency.metadata,
        ...updates.metadata,
        updatedAt: Date.now()
      }
    }

    // 如果修改了源或目标，需要重新检查循环
    if (updates.sourceId || updates.targetId) {
      const newSourceId = updates.sourceId || dependency.sourceId
      const newTargetId = updates.targetId || dependency.targetId

      if (!updatedDependency.isOptional && this.wouldCreateCycle(newSourceId, newTargetId, dependencyId)) {
        const error = `更新依赖会创建循环: ${newSourceId} -> ${newTargetId}`
        console.error(error)
        throw new Error(error)
      }
    }

    // 更新图中的依赖
    this.dependencyGraph.edges.set(dependencyId, updatedDependency)
    this.updateGraphStructure(dependency, updatedDependency)

    // 清理缓存
    this.clearAnalysisCache()

    this.emit('dependencyUpdated', updatedDependency, dependency)

    return true
  }

  /**
   * 获取组件的依赖关系
   */
  getDependencies(componentId: string): {
    dependencies: DependencyRelation[]  // 此组件依赖的其他组件
    dependents: DependencyRelation[]    // 依赖此组件的其他组件
  } {
    const node = this.dependencyGraph.nodes.get(componentId)
    if (!node) {
      return { dependencies: [], dependents: [] }
    }

    return {
      dependencies: [...node.dependencies],
      dependents: [...node.dependents]
    }
  }

  /**
   * 获取依赖关系详情
   */
  getDependencyDetails(dependencyId: string): DependencyRelation | null {
    return this.dependencyGraph.edges.get(dependencyId) || null
  }

  // ========== 🔍 依赖分析方法 ==========

  /**
   * 分析依赖图
   */
  analyzeDependencies(options: DependencyValidationOptions = {
    checkCycles: true,
    maxDepth: this.MAX_DEPENDENCY_DEPTH,
    allowOptionalCycles: true,
    strictVersionCheck: false,
    performImpactAnalysis: false
  }): DependencyAnalysis {
    const cacheKey = this.generateAnalysisCacheKey(options)
    const cached = this.analysisCache.get(cacheKey)

    if (cached && Date.now() - cached.statistics.totalNodes < this.CACHE_TTL) {
      return cached
    }

    const startTime = Date.now()

    // 执行各种分析
    const cycles = options.checkCycles ? this.detectCycles() : []
    const topologicalOrder = this.calculateTopologicalOrder()
    const levels = this.calculateDependencyLevels()
    const suggestions = this.generateOptimizationSuggestions()
    const statistics = this.calculateStatistics()

    const analysis: DependencyAnalysis = {
      isValid: cycles.length === 0,
      hasCycles: cycles.length > 0,
      cycles,
      topologicalOrder,
      levels,
      suggestions,
      statistics
    }

    // 缓存结果
    this.analysisCache.set(cacheKey, analysis)
    this.cleanupAnalysisCache()

    const duration = Date.now() - startTime
    this.emit('dependencyAnalysisCompleted', { analysis, duration })

    return analysis
  }

  /**
   * 检测循环依赖
   */
  detectCycles(): CircularDependency[] {
    switch (this.cycleDetectionAlgorithm) {
      case 'dfs':
        return this.detectCyclesDFS()
      case 'tarjan':
        return this.detectCyclesTarjan()
      case 'johnson':
        return this.detectCyclesJohnson()
      default:
        return this.detectCyclesDFS()
    }
  }

  /**
   * 分析变更影响
   */
  analyzeImpact(componentId: string, changeType: 'update' | 'delete' | 'add' = 'update'): ImpactAnalysis {
    const cacheKey = `impact_${componentId}_${changeType}`
    const cached = this.impactCache.get(cacheKey)

    if (cached && Date.now() - cached.cascadeDepth < this.CACHE_TTL) {
      return cached
    }

    const directImpacts = this.getDirectDependents(componentId)
    const indirectImpacts = this.getIndirectDependents(componentId)
    const cascadeDepth = this.calculateCascadeDepth(componentId)
    const impactedTypes = this.getImpactedDependencyTypes(componentId)
    const riskLevel = this.assessRiskLevel(directImpacts.length, indirectImpacts.length, cascadeDepth)
    const recommendations = this.generateImpactRecommendations(componentId, changeType, riskLevel)

    const analysis: ImpactAnalysis = {
      sourceComponent: componentId,
      directImpacts,
      indirectImpacts,
      cascadeDepth,
      impactedTypes,
      riskLevel,
      recommendations
    }

    // 缓存结果
    this.impactCache.set(cacheKey, analysis)

    return analysis
  }

  /**
   * 验证依赖关系
   */
  validateDependencies(): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查循环依赖
    const cycles = this.detectCycles()
    for (const cycle of cycles) {
      if (cycle.severity === 'critical' || cycle.severity === 'high') {
        errors.push(`严重循环依赖: ${cycle.cycle.join(' -> ')}`)
      } else {
        warnings.push(`循环依赖: ${cycle.cycle.join(' -> ')}`)
      }
    }

    // 检查依赖深度
    const levels = this.calculateDependencyLevels()
    const maxLevel = Math.max(...levels.keys())
    if (maxLevel > this.MAX_DEPENDENCY_DEPTH) {
      warnings.push(`依赖深度过深: ${maxLevel} (建议 < ${this.MAX_DEPENDENCY_DEPTH})`)
    }

    // 检查孤立节点
    const isolatedNodes = this.findIsolatedNodes()
    if (isolatedNodes.length > 0) {
      warnings.push(`发现孤立节点: ${isolatedNodes.join(', ')}`)
    }

    // 检查版本兼容性
    const versionConflicts = this.checkVersionCompatibility()
    errors.push(...versionConflicts)

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // ========== 🎨 依赖可视化方法 ==========

  /**
   * 生成依赖图的可视化数据
   */
  generateVisualizationData(): {
    nodes: Array<{
      id: string
      label: string
      level: number
      type: string
      dependencies: number
      dependents: number
    }>
    edges: Array<{
      id: string
      source: string
      target: string
      type: DependencyType
      isOptional: boolean
      weight: number
    }>
    layout: {
      levels: Map<number, string[]>
      positions: Map<string, { x: number; y: number }>
    }
  } {
    const nodes: any[] = []
    const edges: any[] = []
    const levels = this.calculateDependencyLevels()

    // 生成节点数据
    for (const [nodeId, node] of this.dependencyGraph.nodes) {
      nodes.push({
        id: nodeId,
        label: nodeId,
        level: node.metadata.level,
        type: 'component',
        dependencies: node.dependencies.length,
        dependents: node.dependents.length
      })
    }

    // 生成边数据
    for (const [edgeId, edge] of this.dependencyGraph.edges) {
      edges.push({
        id: edgeId,
        source: edge.sourceId,
        target: edge.targetId,
        type: edge.type,
        isOptional: edge.isOptional,
        weight: edge.metadata.weight
      })
    }

    // 计算布局位置
    const positions = this.calculateNodePositions(levels)

    return {
      nodes,
      edges,
      layout: {
        levels,
        positions
      }
    }
  }

  /**
   * 导出依赖图为DOT格式（Graphviz）
   */
  exportToDOT(): string {
    const lines: string[] = []
    lines.push('digraph DependencyGraph {')
    lines.push('  rankdir=TB;')
    lines.push('  node [shape=box, style=rounded];')

    // 添加节点
    for (const [nodeId, node] of this.dependencyGraph.nodes) {
      const label = `${nodeId}\\n(${node.dependencies.length}→, ${node.dependents.length}←)`
      lines.push(`  "${nodeId}" [label="${label}"];`)
    }

    // 添加边
    for (const edge of this.dependencyGraph.edges.values()) {
      const style = edge.isOptional ? 'dashed' : 'solid'
      const color = this.getEdgeColor(edge.type)
      lines.push(`  "${edge.sourceId}" -> "${edge.targetId}" [style=${style}, color=${color}, label="${edge.type}"];`)
    }

    lines.push('}')
    return lines.join('\n')
  }

  // ========== 🔧 工具和管理方法 ==========

  /**
   * 清理依赖图
   */
  cleanup(): void {
    // 移除无效的依赖关系
    const invalidDependencies: string[] = []

    for (const [dependencyId, dependency] of this.dependencyGraph.edges) {
      const sourceExists = this.dependencyGraph.nodes.has(dependency.sourceId)
      const targetExists = this.dependencyGraph.nodes.has(dependency.targetId)

      if (!sourceExists || !targetExists) {
        invalidDependencies.push(dependencyId)
      }
    }

    for (const dependencyId of invalidDependencies) {
      this.removeDependency(dependencyId)
    }

    // 清理孤立节点
    const isolatedNodes = this.findIsolatedNodes()
    for (const nodeId of isolatedNodes) {
      this.removeNode(nodeId)
    }

    // 更新图元数据
    this.updateGraphMetadata()

  }

  /**
   * 重置依赖图
   */
  reset(): void {
    this.dependencyGraph = this.createEmptyGraph()
    this.clearAnalysisCache()
    this.impactCache.clear()

    this.emit('dependencyGraphReset')
  }

  /**
   * 获取依赖图快照
   */
  getSnapshot(): DependencyGraph {
    return JSON.parse(JSON.stringify(this.dependencyGraph))
  }

  /**
   * 恢复依赖图快照
   */
  restoreSnapshot(snapshot: DependencyGraph): void {
    this.dependencyGraph = snapshot
    this.clearAnalysisCache()
    this.impactCache.clear()

    this.emit('dependencyGraphRestored', snapshot)
  }

  /**
   * 获取依赖统计信息
   */
  getStatistics(): {
    totalNodes: number
    totalEdges: number
    avgDependencies: number
    maxDepth: number
    cycleCount: number
    isolatedNodes: number
  } {
    const stats = this.calculateStatistics()
    return {
      totalNodes: stats.totalNodes,
      totalEdges: stats.totalEdges,
      avgDependencies: stats.averageDependencies,
      maxDepth: stats.maxDepth,
      cycleCount: this.detectCycles().length,
      isolatedNodes: stats.isolatedNodes.length
    }
  }

  // ========== 🔧 私有方法 ==========

  /**
   * 创建空的依赖图
   */
  private createEmptyGraph(): DependencyGraph {
    return {
      nodes: new Map(),
      edges: new Map(),
      metadata: {
        version: '1.0.0',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        nodeCount: 0,
        edgeCount: 0,
        cycleCount: 0,
        maxDepth: 0
      }
    }
  }

  /**
   * 生成依赖ID
   */
  private generateDependencyId(sourceId: string, targetId: string, type: DependencyType): string {
    return `dep_${sourceId}_${targetId}_${type}_${Date.now()}`
  }

  /**
   * 检查是否会创建循环
   */
  private wouldCreateCycle(sourceId: string, targetId: string, excludeDepId?: string): boolean {
    // 如果目标就是源，直接循环
    if (sourceId === targetId) {
      return true
    }

    // 检查从目标到源是否存在路径
    return this.hasPath(targetId, sourceId, new Set(), excludeDepId)
  }

  /**
   * 检查是否存在路径
   */
  private hasPath(
    from: string,
    to: string,
    visited: Set<string> = new Set(),
    excludeDepId?: string,
    depth = 0
  ): boolean {
    if (depth > this.MAX_CYCLE_DETECTION_DEPTH) {
      return false // 防止无限递归
    }

    if (from === to) {
      return true
    }

    if (visited.has(from)) {
      return false
    }

    visited.add(from)

    const node = this.dependencyGraph.nodes.get(from)
    if (!node) {
      return false
    }

    for (const dependency of node.dependencies) {
      if (excludeDepId && dependency.id === excludeDepId) {
        continue
      }

      if (this.hasPath(dependency.targetId, to, new Set(visited), excludeDepId, depth + 1)) {
        return true
      }
    }

    return false
  }

  /**
   * 添加依赖到图中
   */
  private addDependencyToGraph(dependency: DependencyRelation): void {
    // 确保源节点和目标节点存在
    this.ensureNodeExists(dependency.sourceId)
    this.ensureNodeExists(dependency.targetId)

    // 添加边
    this.dependencyGraph.edges.set(dependency.id, dependency)

    // 更新节点的依赖关系
    const sourceNode = this.dependencyGraph.nodes.get(dependency.sourceId)!
    const targetNode = this.dependencyGraph.nodes.get(dependency.targetId)!

    sourceNode.dependencies.push(dependency)
    targetNode.dependents.push(dependency)

    // 更新图元数据
    this.updateGraphMetadata()
  }

  /**
   * 从图中移除依赖
   */
  private removeDependencyFromGraph(dependencyId: string): void {
    const dependency = this.dependencyGraph.edges.get(dependencyId)
    if (!dependency) {
      return
    }

    // 移除边
    this.dependencyGraph.edges.delete(dependencyId)

    // 更新节点的依赖关系
    const sourceNode = this.dependencyGraph.nodes.get(dependency.sourceId)
    const targetNode = this.dependencyGraph.nodes.get(dependency.targetId)

    if (sourceNode) {
      sourceNode.dependencies = sourceNode.dependencies.filter(dep => dep.id !== dependencyId)
    }

    if (targetNode) {
      targetNode.dependents = targetNode.dependents.filter(dep => dep.id !== dependencyId)
    }

    // 更新图元数据
    this.updateGraphMetadata()
  }

  /**
   * 确保节点存在
   */
  private ensureNodeExists(nodeId: string): void {
    if (!this.dependencyGraph.nodes.has(nodeId)) {
      const node: DependencyNode = {
        id: nodeId,
        dependencies: [],
        dependents: [],
        metadata: {
          level: 0,
          visited: false,
          inStack: false,
          lastUpdated: Date.now(),
          tags: []
        }
      }
      this.dependencyGraph.nodes.set(nodeId, node)
    }
  }

  /**
   * 移除节点
   */
  private removeNode(nodeId: string): void {
    const node = this.dependencyGraph.nodes.get(nodeId)
    if (!node) {
      return
    }

    // 移除所有相关的依赖关系
    const dependenciesToRemove = [
      ...node.dependencies.map(dep => dep.id),
      ...node.dependents.map(dep => dep.id)
    ]

    for (const depId of dependenciesToRemove) {
      this.removeDependency(depId)
    }

    // 移除节点
    this.dependencyGraph.nodes.delete(nodeId)

    // 更新图元数据
    this.updateGraphMetadata()
  }

  /**
   * 更新图结构
   */
  private updateGraphStructure(oldDep: DependencyRelation, newDep: DependencyRelation): void {
    // 如果源或目标发生变化，需要重新构建节点关系
    if (oldDep.sourceId !== newDep.sourceId || oldDep.targetId !== newDep.targetId) {
      this.removeDependencyFromGraph(oldDep.id)
      this.addDependencyToGraph(newDep)
    }
  }

  /**
   * 更新图元数据
   */
  private updateGraphMetadata(): void {
    this.dependencyGraph.metadata.updatedAt = Date.now()
    this.dependencyGraph.metadata.nodeCount = this.dependencyGraph.nodes.size
    this.dependencyGraph.metadata.edgeCount = this.dependencyGraph.edges.size
    this.dependencyGraph.metadata.maxDepth = this.calculateMaxDepth()
  }

  /**
   * 使用DFS检测循环
   */
  private detectCyclesDFS(): CircularDependency[] {
    const cycles: CircularDependency[] = []
    const visited = new Set<string>()
    const recStack = new Set<string>()
    const path: string[] = []

    for (const nodeId of this.dependencyGraph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        this.dfsVisit(nodeId, visited, recStack, path, cycles)
      }
    }

    return cycles
  }

  /**
   * DFS访问节点
   */
  private dfsVisit(
    nodeId: string,
    visited: Set<string>,
    recStack: Set<string>,
    path: string[],
    cycles: CircularDependency[]
  ): void {
    visited.add(nodeId)
    recStack.add(nodeId)
    path.push(nodeId)

    const node = this.dependencyGraph.nodes.get(nodeId)
    if (!node) {
      return
    }

    for (const dependency of node.dependencies) {
      const targetId = dependency.targetId

      if (recStack.has(targetId)) {
        // 找到循环
        const cycleStart = path.indexOf(targetId)
        const cyclePath = [...path.slice(cycleStart), targetId]

        cycles.push({
          id: `cycle_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          cycle: cyclePath,
          type: dependency.type,
          severity: this.assessCycleSeverity(cyclePath, dependency),
          description: `循环依赖: ${cyclePath.join(' -> ')}`,
          suggestion: this.generateCycleSuggestion(cyclePath, dependency),
          detectedAt: Date.now(),
          affectedComponents: cyclePath
        })
      } else if (!visited.has(targetId)) {
        this.dfsVisit(targetId, visited, recStack, path, cycles)
      }
    }

    recStack.delete(nodeId)
    path.pop()
  }

  /**
   * 使用Tarjan算法检测强连通分量
   */
  private detectCyclesTarjan(): CircularDependency[] {
    const cycles: CircularDependency[] = []
    const index = new Map<string, number>()
    const lowlink = new Map<string, number>()
    const onStack = new Set<string>()
    const stack: string[] = []
    let currentIndex = 0

    for (const nodeId of this.dependencyGraph.nodes.keys()) {
      if (!index.has(nodeId)) {
        this.tarjanStrongConnect(nodeId, index, lowlink, onStack, stack, cycles, currentIndex)
      }
    }

    return cycles
  }

  /**
   * Tarjan强连通分量算法
   */
  private tarjanStrongConnect(
    nodeId: string,
    index: Map<string, number>,
    lowlink: Map<string, number>,
    onStack: Set<string>,
    stack: string[],
    cycles: CircularDependency[],
    currentIndex: number
  ): void {
    index.set(nodeId, currentIndex)
    lowlink.set(nodeId, currentIndex)
    currentIndex++
    stack.push(nodeId)
    onStack.add(nodeId)

    const node = this.dependencyGraph.nodes.get(nodeId)
    if (!node) {
      return
    }

    for (const dependency of node.dependencies) {
      const targetId = dependency.targetId

      if (!index.has(targetId)) {
        this.tarjanStrongConnect(targetId, index, lowlink, onStack, stack, cycles, currentIndex)
        lowlink.set(nodeId, Math.min(lowlink.get(nodeId)!, lowlink.get(targetId)!))
      } else if (onStack.has(targetId)) {
        lowlink.set(nodeId, Math.min(lowlink.get(nodeId)!, index.get(targetId)!))
      }
    }

    // 如果nodeId是强连通分量的根
    if (lowlink.get(nodeId) === index.get(nodeId)) {
      const component: string[] = []
      let w: string

      do {
        w = stack.pop()!
        onStack.delete(w)
        component.push(w)
      } while (w !== nodeId)

      // 如果强连通分量包含多个节点，则存在循环
      if (component.length > 1) {
        cycles.push({
          id: `cycle_tarjan_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          cycle: component.reverse(),
          type: DependencyType.CONFIG, // 默认类型
          severity: this.assessCycleSeverity(component),
          description: `强连通分量循环: ${component.join(' -> ')}`,
          suggestion: `考虑重构这些组件的依赖关系`,
          detectedAt: Date.now(),
          affectedComponents: component
        })
      }
    }
  }

  /**
   * 使用Johnson算法检测所有基本循环
   */
  private detectCyclesJohnson(): CircularDependency[] {
    // Johnson算法实现比较复杂，这里提供简化版本
    // 实际项目中应该使用完整的Johnson算法实现
    return this.detectCyclesDFS()
  }

  /**
   * 计算拓扑排序
   */
  private calculateTopologicalOrder(): string[] {
    const inDegree = new Map<string, number>()
    const result: string[] = []
    const queue: string[] = []

    // 计算入度
    for (const nodeId of this.dependencyGraph.nodes.keys()) {
      inDegree.set(nodeId, 0)
    }

    for (const dependency of this.dependencyGraph.edges.values()) {
      const currentCount = inDegree.get(dependency.targetId) || 0
      inDegree.set(dependency.targetId, currentCount + 1)
    }

    // 找到所有入度为0的节点
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId)
      }
    }

    // 拓扑排序
    while (queue.length > 0) {
      const nodeId = queue.shift()!
      result.push(nodeId)

      const node = this.dependencyGraph.nodes.get(nodeId)
      if (node) {
        for (const dependency of node.dependencies) {
          const targetId = dependency.targetId
          const newDegree = (inDegree.get(targetId) || 0) - 1
          inDegree.set(targetId, newDegree)

          if (newDegree === 0) {
            queue.push(targetId)
          }
        }
      }
    }

    return result
  }

  /**
   * 计算依赖层级
   */
  private calculateDependencyLevels(): Map<number, string[]> {
    const levels = new Map<number, string[]>()
    const nodeLevel = new Map<string, number>()

    // 计算每个节点的层级
    for (const nodeId of this.dependencyGraph.nodes.keys()) {
      if (!nodeLevel.has(nodeId)) {
        this.calculateNodeLevel(nodeId, nodeLevel, new Set())
      }
    }

    // 按层级分组
    for (const [nodeId, level] of nodeLevel) {
      if (!levels.has(level)) {
        levels.set(level, [])
      }
      levels.get(level)!.push(nodeId)

      // 更新节点元数据
      const node = this.dependencyGraph.nodes.get(nodeId)
      if (node) {
        node.metadata.level = level
      }
    }

    return levels
  }

  /**
   * 计算节点层级
   */
  private calculateNodeLevel(
    nodeId: string,
    nodeLevel: Map<string, number>,
    visiting: Set<string>
  ): number {
    if (nodeLevel.has(nodeId)) {
      return nodeLevel.get(nodeId)!
    }

    if (visiting.has(nodeId)) {
      // 循环依赖，返回当前深度
      return visiting.size
    }

    visiting.add(nodeId)

    const node = this.dependencyGraph.nodes.get(nodeId)
    let maxLevel = 0

    if (node) {
      for (const dependency of node.dependencies) {
        const depLevel = this.calculateNodeLevel(dependency.targetId, nodeLevel, new Set(visiting))
        maxLevel = Math.max(maxLevel, depLevel + 1)
      }
    }

    visiting.delete(nodeId)
    nodeLevel.set(nodeId, maxLevel)
    return maxLevel
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationSuggestions(): DependencySuggestion[] {
    const suggestions: DependencySuggestion[] = []

    // 检查循环依赖
    const cycles = this.detectCycles()
    for (const cycle of cycles) {
      suggestions.push({
        type: 'restructure',
        severity: cycle.severity === 'critical' ? 'error' : 'warning',
        title: '解决循环依赖',
        description: cycle.description,
        affectedComponents: cycle.affectedComponents,
        action: {
          type: 'break_cycle',
          params: { cycleId: cycle.id, suggestions: cycle.suggestion }
        },
        benefit: '提高系统稳定性和可维护性'
      })
    }

    // 检查过深的依赖链
    const levels = this.calculateDependencyLevels()
    const maxLevel = Math.max(...levels.keys())
    if (maxLevel > 10) {
      suggestions.push({
        type: 'restructure',
        severity: 'warning',
        title: '依赖层级过深',
        description: `最大依赖深度为 ${maxLevel}，建议优化依赖结构`,
        affectedComponents: levels.get(maxLevel) || [],
        action: {
          type: 'flatten_dependencies',
          params: { maxLevel }
        },
        benefit: '减少复杂度，提高维护性'
      })
    }

    // 检查孤立节点
    const isolatedNodes = this.findIsolatedNodes()
    if (isolatedNodes.length > 0) {
      suggestions.push({
        type: 'remove',
        severity: 'info',
        title: '移除孤立组件',
        description: `发现 ${isolatedNodes.length} 个孤立组件`,
        affectedComponents: isolatedNodes,
        action: {
          type: 'remove_isolated',
          params: { nodes: isolatedNodes }
        },
        benefit: '清理无用组件，简化系统结构'
      })
    }

    return suggestions
  }

  /**
   * 计算统计信息
   */
  private calculateStatistics(): DependencyAnalysis['statistics'] {
    const totalNodes = this.dependencyGraph.nodes.size
    const totalEdges = this.dependencyGraph.edges.size
    const maxDepth = this.calculateMaxDepth()
    const averageDependencies = totalNodes > 0 ? totalEdges / totalNodes : 0
    const isolatedNodes = this.findIsolatedNodes()
    const criticalPath = this.calculateCriticalPath()

    return {
      totalNodes,
      totalEdges,
      maxDepth,
      averageDependencies,
      isolatedNodes,
      criticalPath
    }
  }

  /**
   * 计算最大深度
   */
  private calculateMaxDepth(): number {
    const levels = this.calculateDependencyLevels()
    return levels.size > 0 ? Math.max(...levels.keys()) : 0
  }

  /**
   * 查找孤立节点
   */
  private findIsolatedNodes(): string[] {
    const isolated: string[] = []

    for (const [nodeId, node] of this.dependencyGraph.nodes) {
      if (node.dependencies.length === 0 && node.dependents.length === 0) {
        isolated.push(nodeId)
      }
    }

    return isolated
  }

  /**
   * 计算关键路径
   */
  private calculateCriticalPath(): string[] {
    // 这里实现关键路径算法，找到最长的依赖链
    const levels = this.calculateDependencyLevels()
    const maxLevel = Math.max(...levels.keys())

    // 简化实现：返回最深层级的一个节点到根节点的路径
    const deepestNodes = levels.get(maxLevel) || []
    if (deepestNodes.length === 0) {
      return []
    }

    const targetNode = deepestNodes[0]
    return this.findPathToRoot(targetNode)
  }

  /**
   * 查找到根节点的路径
   */
  private findPathToRoot(nodeId: string): string[] {
    const path: string[] = [nodeId]
    const node = this.dependencyGraph.nodes.get(nodeId)

    if (node && node.dependencies.length > 0) {
      // 选择第一个依赖作为路径
      const nextNodeId = node.dependencies[0].targetId
      const restPath = this.findPathToRoot(nextNodeId)
      path.push(...restPath)
    }

    return path
  }

  /**
   * 获取直接依赖者
   */
  private getDirectDependents(componentId: string): string[] {
    const node = this.dependencyGraph.nodes.get(componentId)
    return node ? node.dependents.map(dep => dep.sourceId) : []
  }

  /**
   * 获取间接依赖者
   */
  private getIndirectDependents(componentId: string, visited = new Set<string>()): string[] {
    if (visited.has(componentId)) {
      return []
    }

    visited.add(componentId)
    const indirectDependents: string[] = []
    const directDependents = this.getDirectDependents(componentId)

    for (const dependent of directDependents) {
      indirectDependents.push(...this.getIndirectDependents(dependent, visited))
    }

    return [...new Set(indirectDependents)]
  }

  /**
   * 计算级联深度
   */
  private calculateCascadeDepth(componentId: string, depth = 0, visited = new Set<string>()): number {
    if (visited.has(componentId) || depth > this.MAX_DEPENDENCY_DEPTH) {
      return depth
    }

    visited.add(componentId)
    const dependents = this.getDirectDependents(componentId)

    if (dependents.length === 0) {
      return depth
    }

    let maxDepth = depth
    for (const dependent of dependents) {
      const depthFromHere = this.calculateCascadeDepth(dependent, depth + 1, new Set(visited))
      maxDepth = Math.max(maxDepth, depthFromHere)
    }

    return maxDepth
  }

  /**
   * 获取影响的依赖类型
   */
  private getImpactedDependencyTypes(componentId: string): DependencyType[] {
    const types = new Set<DependencyType>()
    const node = this.dependencyGraph.nodes.get(componentId)

    if (node) {
      for (const dep of node.dependents) {
        types.add(dep.type)
      }
    }

    return Array.from(types)
  }

  /**
   * 评估风险级别
   */
  private assessRiskLevel(directCount: number, indirectCount: number, cascadeDepth: number): ImpactAnalysis['riskLevel'] {
    const totalImpact = directCount + indirectCount

    if (cascadeDepth > 10 || totalImpact > 20) {
      return 'critical'
    } else if (cascadeDepth > 5 || totalImpact > 10) {
      return 'high'
    } else if (cascadeDepth > 2 || totalImpact > 5) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  /**
   * 生成影响分析建议
   */
  private generateImpactRecommendations(
    componentId: string,
    changeType: string,
    riskLevel: ImpactAnalysis['riskLevel']
  ): string[] {
    const recommendations: string[] = []

    switch (riskLevel) {
      case 'critical':
        recommendations.push('⚠️ 高风险变更，建议分阶段实施')
        recommendations.push('📋 制定详细的回滚计划')
        recommendations.push('🧪 在测试环境充分验证')
        break
      case 'high':
        recommendations.push('⚡ 中高风险变更，需要谨慎处理')
        recommendations.push('📊 监控影响的组件状态')
        break
      case 'medium':
        recommendations.push('📝 关注受影响的组件')
        break
      case 'low':
        recommendations.push('✅ 低风险变更，可正常进行')
        break
    }

    if (changeType === 'delete') {
      recommendations.push('🔍 确认所有依赖组件已更新')
    }

    return recommendations
  }

  /**
   * 评估循环严重程度
   */
  private assessCycleSeverity(cycle: string[], dependency?: DependencyRelation): CircularDependency['severity'] {
    // 基于循环长度和依赖类型评估严重程度
    const cycleLength = cycle.length

    if (cycleLength <= 2) {
      return 'critical' // 直接循环最严重
    } else if (cycleLength <= 4) {
      return 'high'
    } else if (cycleLength <= 8) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  /**
   * 生成循环建议
   */
  private generateCycleSuggestion(cycle: string[], dependency: DependencyRelation): string {
    if (cycle.length === 2) {
      return `考虑将 ${dependency.sourceId} 对 ${dependency.targetId} 的依赖改为事件通信`
    } else {
      return `考虑引入中介组件或重构依赖关系来打破循环`
    }
  }

  /**
   * 检查版本兼容性
   */
  private checkVersionCompatibility(): string[] {
    const conflicts: string[] = []

    // 这里可以实现版本兼容性检查逻辑
    // 现在返回空数组
    return conflicts
  }

  /**
   * 计算节点位置（用于可视化）
   */
  private calculateNodePositions(levels: Map<number, string[]>): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>()
    const levelHeight = 100
    const nodeSpacing = 150

    for (const [level, nodes] of levels) {
      const y = level * levelHeight
      const totalWidth = (nodes.length - 1) * nodeSpacing
      const startX = -totalWidth / 2

      nodes.forEach((nodeId, index) => {
        const x = startX + index * nodeSpacing
        positions.set(nodeId, { x, y })
      })
    }

    return positions
  }

  /**
   * 获取边的颜色（用于可视化）
   */
  private getEdgeColor(type: DependencyType): string {
    const colors = {
      [DependencyType.DATA]: 'blue',
      [DependencyType.EVENT]: 'green',
      [DependencyType.LAYOUT]: 'orange',
      [DependencyType.THEME]: 'purple',
      [DependencyType.CONFIG]: 'red',
      [DependencyType.RENDER]: 'brown',
      [DependencyType.LIFECYCLE]: 'pink',
      [DependencyType.PERMISSION]: 'gray',
      [DependencyType.RESOURCE]: 'cyan',
      [DependencyType.COMPUTED]: 'yellow'
    }
    return colors[type] || 'black'
  }

  /**
   * 生成分析缓存键
   */
  private generateAnalysisCacheKey(options: DependencyValidationOptions): string {
    return JSON.stringify(options)
  }

  /**
   * 清理分析缓存
   */
  private clearAnalysisCache(): void {
    this.analysisCache.clear()
    this.impactCache.clear()
  }

  /**
   * 清理分析缓存（保留最近的）
   */
  private cleanupAnalysisCache(): void {
    if (this.analysisCache.size > this.MAX_ANALYSIS_CACHE_SIZE) {
      const entries = Array.from(this.analysisCache.entries())
      const toDelete = entries.slice(0, entries.length - this.MAX_ANALYSIS_CACHE_SIZE)

      for (const [key] of toDelete) {
        this.analysisCache.delete(key)
      }
    }
  }
}

// ========== 🚀 全局实例和工具函数 ==========

/**
 * 创建依赖关系的便捷函数
 */
export function createDependency(
  sourceId: string,
  targetId: string,
  type: DependencyType,
  options: {
    isOptional?: boolean
    description?: string
    version?: string
    condition?: DependencyCondition
  } = {}
): Omit<DependencyRelation, 'id' | 'metadata'> {
  return {
    sourceId,
    targetId,
    type,
    description: options.description,
    isOptional: options.isOptional || false,
    version: options.version,
    condition: options.condition
  }
}

/**
 * 依赖类型常量
 */
export const DependencyTypes = DependencyType

// 全局实例
export const configurationDependencyManager = new ConfigurationDependencyManager()

