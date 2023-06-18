import { ServerBase, type EndPoint } from '@/common/config'
import type { IncomingMessage, ServerResponse } from 'http'

type HandlerFunc = (req: IncomingMessage, res: ServerResponse) => void

const parseReqBody = <T>(req: IncomingMessage) =>
  new Promise<T>((res, rej) => {
    const body: string[] = []
    req.on('data', (chunk) => {
      body.push(chunk)
    })
    req.on('end', async () => {
      if (body.length === 0) {
        res(undefined as T)
      } else {
        const str = body.join('')
        res(JSON.parse(str) as T)
      }
    })
  })

export class InterfaceServerManager {
  private handlers = new Map<string, HandlerFunc>()

  custom(path: string, handler: HandlerFunc) {
    for (const key of this.handlers.keys()) {
      if (path.startsWith(key)) {
        throw Error(`Path conflict: ${path} is covered ${key}`)
      }
    }
    this.handlers.set(path, handler)
  }

  registerStream<T extends keyof EndPoint>(
    p: T,
    m: (req: IncomingMessage, res: ServerResponse, ...a: Parameters<EndPoint[T]>) => void
  ) {
    const handler: HandlerFunc = async (req, res) => {
      if (req.method === 'GET') {
        // @ts-ignore
        m(req, res)
      } else if (req.method === 'POST') {
        try {
          const reqBody = await parseReqBody<Parameters<EndPoint[T]>>(req)
          m(req, res, ...reqBody)
        } catch (e) {
          console.error(e)
          res.writeHead(500)
          res.end()
        }
      }
    } 
    this.custom(p, handler)
  }

  register<T extends keyof EndPoint>(
    p: T,
    m: (...a: Parameters<EndPoint[T]>) => ReturnType<EndPoint[T]> | Promise<ReturnType<EndPoint[T]>>
  ) {
    const handler: HandlerFunc = async (req, res) => {
      if (req.method === 'GET') {
        // @ts-ignore
        const result = await m()
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
      } else if (req.method === 'POST') {
        try {
          const reqBody = await parseReqBody<Parameters<EndPoint[T]>>(req)
          const result = await m(...reqBody)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(result))
        } catch (e) {
          console.error(e)
          res.writeHead(500)
          res.end()
        }
      }
    }

    this.custom(p, handler)
  }

  exec(req: IncomingMessage, res: ServerResponse) {
    for (const [key, func] of this.handlers.entries()) {
      const path = `${ServerBase}/${key}`
      if (req.url?.startsWith(path)) {
        func(req, res)
        return true
      }
    }
    return false
  }
}
