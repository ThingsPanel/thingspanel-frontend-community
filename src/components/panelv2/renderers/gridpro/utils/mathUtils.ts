/**
 * GridPro 数学计算工具
 * 包含几何计算、插值算法、动画缓动函数等
 */

import type { Position, Rectangle } from '../types/gridpro'

/**
 * 几何计算工具类
 */
export class GeometryUtils {
  /**
   * 计算两点之间的距离
   */
  static distance(p1: Position, p2: Position): number {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * 计算矩形的中心点
   */
  static getRectCenter(rect: Rectangle): Position {
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2
    }
  }

  /**
   * 检查点是否在矩形内
   */
  static isPointInRect(point: Position, rect: Rectangle): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    )
  }

  /**
   * 检查两个矩形是否相交
   */
  static isRectIntersecting(rect1: Rectangle, rect2: Rectangle): boolean {
    return !(
      rect1.x > rect2.x + rect2.width ||
      rect1.x + rect1.width < rect2.x ||
      rect1.y > rect2.y + rect2.height ||
      rect1.y + rect1.height < rect2.y
    )
  }

  /**
   * 计算矩形的交集
   */
  static getRectIntersection(rect1: Rectangle, rect2: Rectangle): Rectangle | null {
    const x = Math.max(rect1.x, rect2.x)
    const y = Math.max(rect1.y, rect2.y)
    const width = Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - x
    const height = Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - y

    if (width <= 0 || height <= 0) {
      return null
    }

    return { x, y, width, height }
  }

  /**
   * 计算矩形的并集
   */
  static getRectUnion(rect1: Rectangle, rect2: Rectangle): Rectangle {
    const x = Math.min(rect1.x, rect2.x)
    const y = Math.min(rect1.y, rect2.y)
    const width = Math.max(rect1.x + rect1.width, rect2.x + rect2.width) - x
    const height = Math.max(rect1.y + rect1.height, rect2.y + rect2.height) - y

    return { x, y, width, height }
  }

  /**
   * 将点约束在矩形范围内
   */
  static clampPointToRect(point: Position, rect: Rectangle): Position {
    return {
      x: Math.max(rect.x, Math.min(point.x, rect.x + rect.width)),
      y: Math.max(rect.y, Math.min(point.y, rect.y + rect.height))
    }
  }

  /**
   * 计算点到矩形的最近距离
   */
  static distanceToRect(point: Position, rect: Rectangle): number {
    const clampedPoint = this.clampPointToRect(point, rect)
    return this.distance(point, clampedPoint)
  }

  /**
   * 计算角度（弧度）
   */
  static angle(from: Position, to: Position): number {
    return Math.atan2(to.y - from.y, to.x - from.x)
  }

  /**
   * 将角度从弧度转换为度
   */
  static radToDeg(rad: number): number {
    return rad * (180 / Math.PI)
  }

  /**
   * 将角度从度转换为弧度
   */
  static degToRad(deg: number): number {
    return deg * (Math.PI / 180)
  }
}

/**
 * 插值计算工具类
 */
export class InterpolationUtils {
  /**
   * 线性插值
   */
  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t
  }

  /**
   * 位置插值
   */
  static lerpPosition(start: Position, end: Position, t: number): Position {
    return {
      x: this.lerp(start.x, end.x, t),
      y: this.lerp(start.y, end.y, t)
    }
  }

  /**
   * 矩形插值
   */
  static lerpRect(start: Rectangle, end: Rectangle, t: number): Rectangle {
    return {
      x: this.lerp(start.x, end.x, t),
      y: this.lerp(start.y, end.y, t),
      width: this.lerp(start.width, end.width, t),
      height: this.lerp(start.height, end.height, t)
    }
  }

  /**
   * 平滑步进插值
   */
  static smoothStep(start: number, end: number, t: number): number {
    t = Math.max(0, Math.min(1, t))
    t = t * t * (3 - 2 * t)
    return this.lerp(start, end, t)
  }

  /**
   * 更平滑的步进插值
   */
  static smootherStep(start: number, end: number, t: number): number {
    t = Math.max(0, Math.min(1, t))
    t = t * t * t * (t * (t * 6 - 15) + 10)
    return this.lerp(start, end, t)
  }
}

/**
 * 缓动函数工具类
 */
export class EasingUtils {
  // 线性缓动
  static linear(t: number): number {
    return t
  }

  // 二次方缓动
  static easeInQuad(t: number): number {
    return t * t
  }

  static easeOutQuad(t: number): number {
    return t * (2 - t)
  }

  static easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  // 三次方缓动
  static easeInCubic(t: number): number {
    return t * t * t
  }

  static easeOutCubic(t: number): number {
    return 1 + (--t) * t * t
  }

