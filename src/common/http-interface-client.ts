import { ServerBase, type EndPoint } from '@/common/config'

export const callServer = async <T extends keyof EndPoint>(
  p: T,
  ...arg: Parameters<EndPoint[T]>
) => {
  const path = `${ServerBase}/${p}`
  const resp =
    arg.length > 0
      ? await fetch(path, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(arg)
        })
      : await fetch(path)
  if (resp.headers.get('Content-Type') === 'text/plain') {
    return resp.text() as ReturnType<EndPoint[T]>
  }
  try {
    const json = await resp.json()
    return json as ReturnType<EndPoint[T]>
  } catch (e) {
    return undefined as ReturnType<EndPoint[T]>
  }
}
 