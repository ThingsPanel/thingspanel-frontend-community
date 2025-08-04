/**
 * Card2.1 核心类型定义
 * 保持简洁，只定义最必要的类型
 */

import type { Component } from 'vue'

// ====== 基础组件定义 ======

export interface CardComponent {
  id: string
  name: string
  component: Component
  config?: Component // 配置组件（可选）
  poster?: string // 预览图（可选）
}

// ====== 配置相关 ======

export interface CardConfig {
  [key: string]: any
}

export interface ConfigContext {
  config: CardConfig
  updateConfig?: (updates: Partial<CardConfig>) => void
}

// ====== 布局相关 ======

export interface CardLayout {
  id: string
  x: number
  y: number
  w: number
  h: number
  component: string
  config: CardConfig
}

// ====== 注册表 ======

export interface CardRegistry {
  register(card: CardComponent): void
  unregister(id: string): void
  get(id: string): CardComponent | undefined
  getAll(): CardComponent[]
  has(id: string): boolean
}