  static easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
  }

  // 四次方缓动
  static easeInQuart(t: number): number {
    return t * t * t * t
  }

  static easeOutQuart(t: number): number {
    return 1 - (--t) * t * t * t
  }

  static easeInOutQuart(t: number): number {
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t
  }

  // 正弦缓动
  static easeInSine(t: number): number {
    return 1 - Math.cos((t * Math.PI) / 2)
  }

  static easeOutSine(t: number): number {
    return Math.sin((t * Math.PI) / 2)
  }

  static easeInOutSine(t: number): number {
    return -(Math.cos(Math.PI * t) - 1) / 2
  }

  // 指数缓动
  static easeInExpo(t: number): number {
    return t === 0 ? 0 : Math.pow(2, 10 * (t - 1))
  }

  static easeOutExpo(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
  }

  static easeInOutExpo(t: number): number {
    if (t === 0 || t === 1) return t
    return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2
  }

  // 弹性缓动
  static easeInElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4)
  }

  static easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  }

  static easeInOutElastic(t: number): number {
    const c5 = (2 * Math.PI) / 4.5
    return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1
  }

  // 回弹缓动
  static easeInBack(t: number): number {
    const c1 = 1.70158
    const c3 = c1 + 1
    return c3 * t * t * t - c1 * t * t
  }

  static easeOutBack(t: number): number {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  static easeInOutBack(t: number): number {
    const c1 = 1.70158
    const c2 = c1 * 1.525
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2
  }

  // 弹跳缓动
  static easeOutBounce(t: number): number {
    const n1 = 7.5625
    const d1 = 2.75

    if (t < 1 / d1) {
      return n1 * t * t
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375
    }
  }

  static easeInBounce(t: number): number {
    return 1 - this.easeOutBounce(1 - t)
  }

  static easeInOutBounce(t: number): number {
    return t < 0.5
      ? (1 - this.easeOutBounce(1 - 2 * t)) / 2
      : (1 + this.easeOutBounce(2 * t - 1)) / 2
  }

  /**
   * 获取缓动函数
   */
  static getEasingFunction(name: string): (t: number) => number {
    switch (name) {
      case 'linear': return this.linear
      case 'ease': return this.easeInOutQuad
      case 'ease-in': return this.easeInQuad
      case 'ease-out': return this.easeOutQuad
      case 'ease-in-out': return this.easeInOutQuad
      case 'spring': return this.easeOutElastic
      default: return this.linear
    }
  }
}

/**
 * 向量计算工具类
 */
export class VectorUtils {
  /**
   * 向量加法
   */
  static add(v1: Position, v2: Position): Position {
    return { x: v1.x + v2.x, y: v1.y + v2.y }
  }

  /**
   * 向量减法
   */
  static subtract(v1: Position, v2: Position): Position {
    return { x: v1.x - v2.x, y: v1.y - v2.y }
  }

  /**
   * 向量数乘
   */
  static scale(v: Position, scalar: number): Position {
    return { x: v.x * scalar, y: v.y * scalar }
  }

  /**
   * 向量长度
   */
  static magnitude(v: Position): number {
    return Math.sqrt(v.x * v.x + v.y * v.y)
  }

  /**
   * 向量归一化
   */
  static normalize(v: Position): Position {
    const mag = this.magnitude(v)
    if (mag === 0) return { x: 0, y: 0 }
    return { x: v.x / mag, y: v.y / mag }
  }

  /**
   * 向量点积
   */
  static dot(v1: Position, v2: Position): number {
    return v1.x * v2.x + v1.y * v2.y
  }

  /**
   * 向量叉积（2D）
   */
  static cross(v1: Position, v2: Position): number {
    return v1.x * v2.y - v1.y * v2.x
  }

  /**
   * 向量角度
   */
  static angle(v: Position): number {
    return Math.atan2(v.y, v.x)
  }

  /**
   * 旋转向量
   */
  static rotate(v: Position, angle: number): Position {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
      x: v.x * cos - v.y * sin,
      y: v.x * sin + v.y * cos
    }
  }
}

/**
 * 数值工具类
 */
export class MathUtils {
  /**
   * 将数值约束在指定范围内
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max))
  }

  /**
   * 将数值映射到新的范围
   */
  static map(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
  }

  /**
   * 检查数值是否在范围内
   */
  static inRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max
  }

  /**
   * 四舍五入到指定精度
   */
  static roundTo(value: number, precision: number): number {
    const factor = Math.pow(10, precision)
    return Math.round(value * factor) / factor
  }

  /**
   * 检查数值是否接近
   */
  static isNear(a: number, b: number, tolerance = 0.001): boolean {
    return Math.abs(a - b) < tolerance
  }

  /**
   * 生成随机数
   */
  static random(min = 0, max = 1): number {
    return Math.random() * (max - min) + min
  }

  /**
   * 生成随机整数
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(this.random(min, max + 1))
  }

  /**
   * 计算最大公约数
   */
  static gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b)
  }

  /**
   * 计算最小公倍数
   */
  static lcm(a: number, b: number): number {
    return (a * b) / this.gcd(a, b)
  }
}