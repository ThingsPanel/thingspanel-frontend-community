import type { DeliveryStatus, DispatchStatus, IntakeStatus } from '@/service/api/notification-v2.types'

export interface NotificationStatusLabel {
  zh: string
  en: string
  polling: boolean
  retryAllowed: false
}

export function describeDeliveryStatus(
  dispatchStatus: DispatchStatus,
  deliveryStatus: DeliveryStatus
): NotificationStatusLabel {
  if (dispatchStatus === 'queued') return { zh: '已排队', en: 'Queued', polling: true, retryAllowed: false }
  if (dispatchStatus === 'sending') return { zh: '提交中', en: 'Submitting', polling: true, retryAllowed: false }
  if (dispatchStatus === 'failed') return { zh: '发送失败', en: 'Sending failed', polling: false, retryAllowed: false }
  if (dispatchStatus === 'unknown') {
    return {
      zh: '是否受理未知；系统不会自动重发',
      en: 'Acceptance is unknown; the system will not retry automatically',
      polling: false,
      retryAllowed: false
    }
  }

  const accepted: Record<DeliveryStatus, Omit<NotificationStatusLabel, 'retryAllowed'>> = {
    unsupported: {
      zh: '服务商已受理；此通道不提供送达回执',
      en: 'Provider accepted; this channel has no delivery receipt',
      polling: false
    },
    pending: {
      zh: '服务商已受理；等待送达回执',
      en: 'Provider accepted; waiting for a delivery receipt',
      polling: true
    },
    delivered: {
      zh: '服务商报告已送达；不代表已读',
      en: 'Provider reports delivered; this does not mean read',
      polling: false
    },
    failed: {
      zh: '服务商报告投递失败',
      en: 'Provider reports delivery failed',
      polling: false
    },
    unknown: {
      zh: '送达状态未知；系统不会自动重发',
      en: 'Delivery status is unknown; the system will not retry automatically',
      polling: false
    }
  }
  return { ...accepted[deliveryStatus], retryAllowed: false }
}

export function describeIntakeStatus(intakeStatus: IntakeStatus, blockedReason?: string) {
  if (intakeStatus === 'blocked') {
    return {
      zh: '配置/目标待处理，尚未发送',
      en: 'Configuration/recipient needs attention; nothing was sent',
      reason: blockedReason || '',
      retryAllowed: false as const
    }
  }
  return {
    zh: '请求已接收',
    en: 'Request received',
    reason: '',
    retryAllowed: false as const
  }
}

export function getLegacyHistoryStatus(status: string) {
  return `旧历史 · ${status}`
}
