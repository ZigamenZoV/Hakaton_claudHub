import { useEffect, useRef } from 'react'

export function useScrollToBottom<T extends HTMLElement>(dependency: unknown) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (isNearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [dependency])

  return ref
}
