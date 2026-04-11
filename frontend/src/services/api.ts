const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return res.json() as T
}

export async function* streamRequest(
  endpoint: string,
  body: unknown
): AsyncGenerator<string> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new ApiError(res.status, await res.text())
  if (!res.body) return

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const raw = decoder.decode(value, { stream: true })
    // Parse SSE lines: "data: {...}\n\n"
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') return
      try {
        const parsed = JSON.parse(payload) as {
          delta?: string
          route?: { task: string; reason: string; model?: string }
          image_url?: string
          error?: string
        }
        // Text delta
        if (parsed.delta) yield parsed.delta
        // Image generation result — render as markdown image
        if (parsed.image_url) yield `![Generated image](${parsed.image_url})`
        // Route info — yield as a small indicator
        if (parsed.route) yield `\n<!-- route: ${parsed.route.task} -->\n`
      } catch {
        // skip malformed lines
      }
    }
  }
}
