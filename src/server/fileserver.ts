import http from 'http'
import fs from 'fs'
import path from 'path'

const cache: { [key: string]: Buffer } = {}

export function serveStaticFile(req: http.IncomingMessage, res: http.ServerResponse) {
  // Get the file path by combining the current working directory with the requested URL
  const filePath = path.join(
    __dirname,
    '../client',
    req.url === '/' || req.url === '' || req.url === null ? '/index.html' : req.url || ''
  )

  // Check if the file is in the cache
  if (cache[filePath]) {
    const fileData = cache[filePath]
    const contentType = getContentType(filePath)
    sendResponse(res, 200, contentType, fileData)
    return
  }

  // Check if the requested file exists
  fs.stat(filePath, (err, stats) => {
    if (err) {
      // File not found
      sendResponse(res, 404, 'text/plain', 'File not found!')
      return
    }

    // Check if the path points to a file
    if (stats.isFile()) {
      // Read the file and serve its contents
      fs.readFile(filePath, (err, data) => {
        if (err) {
          sendResponse(res, 500, 'text/plain', 'Error reading the file!')
          return
        }

        // Set the appropriate content type based on the file extension
        const contentType = getContentType(filePath)

        // Cache the file
        cache[filePath] = data

        sendResponse(res, 200, contentType, data)
      })
    } else {
      // Not a file, return a 403 Forbidden response
      sendResponse(res, 403, 'text/plain', 'Forbidden!')
    }
  })
}

function sendResponse(
  res: http.ServerResponse,
  statusCode: number,
  contentType: string,
  data: Buffer | string
) {
  res.writeHead(statusCode, { 'Content-Type': contentType })
  res.end(data)
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath)
  switch (ext) {
    case '.html':
      return 'text/html'
    case '.css':
      return 'text/css'
    case '.js':
      return 'text/javascript'
    default:
      return 'text/plain'
  }
}
