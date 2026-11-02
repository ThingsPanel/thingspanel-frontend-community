declare namespace Northbound {
  /** 连接器能力描述（来自插件 describe） */
  type Capabilities = {
    eventTypes: string[]
    batch: boolean
    ackLevel: string
    idempotency: string
    verify: boolean
    maxBatchEvents: number
  }

  type Connector = {
    id: string
    version: string
    contractVersion: string
    displayName: string
    description: string
    capabilities: Capabilities
    configSchema: Record<string, any>
    secretFields: string[]
    state: 'ready' | 'unreachable' | 'revoked'
    artifactDigest: string
    lastSeenAt: string
    lastError?: string
  }

  type Connection = {
    id: string
    name: string
    connectorId: string
    connectorName?: string
    config: Record<string, any>
    secretFieldsSet: string[]
    revision: number
    state: 'active' | 'needs_repair' | 'disabled'
    failureCode?: string
    createdAt: string
    updatedAt: string
  }

  type Backlog = {
    pending: number
    retryWait: number
    unknown: number
    dead: number
    oldestAgeMs: number
  }

  type Pipeline = {
    id: string
    name: string
    connectionId: string
    connectionName?: string
    connectorId?: string
    filter: Record<string, any>
    transform: Record<string, any>
    serialization: Record<string, any>
    state: 'draft' | 'active' | 'paused' | 'disabled'
    revision: number
    activeVersion?: number
    createdAt: string
    updatedAt: string
    backlog: Backlog
  }

  type Delivery = {
    id: string
    eventId: string
    pipelineId: string
    pipelineName?: string
    deviceId?: string
    eventType?: string
    state: 'pending' | 'leased' | 'retry_wait' | 'delivered' | 'unknown' | 'dead'
    ackLevel?: string
    attempts: number
    idempotencyKey: string
    failureCode?: string
    failureDetail?: string
    createdAt: string
    updatedAt: string
    deliveredAt?: string
    nextAttemptAt?: string
  }

  type PreviewResult = {
    matched: boolean
    matchReason: string
    eventId?: string
    eventType?: string
    subject?: string
    output?: any
    idempotencyKey?: string
    warnings: string[]
  }

  type Check = { name: string; ok: boolean; message?: string }

  type ConnectionTest = {
    ok: boolean
    state: string
    failureCode?: string
    message?: string
    checks: Check[]
  }

  type Overview = {
    contractVersion: string
    tenantId: string
    capabilities: {
      sourceProfile: string
      guaranteeStart: string
      maxBacklogEvents: number
      retentionDays: number
    }
    connectors: Connector[]
    connections: number
    pipelines: number
    activePipelines: number
    deliveries: Backlog & { delivered: number; oldestAt?: string }
    rejects: { capacityRejected: number; lastRejectAt?: string; lastRejectCode?: string }
    generatedAt: string
  }

  /** 社区侧源端状态（本机 Outbox 与 relay） */
  type SourceStatus = {
    enabled: boolean
    sourceProfile: string
    encoreConfigured: boolean
    schemaReady: boolean
    outbox: {
      pending: number
      leased: number
      handedOff: number
      failed: number
      oldestAgeMs: number
      payloadBytes: number
    }
    rejects: { capacity: number; invalid: number }
    relay: { lastSuccessAt?: string; lastError?: string; lastErrorAt?: string }
    subscribedTenants: number
    checkedAt: string
  }
}
