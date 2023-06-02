import type { LogData } from '@/common/types'
import * as fs from 'fs'
import * as path from 'path'
import zlib from 'zlib'
import readline from 'readline'
/* 
create a logger in typescript with the following features.
buffer N lines until 1 hour or limit reached.
writes to disk in gzip format.
filename is based on current day.
include method to retrieve all logs from file.
ensure on destroy buffer is written out.
*/

class DataLogger {
  private buffer: string[] = []
  private bufferSize: number
  private bufferTimer: NodeJS.Timeout | null = null
  private logDirectory: string

  constructor(bufferSize: number, logDirectory: string) {
    this.bufferSize = bufferSize
    this.logDirectory = logDirectory
  }

  public log(msg: Partial<LogData>): void {
    const now = Date.now()
    const date = new Date(now).toISOString()
    this.buffer.push(JSON.stringify({ ...msg, now, date }))
    if (this.buffer.length >= this.bufferSize) {
      this.writeLogsToFile()
    }
    if (!this.bufferTimer) {
      this.bufferTimer = setTimeout(() => this.writeLogsToFile(), 60 * 60 * 1000) // 1 hour
    }
  }

  public async onDestroy(): Promise<void> {
    if (this.buffer.length > 0) {
      await this.writeLogsToFile()
    }
    clearTimeout(this.bufferTimer!)
  }

  private logFilePath() {
    const dateStr = new Date().toISOString().substring(0, 10)
    return `${this.logDirectory}/logs_${dateStr}.txt.gz`
  }

  private writeLogsToFile(): void {
    if (this.buffer.length === 0) {
      return
    }

    const logs = this.buffer.join('\n') + '\n'
    const gzip = zlib.createGzip()
    const logFilePath = this.logFilePath()
    const writeStream = fs.createWriteStream(logFilePath)
    const compressedStream = writeStream.pipe(gzip)

    compressedStream.write(logs, () => {
      compressedStream.end(() => {
        console.log('Logs written to file:', logFilePath)
      })
    })

    this.buffer = []
    clearTimeout(this.bufferTimer!)
    this.bufferTimer = null
  }

  public getAllLogs(cb: (l: string) => void, done: () => void): void {
    fs.readdir(this.logDirectory, (err, files) => {
      if (err) {
        return
      }

      const logFiles: string[] = []
      files.forEach((file) => {
        if (file.endsWith('.txt.gz')) {
          logFiles.push(file)
        }
      })

      const processLogFile = (index: number) => {
        if (index === logFiles.length) {
          return
        }

        const logFilePath = `${this.logDirectory}/${logFiles[index]}`
        const readStream = fs.createReadStream(logFilePath)
        const gunzip = zlib.createGunzip()
        const rl = readline.createInterface({
          input: readStream.pipe(gunzip),
          crlfDelay: Infinity
        })

        rl.on('line', cb).on('close', () => {
          processLogFile(index + 1)
        })
      }
      processLogFile(0)
    })
  }
}

export const logger = new DataLogger(10000, path.join(__dirname, 'logs'))
