import { getApiUrl } from './api-url'

export function getWebSocketUrl(path: string) {
  const url = new URL(getApiUrl(path))

  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'

  return url.toString()
}
