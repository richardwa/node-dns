import type { LogData } from '@/common/types'
import { Logger } from './log'
import path from 'path'

export const logger = new Logger<LogData>(path.join(process.cwd(), 'data', 'log'))
setTimeout(() => {
  logger.compress()
})
