import type { LogData } from '@/common/types'
import * as fs from 'fs'
import * as path from 'path'
import zlib from 'zlib'

/* 
create a logger in typescript with the following features.
buffer N lines until 1 hour or limit reached.
writes to disk in gzip format.
filename is based on current day.
*/

class Logger {
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
    const writeStream = fs.createWriteStream(logFilePath + '.gz')
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

  public getAllLogs(): Promise<LogData[]> {
    return new Promise((resolve, reject) => {
      fs.readdir(this.logDirectory, (err, files) => {
        if (err) {
          reject(err)
          return
        }

        const logFiles: string[] = []
        files.forEach((file) => {
          if (file.endsWith('.txt.gz')) {
            logFiles.push(file)
          }
        })

        const allLogs = this.buffer.map((l) => JSON.parse(l) as LogData)
        const processLogFile = (index: number) => {
          if (index === logFiles.length) {
            resolve(allLogs)
            return
          }

          const logFilePath = `${this.logDirectory}/${logFiles[index]}`
          const readStream = fs.createReadStream(logFilePath)
          const gunzip = zlib.createGunzip()

          readStream
            .pipe(gunzip)
            .on('data', (data: Buffer) => {
              const logs = data.toString().trim().split('\n')
              allLogs.push(...logs.map((l) => JSON.parse(l) as LogData))
            })
            .on('end', () => {
              processLogFile(index + 1)
            })
            .on('error', (err) => {
              reject(err)
            })
        }

        processLogFile(0)
      })
    })
  }
}

export const logger = new Logger(10, path.join(__dirname, 'logs'))
