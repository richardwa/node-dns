export const ServerBase = '/srv' as '/srv'
export enum EndPoint {
  state = 'state',
  block = 'block',
  unblock = 'unblock',
  data = 'data'
}
export const getEndpoint = (e: EndPoint) => `${ServerBase}/${e}`

export type EndPointParams = {
  [EndPoint.data]: { date1: string; date2: string }
}

export const formatDate = (d: Date) => d.toISOString().slice(0, 10)
