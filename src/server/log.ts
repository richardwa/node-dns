import { promises as fs } from 'fs'
import path from 'path'

export class Logger<T> {
  private readonly folder: string
  constructor(folder: string) {
    this.folder = folder
    fs.mkdir(folder, { recursive: true })
  }

  write(msg: Partial<T>): void {
    const date = new Date()
    const today = date.toLocaleDateString('en-CA')
    const line = JSON.stringify({ date, ...msg })
    const filePath = path.join(this.folder, `${today}.log`)
    fs.appendFile(filePath, line + '\n')
  }

  getLogs(from: Date = new Date(), to: Date = new Date()): Promise<Array<T & { date: Date }>> {
    const fromStr = from.toLocaleDateString('en-CA')
    const toStr = to.toLocaleDateString('en-CA')
    const files = fs
      .readdir(this.folder, { withFileTypes: true })
      .then((entries) =>
        Promise.all(
          entries
            .filter((f) => f.isFile())
            .filter((f) => f.name >= fromStr && f.name <= toStr)
            .map((f) =>
              fs.readFile(f.name, 'utf-8').then((s) => JSON.parse(s) as (T & { date: Date })[])
            )
        )
      )
      .then((tt) => tt.flatMap((o) => o.filter((t) => t.date >= from && t.date <= to)))

    return files
  }
}

export const log = new Logger(path.join(process.cwd(), 'data', 'log'))
