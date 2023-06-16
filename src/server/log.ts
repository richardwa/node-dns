import type { LogData } from '@/common/types'
import { promises as fs } from 'fs'
import path from 'path'

const folder = path.join(process.cwd(), 'data', 'log')
export const log = (msg: Partial<LogData>): void => {
  const date = new Date()
  const today = date.toLocaleDateString('en-CA')
  const line = JSON.stringify({ date, ...msg })
  const filePath = path.join(folder, `${today}.log`)
  fs.appendFile(filePath, line + '\n')
}
