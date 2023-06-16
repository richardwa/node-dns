import { formatDate } from '@/common/config'
import type { LogData } from '@/common/types'
import { Dirent, promises as fs } from 'fs'
import path from 'path'

export class Logger<T extends { date: Date }> {
  private readonly folder: string
  constructor(folder: string) {
    this.folder = folder
    fs.mkdir(folder, { recursive: true })
  }
  private readFiles = (f: Dirent) =>
    fs.readFile(path.join(this.folder, f.name), 'utf-8').then((s) => {
      // console.log(f.name)
      const lines = s.split('\n')
      const parsed: T[] = []
      for (const line of lines) {
        try {
          if (line && line != '') {
            const t = JSON.parse(line) as T
            parsed.push(t)
          }
        } catch (e) {
          console.log('parse error', line, e)
        }
      }
      return parsed
    })

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
      .then((entries) => {
        // console.log(entries, fromStr, toStr)
        return Promise.all(
          entries
            .filter((f) => f.isFile())
            .filter((f) => {
              const date = f.name.substring(0, 10)
              return date >= fromStr && date <= toStr
            })
            .map(this.readFiles)
        )
      })
      .then((tt) => tt.flat())

    return files
  }
}

export const log = new Logger<LogData>(path.join(process.cwd(), 'data', 'log'))
