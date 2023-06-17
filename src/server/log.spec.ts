import type { LogData } from '@/common/types'
import { Logger } from './log'
import path from 'path'
import { test } from 'vitest'

const logger = new Logger<LogData>(path.join(process.cwd(), 'data', 'log'))

test('logger compress', () => {
  logger.compress()
})

test('logger write and retrieve', () => {
  logger.write({ domain: 'test' })
})

test('logger retrieve', () => {
  const day = 1000 * 60 * 60 * 24
  const from = new Date(Date.now() - 5 * day)
  const to = new Date(Date.now() + 5 * day)
  logger.getLogs(from, to, (s) => {
    console.log(s)
  })
})
