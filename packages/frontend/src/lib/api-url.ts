const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const API_VERSION = import.meta.env.VITE_API_VERSION ?? 'v1'

export const API_BASE_URL = new URL(`/api/${API_VERSION}/`, API_URL).toString()

export function getApiUrl(path: string) {
  const normalizedPath = path.replace(/^\/+/, '')

  return new URL(normalizedPath, API_BASE_URL).toString()
}
