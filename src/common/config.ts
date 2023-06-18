import type { LogData, State } from './types'

export const ServerBase = '/srv' as '/srv'

export type EndPoint = {
  state: () => State
  block: (ip: string) => void
  unblock: (ip: string, durationMinutes?: number) => void
  data: (data1: string, date2: string) => string
}

export const formatDate = (d: Date) => d.toISOString().slice(0, 10)
