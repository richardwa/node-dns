import { formatDate } from '@/common/config'
import fs, { promises as fsp } from 'fs'
import path from 'path'
import * as readline from 'node:readline'
import zlib from 'zlib'

export class Logger<T extends { date: Date }> {
  private readonly folder: string

  constructor(folder: string) {
    this.folder = folder
    fsp.mkdir(folder, { recursive: true })
  }

  readFile(f: string, cb: (s: string) => void): Promise<void> {
    return new Promise<void>((res, rej) => {
      const filePath = path.join(this.folder, f)
      const input: NodeJS.ReadableStream = f.endsWith('gz')
        ? fs.createReadStream(filePath).pipe(zlib.createGunzip())
        : fs.createReadStream(filePath)

      const lineReader = readline.createInterface({ input })
      lineReader.on('line', cb)
      lineReader.on('close', res)
      lineReader.on('error', rej)
    })
  }

  write(msg: Partial<T>): Promise<void> {
    const date = new Date()
    const today = formatDate(date)
    const line = JSON.stringify({ date, ...msg })
    const filePath = path.join(this.folder, `${today}.log`)
    return fsp.appendFile(filePath, line + '\n')
  }

  async compress() {
    const day = 1000 * 60 * 60 * 24
    const fiveDaysAgo = new Date(Date.now() - 5 * day)
    const yesterday = new Date(Date.now() - day)
    const files = await this.getFileNames(fiveDaysAgo, yesterday)
    const gzip = zlib.createGzip()
    files.forEach((file) => {
      if (file.endsWith('.gz')) {
        return
      }
      console.log('found file for compress', file)
      const filePath = path.join(this.folder, file)
      const source = fs.createReadStream(filePath)
      const destination = fs.createWriteStream(`${filePath}.gz`)
      source.pipe(gzip).pipe(destination)
      destination.on('finish', () => {
        fsp.unlink(filePath)
      })
      destination.on('error', (error) => {
        console.log(error)
      })
    })
  }

  async getFileNames(from: Date = new Date(), to: Date = new Date()): Promise<string[]> {
    const fromStr = formatDate(from)
    const toStr = formatDate(to)
    const files = await fsp.readdir(this.folder, { withFileTypes: true })
    console.log('found files', files)
    return files
      .filter((f) => {
        if (f.isFile()) {
          const date = f.name.substring(0, 10)
          return date >= fromStr && date <= toStr
        }
        return false
      })
      .map((f) => f.name)
  }

  async getLogs(
    from: Date = new Date(),
    to: Date = new Date(),
    cb: (s: string) => void
  ): Promise<void> {
    const files = await this.getFileNames(from, to)
    const promises: Promise<void>[] = []
    for (const file of files) {
      promises.push(this.readFile(file, cb))
    }
    return Promise.all(promises).then(() => {})
  }
}
