import { formatDate } from '@/common/config'
import type { LogData } from '@/common/types'
import { Dirent, promises as fs } from 'fs'
import path from 'path'
const readFiles = <T>(f: Dirent) =>
  fs.readFile(f.name, 'utf-8').then((s) => s.split('\n').map((m) => JSON.parse(m) as T))

export class Logger<T extends { date: Date }> {
  private readonly folder: string
  constructor(folder: string) {
    this.folder = folder
    fs.mkdir(folder, { recursive: true })
  }

  write(msg: Partial<T>): void {
    const date = new Date()
    const today = formatDate(date)
    const line = JSON.stringify({ date, ...msg })
    const filePath = path.join(this.folder, `${today}.log`)
    fs.appendFile(filePath, line + '\n')
  }

  getLogs(from: Date = new Date(), to: Date = new Date()): Promise<T[]> {
    const fromStr = formatDate(from)
    const toStr = formatDate(to)
    const files = fs
      .readdir(this.folder, { withFileTypes: true })
      .then((entries) =>
        Promise.all(
          entries
            .filter((f) => f.isFile())
            .filter((f) => f.name >= fromStr && f.name <= toStr)
            .map(readFiles<T>)
        )
      )
      .then((tt) => tt.flatMap((o) => o.filter((t) => t.date >= from && t.date <= to)))

    return files
  }
}

export const log = new Logger<LogData>(path.join(process.cwd(), 'data', 'log'))
