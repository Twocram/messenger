const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function getWebSocketUrl(path: string) {
  const url = new URL(path, API_URL)

  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'

  return url.toString()
}
