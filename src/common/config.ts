export const serverBase = '/srv'
export const endPoints = {
  state: `${serverBase}/state`,
  block: `${serverBase}/block`,
  unblock: `${serverBase}/unblock`,
  data: `${serverBase}/data`
}

export const formatDate = (d: Date) => d.toISOString().slice(0, 10)
